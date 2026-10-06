import {distance} from '../places.js';
function project(origin,a,b){const scale=Math.cos(origin.lat*Math.PI/180),dx=(b.lng-a.lng)*scale,dy=b.lat-a.lat;const t=Math.max(0,Math.min(1,(((origin.lng-a.lng)*scale)*dx+(origin.lat-a.lat)*dy)/(dx*dx+dy*dy||1)));return {lat:a.lat+t*(b.lat-a.lat),lng:a.lng+t*(b.lng-a.lng)};}
export function pickupCandidates(elements,origin){
 const rows=[];
 for(const e of elements){const tags=e.tags||{};if(tags.amenity==='taxi'&&Number.isFinite(e.lat)&&Number.isFinite(e.lon)){const p={lat:e.lat,lng:e.lon};rows.push({...p,id:`pickup-${e.id}`,name:tags.name||'택시 승강장',kind:'taxi-rank',distance:distance(origin,p)});continue;}
 if(!['primary','secondary','tertiary'].includes(tags.highway)||!tags.name||!Array.isArray(e.geometry)||tags.access==='no'||tags.foot==='no'||tags.bridge==='yes'||tags.tunnel==='yes')continue;
 let best=null;for(let i=1;i<e.geometry.length;i++){const a={lat:e.geometry[i-1].lat,lng:e.geometry[i-1].lon},b={lat:e.geometry[i].lat,lng:e.geometry[i].lon};const p=project(origin,a,b),meters=distance(origin,p);if(!best||meters<best.distance)best={...p,distance:meters};}
 if(best)rows.push({...best,id:`pickup-road-${e.id}`,name:`${tags.name} 인근`,kind:'main-road'});
 }
 return rows.filter(p=>p.distance<=800).sort((a,b)=>(a.kind==='taxi-rank'?0:1)-(b.kind==='taxi-rank'?0:1)||a.distance-b.distance).filter((p,i,all)=>all.findIndex(x=>x.name===p.name)===i).slice(0,4);
}
export async function findPickupCandidates(origin,{fetcher=fetch,signal}={}){
 const query=`[out:json][timeout:15];(node[amenity=taxi](around:800,${origin.lat},${origin.lng});way[highway~"^(primary|secondary|tertiary)$"][name](around:800,${origin.lat},${origin.lng}););out tags geom;`;
 const response=await fetcher('https://overpass-api.de/api/interpreter',{method:'POST',body:new URLSearchParams({data:query}),signal:AbortSignal.any([signal,AbortSignal.timeout(20000)].filter(Boolean))});if(!response.ok)throw new Error('승차 위치 조회 실패');const data=await response.json();if(data.remark||!Array.isArray(data.elements))throw new Error('승차 위치 조회 실패');return pickupCandidates(data.elements,origin);
}
