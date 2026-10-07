import {distance} from '../places.js';
import {paceFactor} from '../personalization.js';
// MVP comparison model, not a metered/live taxi quote.
export function scorePickup(p,destination,now=Date.now(),preferences={}){
 const walkMinutes=Math.max(0,Math.ceil(p.distance/75*paceFactor(preferences)));const driveKm=distance(p,destination)*1.35/1000;
 const rideMinutes=Math.max(1,Math.ceil(driveKm/30*60));
 const estimatedFare=Math.round((4800+Math.max(0,driveKm-1.6)*1000)/100)*100;
 const totalMinutes=walkMinutes+rideMinutes+3;
 const score=totalMinutes*1.4+estimatedFare/1000+walkMinutes*.8+(p.kind==='taxi-rank'?-2:0);
 const accessCost=({tagged:0,unknown:1000,blocked:100000}[p.accessStatus||'unknown'])+walkMinutes;return {...p,accessReason:p.accessReason||'무장애 접근 정보 확인이 필요한 지점이에요',accessCost,walkMinutes,rideMinutes,totalMinutes,estimatedFare,estimatedArrivalTime:now+totalMinutes*60000,score,fareSource:'MVP distance model'};
}
export function rankPickups(candidates,destination,sort='recommended',now=Date.now(),preferences={}){
 const rows=candidates.filter(p=>sort!=='accessible'||p.accessStatus!=='blocked').map(p=>scorePickup(p,destination,now,preferences));const key={recommended:'score',price:'estimatedFare',walk:'walkMinutes',arrival:'totalMinutes',accessible:'accessCost'}[sort]||'score';return rows.sort((a,b)=>a[key]-b[key]||a.totalMinutes-b.totalMinutes||a.distance-b.distance||a.id.localeCompare(b.id));
}
