import {koroadService} from './koroad.js';
import {readFile} from 'node:fs/promises';
const modes=new Set(['BIKE_ONLY','SHORTEST','ACCESSIBLE']);
export function bicycleService({env,fetcher=fetch}){const cache=new Map();const liveAccidents=koroadService({env,fetcher});let publicData;
 const error=(status,message)=>Object.assign(new Error(message),{status});
 return {async route(params){
  if(!env.KAKAO_REST_API_KEY)throw error(503,'자전거 경로 서버 설정이 아직 완료되지 않았어요.');
  const q=new URLSearchParams();for(const k of ['start_x','start_y','end_x','end_y']){const raw=params.get(k),n=Number(raw);if(raw===null||raw.trim()===''||!Number.isFinite(n)||Math.abs(n)>(k.endsWith('x')?180:90))throw error(400,'출발지와 목적지 좌표를 확인해 주세요.');q.set(k,String(n));}
  const mode=params.get('route_mode')||'BIKE_ONLY';if(!modes.has(mode))throw error(400,'지원하지 않는 경로 옵션입니다.');q.set('route_mode',mode);q.set('input_coord','WGS84');q.set('output_coord','WGS84');
  const key=q.toString(),hit=cache.get(key);if(hit&&Date.now()-hit.time<300000)return hit.data;
  let r,data;try{r=await fetcher('https://dapi.kakao.com/v2/routing/bicycle?'+q,{headers:{Authorization:'KakaoAK '+env.KAKAO_REST_API_KEY},signal:AbortSignal.timeout(12000)});data=await r.json();}catch{throw error(502,'경로 서버 응답이 지연되고 있어요. 다시 시도해 주세요.');}
  if(!r.ok)throw error(502,'카카오 자전거 경로 연결을 확인해 주세요.');
  if(data.status!=='OK')throw error(422,'자전거 경로를 찾지 못했어요. 출발지와 목적지를 확인해 주세요.');
  // Return only documented routing payload, never upstream headers or error bodies.
  const result={status:data.status,route:data.route};if(cache.size>=100)cache.delete(cache.keys().next().value);cache.set(key,{time:Date.now(),data:result});return result;
 },async hotspots(params){

  const bbox=(params.get('bbox')||'').split(',').map(Number);if(bbox.length!==4||bbox.some(n=>!Number.isFinite(n))||bbox[0]>=bbox[2]||bbox[1]>=bbox[3]||bbox[2]-bbox[0]>2||bbox[3]-bbox[1]>2)throw error(400,'조회 영역을 확인해 주세요.');
  if(!env.ORBIT_HOTSPOTS_FILE){try{return await liveAccidents(bbox);}catch(e){throw error(503,e.message);}}
  try{if(!publicData)publicData=JSON.parse(await readFile(env.ORBIT_HOTSPOTS_FILE,'utf8'));}catch{throw error(503,'사고 데이터를 읽지 못했어요.');}
  const c=publicData.coverageBounds;if(publicData.type!=='FeatureCollection'||!Array.isArray(publicData.features)||!publicData.source?.url||!publicData.source?.year||!Array.isArray(c)||bbox[0]<c[0]||bbox[1]<c[1]||bbox[2]>c[2]||bbox[3]>c[3])throw error(503,'이 지역의 사고 데이터 범위를 확인하지 못했어요.');
  if(publicData.features.some(f=>!['Polygon','MultiPolygon'].includes(f.geometry?.type)||!Array.isArray(f.geometry.coordinates)||f.id===undefined))throw error(503,'사고 데이터 형식을 확인해 주세요.');
  const features=publicData.features.filter(f=>{if(!['Polygon','MultiPolygon'].includes(f.geometry?.type))return false;const points=f.geometry.coordinates.flat(f.geometry.type==='Polygon'?1:2);return points.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite))&&Math.min(...points.map(p=>p[0]))<=bbox[2]&&Math.max(...points.map(p=>p[0]))>=bbox[0]&&Math.min(...points.map(p=>p[1]))<=bbox[3]&&Math.max(...points.map(p=>p[1]))>=bbox[1];});
  return {coverage:true,features,source:publicData.source};
 }};
}
