// Reproducible ORBIT routing fixture. Never used for real destination searches.
// Paths and hazard areas are scenario inputs, not road guidance or public accident records.
export function orbitScenarioProvider(origin,destination){
 const point=(lat,lng)=>({lat,lng});const fast=[origin,destination],safe=[origin,point(origin.lat+.0055,origin.lng+.0016),point(origin.lat+.0055,destination.lng),destination];
 const make=(id,path,minutes)=>({id,routeMode:id,path,minutes,seconds:minutes*60,distance:id==='SHORTEST'?2000:2600,risk:null,hotspotIds:[],hotspots:null,bikeRoadShare:null,steps:[],source:'ORBIT 경로 비교 시나리오',landingUrl:null});
 const left=origin.lng+(destination.lng-origin.lng)*.2,right=origin.lng+(destination.lng-origin.lng)*.8,bottom=Math.min(origin.lat,destination.lat)-.001,top=Math.max(origin.lat,destination.lat)+.001;
 const hazard={id:'scenario-crossing',properties:{name:'교차로 위험구간',accidentCount:10,casualties:12},geometry:{type:'Polygon',coordinates:[[[left,bottom],[right,bottom],[right,top],[left,top],[left,bottom]]]}};
 return {routes:async()=>[make('SHORTEST',fast,29),make('ACCESSIBLE',safe,33),make('BIKE_ONLY',safe,33)],hotspots:async()=>({coverage:true,source:{name:'ORBIT 시나리오 위험구간',kind:'DEMO'},features:[hazard]}),avoid:async()=>({...make('BIKE_ONLY',safe,33),id:'SCENARIO-AVOID',excludedIds:[hazard.id]})};
}
