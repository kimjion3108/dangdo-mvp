# Uploaded ORBIT Bike integration

## What was actually provided

`orbit-bike.zip` contains Python `server.py`, web navigation UI and `bicycle_roads.json` (11,964 records), alongside local secret and chat database files. Secret values and chat data are not published or imported into DANGDO. The public GitHub ORBIT repository was empty, but this uploaded project is real source and supersedes that earlier blocker.

## Reused source behavior

- `route_bicycle`: Valhalla / OpenStreetMap bicycle costing, quick road profile (22 km/h, roads .55, hills .45) versus friendly hybrid profile (18 km/h, roads .18, hills .25). DANGDO adds a bike-priority candidate with roads .05.
- `decode_polyline6`: source geometry decoder ported to JavaScript. Raw route coordinates, summary and maneuver indices remain available.
- `nearestRouteIndex`, `routeDistanceBetween`, `updateNavigation`: adapted to React GPS navigation, remaining distance/time, next instruction, optional browser voice guidance and >90m deviation reroute with 25-second cooldown. GPS accuracy >80m is not used for navigation updates. GPS-derived ETA propagates to existing commerce/preparation/robot scheduling.
- `accident_query/get_accidents`: official server-side KoROAD adapter, scope/year cache, verified success and complete pagination, original polygon geometry and casualty counts. It does not collapse polygons into invented accident markers or treat service errors as no accidents.
- `nearest_bike_road`: endpoint inventory lookup, with Seoul/Daejeon subset (698 records) from uploaded source. This inventory has no full road geometry or verified source date; it is not drawn as cycle lanes or used to report cycle-lane percentages.

The uploaded source's friendly route prefers roads/cycleways, and its accident overlay highlights nearby risks. It did not submit accident geometry to routing. DANGDO now adds this missing link: detected polygon exposure → `exclude_polygons` → genuine new Valhalla candidate → baseline score → SAFE selection → changed ETA → recommendation, preparation and dispatch. Origin/destination inside a polygon are not forcibly excluded; failure keeps valid existing candidates with a notice.

## Frontend activation

When no DANGDO API backend is configured, GitHub Pages directly uses the same public Valhalla endpoint as ORBIT. It supports browser CORS, requires no secret, and returns real geometry. Three requests are serialized with >1 second spacing and successful trips are cached five minutes; this is a public prototype service with no production SLA. For sustained deployment configure `VITE_ORBIT_ROUTING_URL` to an operated Valhalla service. Map rendering remains Kakao Maps where available.

Accident queries require an operated backend: `DATA_GO_KR_KEY` / `KOROAD_API_KEY` only in server environment, `KOROAD_YEAR`, and `ORBIT_KOROAD_SCOPES` with certified geographic bounds and district codes. `ORBIT_HOTSPOTS_FILE` still permits a normalized, sourced GeoJSON export instead. Frontend REST keys/localStorage secret storage are never used.

## Real external verification

The uploaded public key was used only for read-only official accident requests, without logging it. Those requests returned `INVALID_REQUEST_PARAMETER_ERROR` (400) or network timeout. No accident polygons were obtained, so current production risk scores and accident-avoidance remain unavailable until backend/public-data access is repaired. The UI retains real FAST/friendly directions and never declares zero danger from failed data.

A real Valhalla request from KAIST coordinates (36.3726,127.3604) to Expo Science Park area coordinates (36.377,127.385) succeeded. Its unprofiled response was 3.186km / 706 seconds. This is a routing result, not a live rider arrival or safe-route result. Profile-specific external checks are recorded separately. No real risk decrease, hotspot avoidance count or lane percentage is claimed without public accident data.

## Payment

Existing white/yellow DANGDO product → KakaoPay method → amount confirmation → local MVP order → Arrival Sync is retained. Consent disclosure, confirmation close/cancel and order cancellation remain functional. No actual KakaoPay transaction or merchant submission occurs.

## Tests

64 Node tests cover source decoder, guidance indices, costing/exclusion payload, GPS progress/deviation, inventory limits, official accident normalization/cache, detected-polygon reroute and real candidate selection, plus previous commerce tests. 390×844 Chromium fixture checks cover five modes, geometry/ETA/deal change, robot reassignment, GPS navigation start/stop, payment consent/confirmation/cancellation/completion, sharing, refresh, back, overflow and runtime errors. Fixture navigation tests do not prove physical navigation or real public accident access.

### Profile-specific real response

| ORBIT profile | Seconds | Rounded minutes | Distance |
|---|---:|---:|---:|
| Quick / SHORTEST | 602.471 | 11 | 3,186 m |
| Friendly / ACCESSIBLE | 706.011 | 12 | 3,186 m |
| Bike-priority / BIKE_ONLY | 848.197 | 15 | 4,080 m |

Quick and bike-priority returned different coordinate paths. The latter adds 894m and 4 rounded minutes. **Bike-priority is not a verified accident-safe route**: public risk data were unavailable, so real risk score, accident hotspot count, reduction and bike-lane percentage are unknown.
