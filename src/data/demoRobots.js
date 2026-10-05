export function demoRobots(now){return [
{id:'R1',status:'AVAILABLE',location:'Lobby',battery:82,travelMinutes:4,availableAt:now,nextJobAt:now+29*60000},
{id:'R2',status:'DELIVERING',location:'7F',battery:61,travelMinutes:4,availableAt:now+27*60000,nextJobAt:null},
{id:'R3',status:'CHARGING',location:'B1',battery:34,travelMinutes:6,availableAt:now+47*60000,nextJobAt:null}
].map(r=>({...r,source:'Demo Robot State'}));}
