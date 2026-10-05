import {estimateEta} from '../arrivalEngine.js';
import {distance} from '../places.js';
export const defaultContext=()=>({trafficDelay:0,missedTrains:0,bikeRoute:'FAST',elapsed:0,boarded:false});
export function transitRoute(context={},demo=false,base=25){
 const walk=3,buffer=1,arrivals=[2,...Array.from({length:200},(_,i)=>7+i*8)];
 const eligible=arrivals.filter(n=>n>=walk+buffer);
 const reachableIndex=context.boarded?0:Math.max(0,eligible.findIndex(n=>n>=(context.elapsed||0)+walk+buffer));
 const train=eligible[Math.min(Math.max(context.missedTrains||0,reachableIndex),eligible.length-1)];
 return {walkToStation:walk,boardingBuffer:buffer,arrivals,nextTrain:train,ride:demo?18:Math.max(4,base-13),finalWalk:3,total:train+(demo?18:Math.max(4,base-13))+3,boarded:!!context.boarded,source:'Demo transit data'};
}
export function bikeRoutes(base=29){return [{type:'FAST',minutes:base,risk:67,bikeRoadShare:.35,hotspots:3,intersections:8},{type:'SAFE',minutes:base+4,risk:21,bikeRoadShare:.85,hotspots:0,intersections:3}].map(r=>({...r,components:{distanceScore:Math.max(0,20-r.minutes/3),bikeRoadScore:r.bikeRoadShare*40,accidentRiskScore:-r.hotspots*8,intersectionRiskScore:-r.intersections*2,signalScore:0},score:Math.round(Math.max(0,20-r.minutes/3)+r.bikeRoadShare*40-r.hotspots*8-r.intersections*2),source:'Demo bike route / risk'}));}
export function humanEta({origin,destination,mode='taxi',departureTime=Date.now(),context=defaultContext(),demo=false}){
 const base=demo?({taxi:24,car:22,transit:28,bike:29,walk:55}[mode]):estimateEta(origin,destination,mode);
 let total=base,route={source:'거리 기반 추정 · 실시간 교통 미반영'};
 if(mode==='taxi'||mode==='car'){total+=context.trafficDelay||0;route.traffic=context.trafficDelay?'정체 시나리오':'교통 미반영';}
 if(mode==='transit'){route=transitRoute(context,demo,base);total=route.total;}
 if(mode==='bike'){route={options:bikeRoutes(base),...bikeRoutes(base).find(r=>r.type===(context.bikeRoute||'FAST'))};total=route.minutes;}
 if(mode==='walk')route={distanceKm:distance(origin,destination)*1.35/1000,speedKmh:4.5,source:'거리·보행 속도 기반 추정'};
 const arrival=departureTime+total*60000;
 return {mode:mode.toUpperCase(),transportMode:mode,origin,destination,departureTime,etaMinutes:Math.max(0,total-(context.elapsed||0)),initialMinutes:total,estimatedArrivalTime:arrival,humanArrivalETA:arrival,confidence:'추정',route,context,events:[],source:demo?'Demo mobility data':route.source};
}
