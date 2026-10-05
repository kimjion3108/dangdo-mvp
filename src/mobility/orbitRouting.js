// Local illustrative routing graph. Coordinates and segment attributes are DEMO,
// never actual road topology, public accident observations or safe navigation.
const M=111320;
export function pointSegmentDistance(p,a,b){const c=Math.cos((a.lat+b.lat)*Math.PI/360),x=(p.lng-a.lng)*M*c,y=(p.lat-a.lat)*M,dx=(b.lng-a.lng)*M*c,dy=(b.lat-a.lat)*M,t=Math.max(0,Math.min(1,(x*dx+y*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-dx*t,y-dy*t);}
const length=(a,b)=>Math.hypot((b.lat-a.lat)*M,(b.lng-a.lng)*M*Math.cos((a.lat+b.lat)*Math.PI/360));
export function segmentRisk(s){return s.accidentRisk*4+s.intersectionRisk*3+(1-s.bikeLane)*20+s.arterialRoadRisk*20+s.crossingRisk*1.5;}
export function analyzeRoute(candidate,hazards){
 const raw=candidate.path.slice(1).map((b,i)=>({a:candidate.path[i],b,distance:length(candidate.path[i],b)}));const total=raw.reduce((n,s)=>n+s.distance,0);
 // Split actual candidate geometry where its DEMO bike-lane allocation changes.
 let used=0;const segments=[];raw.forEach(s=>{const laneEnd=total*candidate.laneShare;const cuts=used<laneEnd&&used+s.distance>laneEnd?[laneEnd-used,s.distance-(laneEnd-used)]:[s.distance];let a=s.a;cuts.forEach(d=>{const t=d/Math.max(length(a,s.b),1),b={lat:a.lat+(s.b.lat-a.lat)*t,lng:a.lng+(s.b.lng-a.lng)*t};segments.push({a,b,distance:d,travelTime:candidate.minutes*d/total,bikeLane:used<laneEnd,accidentRisk:0,intersectionRisk:0,arterialRoadRisk:candidate.arterial,crossingRisk:0,source:'Demo segment data'});used+=d;a=b;});});
 const passed=hazards.filter(h=>segments.some(s=>pointSegmentDistance(h,s.a,s.b)<=h.radius));
 passed.forEach(h=>{const s=segments.reduce((a,b)=>pointSegmentDistance(h,a.a,a.b)<=pointSegmentDistance(h,b.a,b.b)?a:b);s.accidentRisk+=h.severity;});
 for(let i=0;i<candidate.intersections;i++)segments[i%segments.length].intersectionRisk++;
 for(let i=0;i<candidate.crossings;i++)segments[i%segments.length].crossingRisk++;
 segments.forEach(s=>{s.risk=segmentRisk(s);});
 const bikeLaneMeters=segments.filter(s=>s.bikeLane).reduce((n,s)=>n+s.distance,0);
 const components={accidentPenalty:segments.reduce((n,s)=>n+s.accidentRisk*4,0),intersectionPenalty:candidate.intersections*3,noBikeLanePenalty:(1-bikeLaneMeters/total)*20,arterialPenalty:segments.reduce((n,s)=>n+s.arterialRoadRisk*s.distance/total*20,0),crossingPenalty:candidate.crossings*1.5};
 const risk=Math.round(Math.min(100,Object.values(components).reduce((a,b)=>a+b,0)));
 return {...candidate,segments,distance:total,bikeLaneMeters,bikeRoadShare:bikeLaneMeters/total,hotspots:passed.length,hotspotIds:passed.map(h=>h.id),components,risk,routingRisk:risk/10,source:'Demo bike route / segment risk'};
}
export function orbitCandidates(origin={lat:37.5445,lng:127.0374},destination={lat:37.5446,lng:127.0559},base=29,options={}){
 const dx=(destination.lng-origin.lng)*M*Math.cos(origin.lat*Math.PI/180),dy=(destination.lat-origin.lat)*M,dist=Math.hypot(dx,dy)||100,width=Math.max(70,Math.min(250,dist*.12));
 const at=(t,offset=0)=>({lat:origin.lat+(destination.lat-origin.lat)*t+(dx/dist)*offset/M,lng:origin.lng+(destination.lng-origin.lng)*t-(dy/dist)*offset/(M*Math.cos(origin.lat*Math.PI/180))});
 const hazards=options.hazards||[.05,.3,.5,.7].map((t,i)=>({...at(t),id:'H'+(i+1),name:'사고위험구간 '+String.fromCharCode(65+i),radius:30,severity:options.riskEnabled===false?0:1,source:'Demo accident hotspots'}));
 const path=offset=>[at(0),at(.1),at(.3,offset),at(.5,offset),at(.7,offset),at(.85,offset),at(1)];
 const data=[{id:'direct',path:path(0),minutes:base,laneShare:.43,intersections:7,arterial:.38,crossings:4},{id:'mixed',path:path(width*.55),minutes:base+2,laneShare:.62,intersections:4,arterial:.32,crossings:3},{id:'protected',path:path(width),minutes:base+4,laneShare:.78,intersections:2,arterial:.33,crossings:2}];
 return {hazards,candidates:data.map(r=>analyzeRoute(r,hazards))};
}
export function avoidedRisk(fast,safe){return {extraMinutes:safe.minutes-fast.minutes,scoreReduction:fast.risk-safe.risk,reductionPercent:fast.risk?Math.round((fast.risk-safe.risk)/fast.risk*100):0,avoidedIds:fast.hotspotIds.filter(id=>!safe.hotspotIds.includes(id)),fewerIntersections:fast.intersections-safe.intersections,extraBikeLaneMeters:Math.round(safe.bikeLaneMeters-fast.bikeLaneMeters),fewerCrossings:fast.crossings-safe.crossings};}
