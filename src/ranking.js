const crowdPenalty={'여유':0,'보통':.25,'약간 붐빔':.6,'붐빔':1};
// Input contains only provider observations, never invent restaurant waiting times.
export function rankArrivalPlaces(places,{scores,mode='walk',maxMinutes=20}={}){
 const speed=mode==='bike'?250:80;
 return places.map((p,i)=>{const walkEstimate=Math.max(1,Math.ceil(p.distance/speed));const similarity=Number.isFinite(scores?.[i])?Math.max(0,Math.min(1,scores[i])):null;const quiet=Number.isFinite(crowdPenalty[p.crowd?.level])&&p.crowd?.available?1-crowdPenalty[p.crowd.level]:null;
 const terms=[[Math.exp(-walkEstimate/Math.max(1,maxMinutes)),.35],[similarity,.55],[quiet,.1]].filter(([v])=>v!==null);const score=terms.reduce((s,[v,w])=>s+v*w,0)/terms.reduce((s,[,w])=>s+w,0);
 return {...p,score,similarity,accessEstimateMinutes:walkEstimate,accessEstimateMode:mode==='bike'?'자전거':'도보',rankingReason:similarity!==null?'취향과 이동 거리':'가까운 이동 거리'};}).sort((a,b)=>b.score-a.score);
}
