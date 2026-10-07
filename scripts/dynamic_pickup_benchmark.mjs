const AREAS = [
  { name: '서교동(홍대입구권)', lat: 37.5563, lng: 126.9236, n: 25 },
  { name: '종로1·2·3·4가동(종로권)', lat: 37.5704, lng: 126.9920, n: 25 },
];

const OVERPASS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];
const OSRM = 'https://router.project-osrm.org';
const WALK_MPS = 4.5 * 1000 / 3600;
const WALK_DETOUR = 1.25;
const CHANGE_SECONDS = 30;
const CHANGE_RATIO = 0.10;

const sleep = ms => new Promise(r => setTimeout(r, ms));

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}
const random = rng(20261007);

function distance(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function offset(center, meters, bearingDeg) {
  const br = bearingDeg * Math.PI / 180;
  const dLat = (meters * Math.cos(br)) / 111320;
  const dLng = (meters * Math.sin(br)) / (111320 * Math.cos(center.lat * Math.PI / 180));
  return { lat: center.lat + dLat, lng: center.lng + dLng };
}

function project(origin, a, b) {
  const scale = Math.cos(origin.lat * Math.PI / 180);
  const dx = (b.lng - a.lng) * scale;
  const dy = b.lat - a.lat;
  const den = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1,
    (((origin.lng - a.lng) * scale) * dx + (origin.lat - a.lat) * dy) / den
  ));
  return { lat: a.lat + t * (b.lat - a.lat), lng: a.lng + t * (b.lng - a.lng) };
}

async function fetchJson(url, options = {}, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, {
        ...options,
        headers: {
          'user-agent': 'DANGDO-research-benchmark/0.1',
          ...(options.headers || {}),
        },
      });
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      return await r.json();
    } catch (e) {
      last = e;
      await sleep(800 * (i + 1));
    }
  }
  throw last;
}

async function fetchRoadElements(area) {
  const query = `[out:json][timeout:30];
(
  node[amenity=taxi](around:1600,${area.lat},${area.lng});
  way[highway~"^(primary|secondary|tertiary)$"][name](around:1600,${area.lat},${area.lng});
);
out tags geom;`;
  let last;
  for (const endpoint of OVERPASS) {
    try {
      const body = new URLSearchParams({ data: query });
      const json = await fetchJson(endpoint, { method: 'POST', body }, 2);
      if (!Array.isArray(json.elements)) throw new Error('No elements');
      return json.elements;
    } catch (e) {
      last = e;
    }
  }
  throw last;
}

function candidatePool(elements, rider, radius = 300) {
  const raw = [];
  for (const e of elements) {
    const tags = e.tags || {};
    if (tags.amenity === 'taxi' && Number.isFinite(e.lat) && Number.isFinite(e.lon)) {
      const p = { lat: e.lat, lng: e.lon };
      raw.push({
        ...p,
        id: `taxi-${e.id}`,
        kind: 'taxi-rank',
        name: tags.name || '택시 승강장',
        walkMeters: distance(rider, p),
      });
      continue;
    }
    if (!['primary', 'secondary', 'tertiary'].includes(tags.highway)) continue;
    if (!Array.isArray(e.geometry) || e.geometry.length < 2) continue;
    if (tags.access === 'no' || tags.bridge === 'yes' || tags.tunnel === 'yes') continue;
    let best = null;
    for (let i = 1; i < e.geometry.length; i++) {
      const a = { lat: e.geometry[i - 1].lat, lng: e.geometry[i - 1].lon };
      const b = { lat: e.geometry[i].lat, lng: e.geometry[i].lon };
      const p = project(rider, a, b);
      const m = distance(rider, p);
      if (!best || m < best.walkMeters) best = { ...p, walkMeters: m };
    }
    if (best) raw.push({
      ...best,
      id: `road-${e.id}`,
      kind: 'main-road',
      name: tags.name || tags['name:ko'] || '주요도로',
    });
  }

  const inRadius = raw.filter(x => x.walkMeters <= radius).sort((a, b) => a.walkMeters - b.walkMeters);
  const dedup = [];
  for (const c of inRadius) {
    if (dedup.some(x => distance(x, c) < 25)) continue;
    dedup.push(c);
    if (dedup.length >= 8) break;
  }
  return dedup;
}

