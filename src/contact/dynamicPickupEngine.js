const length=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function graphRoute(nodes,edges,start,end){
 const dist={[start]:0},prev={},todo=new Set(Object.keys(nodes));
 while(todo.size){const u=[...todo].sort((a,b)=>(dist[a]??Infinity)-(dist[b]??Infinity))[0];if(!Number.isFinite(dist[u]))break;todo.delete(u);if(u===end)break;for(const [a,b] of edges){if(a!==u||!todo.has(b))continue;const d=dist[u]+length(nodes[a],nodes[b]);if(d<(dist[b]??Infinity)){dist[b]=d;prev[b]=u;}}}
 if(!Number.isFinite(dist[end]))return null;const ids=[end];while(ids[0]!==start)ids.unshift(prev[ids[0]]);return {ids,path:ids.map(id=>nodes[id]),distance:dist[end]};
}
export function evaluateContact(s,c,{userStart=s.userStart,actorStart=s.actorStart,delay=0,blockedId=null}={}){
 if(!c.allowed||(s.kind==='robot'&&c.robotAccessible===false))return null;
 const walkEdges=s.walk.flatMap(([a,b])=>[[a,b],[b,a]]),walking=graphRoute(s.nodes,walkEdges,userStart,c.id),approach=graphRoute(s.nodes,s.drive,actorStart,c.id);
 if(!walking||!approach||walking.distance>s.maxWalk)return null;
 const userSeconds=walking.distance/s.walkSpeed*60,actorSeconds=approach.distance/s.speed*60+(blockedId&&approach.ids.includes(blockedId)?delay:0),meetingSeconds=Math.max(userSeconds,actorSeconds),gapSeconds=Math.abs(userSeconds-actorSeconds);
 return {...c,walking,approach,userSeconds,actorSeconds,meetingSeconds,gapSeconds,detourMeters:approach.distance,additionalWalking:walking.distance,cost:meetingSeconds+walking.distance*.12+gapSeconds*.1};
}
export function recommendContact(s,options={}){const candidates=s.candidates.map(c=>evaluateContact(s,c,options)).filter(Boolean).sort((a,b)=>a.cost-b.cost||a.id.localeCompare(b.id));return {candidates,static:candidates.find(c=>c.id==='u'),recommended:candidates[0]};}
export function shouldPropose(current,next,threshold=60){return !!next&&next.id!==current.id&&current.meetingSeconds-next.meetingSeconds>=threshold;}
export function pointAt(path,meters){let remaining=Math.max(0,meters);for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],d=length(a,b);if(remaining<=d){const t=d?remaining/d:1;return {...a,x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,lat:a.lat+(b.lat-a.lat)*t,lng:a.lng+(b.lng-a.lng)*t};}remaining-=d;}return {...path.at(-1)};}
export function simulationFrame(choice,elapsed){const userProgress=Math.min(1,elapsed/Math.max(1,choice.userSeconds)),actorProgress=Math.min(1,elapsed/Math.max(1,choice.actorSeconds));return {user:pointAt(choice.walking.path,choice.walking.distance*userProgress),actor:pointAt(choice.approach.path,choice.approach.distance*actorProgress),remainingSeconds:Math.max(0,choice.meetingSeconds-elapsed),completed:elapsed>=choice.meetingSeconds};}
export function compareContacts(staticChoice,dynamicChoice){const saved=staticChoice.meetingSeconds-dynamicChoice.meetingSeconds;return {staticSeconds:staticChoice.meetingSeconds,dynamicSeconds:dynamicChoice.meetingSeconds,reductionPercent:Math.round(saved/staticChoice.meetingSeconds*100),approachReduction:Math.round(staticChoice.approach.distance-(dynamicChoice.metricApproach??dynamicChoice.approach.distance)),additionalWalking:Math.round((dynamicChoice.metricWalk??dynamicChoice.walking.distance)-staticChoice.walking.distance),staticWalkSeconds:staticChoice.userSeconds,dynamicWalkSeconds:dynamicChoice.metricUserSeconds??dynamicChoice.userSeconds,staticGap:Math.round(staticChoice.gapSeconds),dynamicGap:Math.round(Math.abs((dynamicChoice.metricUserSeconds??dynamicChoice.userSeconds)-(dynamicChoice.metricActorSeconds??dynamicChoice.actorSeconds))),staticApproach:Math.round(staticChoice.approach.distance),dynamicApproach:Math.round((dynamicChoice.metricApproach??dynamicChoice.approach.distance))};}
export function replanFromFrame(s,choice,elapsed,delay=180){
 const frame=simulationFrame(choice,elapsed),nodes={...s.nodes,'user-now':{...frame.user,id:'user-now'},'actor-now':{...frame.actor,id:'actor-now'}};
 const segment=(path,p)=>{for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i];if(Math.abs(length(a,p)+length(p,b)-length(a,b))<1)return [a.id,b.id];}return [path.at(-1).id,path.at(-1).id];};
 const [ua,ub]=segment(choice.walking.path,frame.user),[,ab]=segment(choice.approach.path,frame.actor);
 const next={...s,nodes,userStart:'user-now',actorStart:'actor-now',walk:[...s.walk,['user-now',ua],['user-now',ub]],drive:[...s.drive,['actor-now',ab]]};
 const options={delay,blockedId:choice.id};const result=recommendContact(next,options),current=evaluateContact(next,choice,options);
 return {...result,current,scenario:next,frame};
}
