// Stable seeded test hazards at route maneuver points. Not accident records.
export function demoJunctions(routes){
 const route=routes.find(r=>r.routeMode==='SHORTEST')||routes[0];
 const points=(route.steps||[]).filter(s=>s.beginIndex>0&&s.beginIndex<route.path.length-1&&s.turnType!==1&&s.turnType!==4).map(s=>route.path[s.beginIndex]).filter(Boolean);
 const seen=new Set();const candidates=points.filter(p=>{const key=`${p.lat.toFixed(5)},${p.lng.toFixed(5)}`;if(seen.has(key))return false;seen.add(key);return true;});
 // Without maneuver data use bends as scenario comparison locations, never claim verified junctions.
 if(!candidates.length)for(let i=1;i<route.path.length-1;i++)candidates.push(route.path[i]);
 const hash=p=>Math.abs(Math.sin(p.lat*127.1+p.lng*311.7)*43758.5453)%1;
 const selected=candidates.sort((a,b)=>hash(a)-hash(b)).slice(0,3);
 return {coverage:true,source:{kind:'DEMO',name:'경로 회전 지점 기반 테스트 위험구간'},features:selected.map((p,i)=>{const dy=.00018,dx=dy/Math.cos(p.lat*Math.PI/180);return {id:`test-junction-${i}`,properties:{name:`교차로 주의 ${i+1}`,accidentCount:8,casualties:0},geometry:{type:'Polygon',coordinates:[[[p.lng-dx,p.lat-dy],[p.lng+dx,p.lat-dy],[p.lng+dx,p.lat+dy],[p.lng-dx,p.lat+dy],[p.lng-dx,p.lat-dy]]]}};})};
}
