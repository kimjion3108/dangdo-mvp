
import {estimateEta} from '../arrivalEngine.js';
import {distance} from '../places.js';
import {paceFactor} from '../personalization.js';
export const defaultContext=()=>({trafficDelay:0,missedTrains:0,bikeRoute:'FAST',elapsed:0,boarded:false});
export function transitRoute(context={},demo=false,base=25){
 const walk=3,buffer=1,arrivals=[2,...Array.from({length:200},(_,i)=>7+i*8)];
 const eligible=arrivals.filter(n=>n>=walk+buffer);
 const reachableIndex=context.boarded?0:Math.max(0,eligible.findIndex(n=>n>=(context.elapsed||0)+walk+buffer));
 const train=eligible[Math.min(Math.max(context.missedTrains||0,reachableIndex),eligible.length-1)];
 return {walkToStation:walk,boardingBuffer:buffer,arrivals,nextTrain:train,ride:demo?18:Math.max(4,base-13),finalWalk:3,total:train+(demo?18:Math.max(4,base-13))+3,boarded:!!context.boarded,source:'Demo transit data'};
}
export const BIKE_WEIGHTS=Object.freeze({FAST:0.2,BALANCED:0.8,SAFE:2.0});
export function bikeCost(route,profile){if(!(profile in BIKE_WEIGHTS))throw new Error('Unknown bike profile');if(!Number.isFinite(route.minutes)||route.minutes<0||!Number.isFinite(route.risk)||route.risk<0||route.risk>100)throw new Error('Invalid bike route');return route.minutes+BIKE_WEIGHTS[profile]*route.risk;}
export function selectBikeRoute(candidates,profile){if(!candidates.length)throw new Error('No bike routes');return candidates.map(r=>({...r,cost:bikeCost(r,profile)})).sort((a,b)=>a.cost-b.cost||a.risk-b.risk||a.minutes-b.minutes||String(a.id).localeCompare(String(b.id)))[0];}
export function bikeRoutes(base,origin,destination,context={}){return context.bikeAnalysis?.options||[];}
export function humanEta({origin,destination,mode='taxi',departureTime=Date.now(),context=defaultContext(),demo=false}){
 const base=demo?({taxi:24,car:22,transit:28,bike:29,walk:55}[mode]):estimateEta(origin,destination,mode);
 let total=base,route={source:'거리 기반 추정 · 실시간 교통 미반영'};
 if(mode==='taxi'||mode==='car'){total+=context.trafficDelay||0;route.traffic=context.trafficDelay?'정체 시나리오':'교통 미반영';}
 if(mode==='transit'){route=transitRoute(context,demo,base);total=route.total;}
 if(mode==='bike'){const options=bikeRoutes(base,origin,destination,context);const selected=options.find(r=>r.type===(context.bikeRoute||'FAST'))||options[0];route={...context.bikeAnalysis,options,...selected};if(!selected)return {mode:'BIKE',transportMode:'bike',origin,destination,departureTime,etaMinutes:null,initialMinutes:null,estimatedArrivalTime:null,humanArrivalETA:null,route:{...route,status:context.bikeAnalysis?.status||'unavailable'},context};total=route.minutes;}
 if(mode==='walk'){total=Math.ceil(base*paceFactor(context.preferences));} total=Math.ceil(total);
 if(mode==='walk')route={distanceKm:distance(origin,destination)*1.35/1000,speedKmh:4.5/paceFactor(context.preferences),source:'거리·보행 속도 기반 추정'};
 const arrival=departureTime+total*60000;
 return {isDemo:demo,mode:mode.toUpperCase(),transportMode:mode,origin,destination,departureTime,etaMinutes:Math.max(0,Math.ceil(total-(context.elapsed||0))),initialMinutes:total,estimatedArrivalTime:arrival,humanArrivalETA:arrival,confidence:'추정',route,context,events:[],source:demo?'Demo mobility data':route.source};
}
