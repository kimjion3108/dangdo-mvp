import {distance} from '../places.js';
export const SEARCH_RADII=[1000,3000,7000,15000,20000];
// Use real search results; widening never changes the destination or invents stores.
export async function findNearbyMerchants({destination,search,signal,onProgress=()=>{},minimum=3,radii=SEARCH_RADII}){
 const found=new Map();let successful=false,lastError;
 for(const radius of radii){
  signal?.throwIfAborted();
  try{
   const rows=await search(radius);signal?.throwIfAborted();successful=true;
   for(const p of rows){if(!p.id||!p.name||!Number.isFinite(p.lat)||!Number.isFinite(p.lng))continue;
    const kind=p.kind==='간편식'?'음식점':p.kind;
    found.set(p.id,{...p,kind,distance:distance(destination,p)});
   }
   const places=[...found.values()].sort((a,b)=>a.distance-b.distance);
   onProgress({places,radius});
   if(['카페','음식점'].every(kind=>places.filter(p=>p.kind===kind).length>=minimum))break;
  }catch(e){if(signal?.aborted||e.name==='AbortError')throw e;lastError=e;}
 }
 if(!successful)throw lastError||new Error('주변 상점 검색 실패');
 return [...found.values()].sort((a,b)=>a.distance-b.distance);
}
