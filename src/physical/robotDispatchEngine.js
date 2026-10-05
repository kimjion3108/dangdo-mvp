import {preparationSchedule} from '../arrival/preparationScheduler.js';
export function dispatchRobot({robots,merchant,arrival,now,previous,reservations=[]}){
 if(previous&&now>=previous.dispatchAt&&previous.robotId){const handoffAt=Math.max(previous.handoffAt,arrival);return {...previous,arrival,handoffAt,gap:Math.max(0,(handoffAt-arrival)/60000),status:now>=handoffAt?'HANDOFF':now>=previous.handoffAt?'HOLD':'DELIVERING',events:['이미 출발한 로봇을 유지하고 인계 시각을 조정했어요.']};}
 const candidates=robots.filter(r=>r.battery>=40&&r.status!=='CHARGING').map(r=>{
 const prep=preparationSchedule(merchant,arrival,r.travelMinutes,now,previous);
 const dispatchAt=Math.max(prep.readyAt,r.availableAt,now,arrival-r.travelMinutes*60000);
 const handoffAt=dispatchAt+r.travelMinutes*60000;
 const conflict=(r.nextJobAt&&handoffAt>r.nextJobAt)||reservations.some(p=>p.robotId===r.id&&dispatchAt<p.handoffAt&&handoffAt>p.dispatchAt);
 const gap=Math.max(0,(handoffAt-arrival)/60000);
 const score=gap*100+r.travelMinutes*2+(100-r.battery)*.05+(conflict?10000:0);
 return {...prep,robotId:r.id,battery:r.battery,location:r.location,dispatchAt,handoffAt,gap,score,conflict};
 }).filter(p=>!p.conflict).sort((a,b)=>a.score-b.score);
 const plan=candidates[0];if(!plan)return {robotId:null,status:'UNAVAILABLE',gap:null,arrival,events:['로봇 예약 불가 · 매장 픽업으로 진행']};
 const events=[];
 if(previous&&previous.robotId!==plan.robotId){events.push(`ROBOT RELEASED · ${previous.robotId}`,`ROBOT REASSIGNED · ${previous.robotId} → ${plan.robotId}`);}
 return {...plan,arrival,status:now>=plan.handoffAt?'HANDOFF':now>=plan.dispatchAt?'DELIVERING':now>=plan.readyAt?'HOLD':'RESERVED',events,source:'Demo Robot State'};
}