async function routeTable(driver, destinations) {
  const coords = [driver, ...destinations].map(p => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`).join(';');
  const destIdx = destinations.map((_, i) => i + 1).join(';');
  const url = `${OSRM}/table/v1/driving/${coords}?sources=0&destinations=${destIdx}&annotations=duration,distance`;
  const json = await fetchJson(url, {}, 3);
  if (json.code !== 'Ok') throw new Error(`OSRM: ${json.code}`);
  return {
    durations: json.durations?.[0] || [],
    distances: json.distances?.[0] || [],
  };
}

function pctl(arr, p) {
  if (!arr.length) return null;
  const a = [...arr].sort((x, y) => x - y);
  const idx = Math.min(a.length - 1, Math.max(0, Math.ceil(p * a.length) - 1));
  return a[idx];
}
const mean = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
const round = (x, n = 1) => x == null ? null : Number(x.toFixed(n));

function summarize(rows) {
  const staticT = rows.map(r => r.staticMeet);
  const nearestT = rows.map(r => r.nearestMeet);
  const dangdoT = rows.map(r => r.dangdoMeet);
  const staticD = rows.map(r => r.staticDriveMeters);
  const dangdoD = rows.map(r => r.dangdoDriveMeters);
  const walks = rows.map(r => r.dangdoWalkMeters);
  const savedStatic = rows.map(r => r.staticMeet - r.dangdoMeet);
  const savedNearest = rows.map(r => r.nearestMeet - r.dangdoMeet);
  return {
    n: rows.length,
    changed: rows.filter(r => r.changed).length,
    changedPct: round(100 * rows.filter(r => r.changed).length / rows.length),
    improvedVsStatic: rows.filter(r => r.dangdoMeet < r.staticMeet - 1).length,
    improved10PctVsStatic: rows.filter(r => (r.staticMeet - r.dangdoMeet) / r.staticMeet >= .10).length,
    meanMeetMin: {
      static: round(mean(staticT) / 60, 2),
      nearest: round(mean(nearestT) / 60, 2),
      dangdo: round(mean(dangdoT) / 60, 2),
    },
    p90MeetMin: {
      static: round(pctl(staticT, .90) / 60, 2),
      nearest: round(pctl(nearestT, .90) / 60, 2),
      dangdo: round(pctl(dangdoT, .90) / 60, 2),
    },
    meanReductionPct: {
      vsStatic: round(100 * (mean(staticT) - mean(dangdoT)) / mean(staticT), 2),
      vsNearest: round(100 * (mean(nearestT) - mean(dangdoT)) / mean(nearestT), 2),
    },
    meanSavedSeconds: {
      vsStatic: round(mean(savedStatic), 1),
      vsNearest: round(mean(savedNearest), 1),
    },
    meanDriveMeters: {
      static: round(mean(staticD)),
      dangdo: round(mean(dangdoD)),
      reductionPct: round(100 * (mean(staticD) - mean(dangdoD)) / mean(staticD), 2),
    },
    passengerWalkMeters: {
      mean: round(mean(walks)),
      median: round(pctl(walks, .50)),
      p90: round(pctl(walks, .90)),
    },
  };
}

async function runArea(area) {
  console.log(`\n[AREA] ${area.name}`);
  const elements = await fetchRoadElements(area);
  console.log(`OSM elements: ${elements.length}`);
  const rows = [];

  for (let i = 0; i < area.n; i++) {
    const rider = offset(area, 50 + random() * 500, random() * 360);
    const driver = offset(area, 350 + random() * 850, random() * 360);
    let candidates = candidatePool(elements, rider, 300);
    if (candidates.length < 2) candidates = candidatePool(elements, rider, 500);
    if (!candidates.length) {
      console.log(`skip ${i + 1}: no candidate`);
      continue;
    }

    const destinations = [rider, ...candidates];
    let table;
    try {
      table = await routeTable(driver, destinations);
    } catch (e) {
      console.log(`skip ${i + 1}: ${e.message}`);
      continue;
    }
    const [staticDrive, ...candDrive] = table.durations;
    const [staticDist, ...candDist] = table.distances;
    if (!Number.isFinite(staticDrive)) continue;

    const scored = candidates.map((c, idx) => {
      const driveSec = candDrive[idx];
      const driveMeters = candDist[idx];
      const walkSec = c.walkMeters * WALK_DETOUR / WALK_MPS;
      const meetSec = Number.isFinite(driveSec) ? Math.max(walkSec, driveSec) : Infinity;
      return { ...c, driveSec, driveMeters, walkSec, meetSec };
    }).filter(x => Number.isFinite(x.meetSec));
    if (!scored.length) continue;

    const nearest = [...scored].sort((a, b) => a.walkMeters - b.walkMeters)[0];
    const best = [...scored].sort((a, b) => a.meetSec - b.meetSec || a.walkSec - b.walkSec)[0];
    const staticMeet = staticDrive;
    const rawImprove = staticMeet - best.meetSec;
    const passes = rawImprove >= CHANGE_SECONDS || rawImprove / staticMeet >= CHANGE_RATIO;
    const selected = passes ? best : {
      id: 'static',
      walkMeters: 0,
      walkSec: 0,
      driveSec: staticDrive,
      driveMeters: staticDist,
      meetSec: staticMeet,
    };

    rows.push({
      area: area.name,
      staticMeet,
      nearestMeet: nearest.meetSec,
      dangdoMeet: selected.meetSec,
      staticDriveMeters: staticDist,
      dangdoDriveMeters: selected.driveMeters,
      dangdoWalkMeters: selected.walkMeters,
      changed: selected.id !== 'static',
      candidateCount: scored.length,
    });
    await sleep(350);
  }
  return rows;
}

const all = [];
const byArea = {};
for (const area of AREAS) {
  const rows = await runArea(area);
  all.push(...rows);
  byArea[area.name] = summarize(rows);
}
const overall = summarize(all);
const report = {
  generatedAt: new Date().toISOString(),
  method: {
    scenarios: 'deterministic synthetic rider/driver locations around two real Seoul areas',
    roadData: 'live OpenStreetMap/Overpass primary-secondary-tertiary roads and taxi ranks',
    drivingEta: 'live OSRM public demo routing, no traffic',
    walkEta: 'straight-line distance × 1.25 detour factor at 4.5 km/h',
    candidateSafety: 'proxy only; main road/taxi-rank filter, not legal curb validation',
    selector: 'minimize max(passenger walk ETA, driver driving ETA), then 30s or 10% hysteresis',
  },
  overall,
  byArea,
};

console.log('\n=== DANGDO DYNAMIC PICKUP BENCHMARK ===');
console.log(JSON.stringify(report, null, 2));
console.log('\nIMPORTANT: This is a hybrid network simulation, not a field test and not live Kakao traffic data.');
