import {buildSegments,boundsForRoutes,exposure,inside} from '../orbit/geometry.js';
import {extractFeatures} from '../orbit/featureExtractor.js';
import {inferRoute} from '../orbit/riskInference.js';
export {pointSegmentDistance} from '../orbit/geometry.js';
export const WEIGHTS={FAST:.2,BALANCED:.8,SAFE:2};
export function avoidedRisk(fast,safe){return {extraMinutes:Math.ceil(safe.minutes)-Math.ceil(fast.minutes),scoreReduction:fast.risk-safe.risk,reductionPercent:fast.risk?Math.round((fast.risk-safe.risk)/fast.risk*100):0,avoidedIds:fast.hotspotIds.filter(id=>!safe.hotspotIds.includes(id)),overlapReduction:fast.overlapMeters-safe.overlapMeters};}
export function selectProfiles(candidates,riskFactor=1){const fast=candidates.find(r=>r.routeMode==='SHORTEST'),balanced=candidates.find(r=>r.routeMode==='ACCESSIBLE');if(!fast||!balanced)throw new Error('필수 경로 후보가 없어요.');const scored=candidates.every(r=>Number.isFinite(r.risk));const safe=scored?[...candidates].sort((a,b)=>(a.minutes+2*riskFactor*a.risk)-(b.minutes+2*riskFactor*b.risk)||a.minutes-b.minutes)[0]:null;const comparison=safe?avoidedRisk(fast,safe):null;return [fast,balanced,safe].map((r,i)=>r&&({...r,type:['FAST','BALANCED','SAFE'][i],riskWeight:[.2,.8,2][i]*riskFactor,cost:scored?r.minutes+[.2,.8,2][i]*riskFactor*r.risk:null,comparison,candidates,identical:safe?JSON.stringify(fast.path)===JSON.stringify(safe.path):false})).filter(Boolean);}
export async function analyzeBikeJourney(provider,origin,destination,{signal,onProgress=()=>{}}={}){
 const completed=[];const progress=stage=>{completed.push(stage);onProgress(stage);};
 progress('ROUTE FETCH');let candidates=await provider.routes(origin,destination,signal);
 progress('SEGMENT BUILD');let segmented=candidates.map(c=>buildSegments(c.path));let data;let roadInventory=null;try{roadInventory=provider.roadInventory?await provider.roadInventory(origin,signal):null;}catch(e){if(signal?.aborted)throw e;}
 try{data=await provider.hotspots(boundsForRoutes(candidates),signal);}catch(e){if(signal?.aborted)throw e;return {roadInventory,status:'partial',options:selectProfiles(candidates),candidates,hazards:[],warning:e.message,accidentSource:'미연결'};}
 if(provider.avoid){const intersecting=data.features.filter(h=>segmented[0].some(s=>exposure(s.a,s.b,h.geometry)>0));const avoidable=intersecting.filter(h=>!inside(origin,h.geometry)&&!inside(destination,h.geometry));if(avoidable.length){progress('SAFE ROUTE GENERATION');try{const alternative=await provider.avoid(origin,destination,avoidable,signal);candidates=[...candidates,alternative];segmented=[...segmented,buildSegments(alternative.path)];}catch(e){if(signal?.aborted)throw e;data.warning='사고구간 우회 경로를 조회하지 못해 기존 후보를 비교했어요.';}}}
 try { progress('FEATURE EXTRACTION');const features=segmented.map(s=>extractFeatures(s,data.features));
 progress('RISK INFERENCE');const analyzed=candidates.map((c,i)=>inferRoute(c,features[i]));
 progress('ROUTE SCORING');const options=selectProfiles(analyzed);
 progress('SAFE SELECTION');const passed=new Set(analyzed.flatMap(r=>r.hotspotIds));const hazards=data.features.filter(h=>passed.has(h.id)).map(h=>{const ring=h.geometry.type==='Polygon'?h.geometry.coordinates[0]:h.geometry.coordinates[0][0];return {...h,name:h.properties?.name||'사고다발구간',lng:ring[0][0],lat:ring[0][1]};});
 return {roadInventory,completed,status:'ready',options,candidates:analyzed,hazards,accidentSource:data.source,warning:data.warning,model:'ORBIT Risk Baseline 1.0'};
 }catch{return {roadInventory,status:'partial',options:selectProfiles(candidates),candidates,hazards:[],warning:'위험 분석을 완료하지 못했어요. 일반 경로만 표시합니다.',accidentSource:'분석 오류'};}
}
