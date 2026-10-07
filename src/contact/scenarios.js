// All new physical-contact fixtures live here. Coordinates are translated to the chosen origin.
export const CONTACT_SOURCE={mode:'simulation',label:'Demo Mode',route:'DANGDO scenario graph',vehicle:'Simulated vehicle',robot:'BRING adapter simulation',parking:'Indoor Position Simulation'};
export function contactScenario(origin,kind='taxi'){
 const geo=(x,y)=>({lat:origin.lat+y/111320,lng:origin.lng+x/(111320*Math.cos(origin.lat*Math.PI/180))});
 const nodes={u:{x:0,y:0,name:'현재 자리'},meet:{x:120,y:0,name:kind==='robot'?'앞쪽 로비':'앞쪽 승차 지점'},gate:{x:120,y:-200,name:kind==='robot'?'동쪽 로비':'동쪽 승차 지점'},v:{x:120,y:-480,name:kind==='robot'?'로봇':'차량'},top:{x:120,y:200},westTop:{x:-240,y:200},west:{x:-240,y:0},stairs:{x:60,y:20,name:'계단 입구'}};
 for(const [id,n] of Object.entries(nodes))Object.assign(n,geo(n.x,n.y),{id});
 const walk=[['u','meet'],['meet','gate'],['u','west'],['west','westTop'],['westTop','top'],['top','meet'],['u','stairs']];
 const drive=[['v','gate'],['gate','meet'],['meet','top'],['top','westTop'],['westTop','west'],['west','u'],['gate','stairs']];
 const speed=kind==='robot'?140:210;
 return {source:CONTACT_SOURCE,kind,origin,nodes,walk,drive,speed,walkSpeed:75,candidates:[{id:'u',name:kind==='robot'?'기존 수령 위치':'기존 승차 위치',allowed:true},{id:'meet',name:nodes.meet.name,allowed:true},{id:'gate',name:nodes.gate.name,allowed:true},{id:'stairs',name:'계단 입구',allowed:false,robotAccessible:false}],actorStart:'v',userStart:'u',minimumImprovement:60,switchPenalty:25,maxWalk:420};
}
export const parkingFixture={width:520,height:360,entrance:{x:30,y:180},modules:[{id:'C1',x:30,y:180,available:true,speed:2,powerKw:60},{id:'C2',x:490,y:180,available:true,speed:2,powerKw:60}],vehicles:[{id:'내 차량',x:130,y:95,battery:24,capacityKwh:60,targetBattery:54,departureMinutes:45,requestedAt:0},{id:'차량 B',x:280,y:265,battery:18,capacityKwh:60,targetBattery:38,departureMinutes:18,requestedAt:0},{id:'차량 C',x:430,y:95,battery:55,capacityKwh:60,targetBattery:75,departureMinutes:70,requestedAt:0}],aisleY:180,scaleMeters:.2};
