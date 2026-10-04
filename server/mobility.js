import {XMLParser,XMLValidator} from 'fast-xml-parser';
export function parseCityXml(text){if(XMLValidator.validate(text)!==true)throw new Error('Invalid city data');return new XMLParser({parseTagValue:false}).parse(text);}
export function parseSeoulTime(value){if(typeof value!=='string')return NaN;const v=value.trim().replace(' ','T');return Date.parse(/[Zz]|[+-]\d\d:\d\d$/.test(v)?v:v+'+09:00');}
export function subwaySummary(payload,now=Date.now()){
 const rows=(payload.realtimeArrivalList||[]).filter(r=>Number.isFinite(Number(r.barvlDt))&&Number(r.barvlDt)>0&&now-parseSeoulTime(r.recptnDt)<=120000&&now>=parseSeoulTime(r.recptnDt));
 const groups=new Map();for(const r of rows){const key=`${r.subwayId}:${r.updnLine}`;const old=groups.get(key);if(!old||Number(r.barvlDt)<Number(old.barvlDt))groups.set(key,r);}
 const next=[...groups.values()].map(r=>({line:r.subwayId,direction:r.updnLine,destination:r.trainLineNm,seconds:Number(r.barvlDt),message:r.arvlMsg2,observedAt:r.recptnDt})).sort((a,b)=>a.seconds-b.seconds);
 return {available:!!next.length,next,meanNextArrivalSeconds:next.length?Math.round(next.reduce((s,r)=>s+r.seconds,0)/next.length):null,sampleCount:next.length,source:'서울시 지하철 실시간 도착정보',metric:'노선·방향별 다음 열차의 현재 잔여시간 평균'};
}
export function crowdSummary(payload,now=Date.now()){
 const city=payload.CITYDATA||payload,raw=city.LIVE_PPLTN_STTS?.LIVE_PPLTN_STTS||city.LIVE_PPLTN_STTS,p=Array.isArray(raw)?raw[0]:raw;
 const observed=parseSeoulTime(p?.PPLTN_TIME),fresh=Number.isFinite(observed)&&now>=observed&&now-observed<=1200000;
 if(!fresh||!p?.AREA_CONGEST_LVL)return {available:false,source:'서울시 실시간 도시데이터'};
 return {available:true,level:p.AREA_CONGEST_LVL,message:p.AREA_CONGEST_MSG,observedAt:p.PPLTN_TIME,area:city.AREA_NM,source:'서울시 실시간 도시데이터',scope:'지역 유동인구 혼잡도'};
}
export function cityAreaForPoint(lat,lng,areas=[]){if(!Number.isFinite(lat)||!Number.isFinite(lng))return '';const row=areas.find(a=>typeof a.name==='string'&&Array.isArray(a.bounds)&&a.bounds.length===4&&a.bounds.every(Number.isFinite)&&lng>=a.bounds[0]&&lat>=a.bounds[1]&&lng<=a.bounds[2]&&lat<=a.bounds[3]);return row?.name||'';}
export async function mobilityData({station,area},{subwayKey,cityKey,fetcher=fetch}={}){
 const safe=v=>typeof v==='string'&&v.length<=80&&!/[\r\n\/]/.test(v);
 const get=async(url,xml=false)=>{const r=await fetcher(url,{signal:AbortSignal.timeout(8000)});if(!r.ok)throw new Error('provider unavailable');return xml?parseCityXml(await r.text()):r.json();};
 const [subway,crowd]=await Promise.all([
  subwayKey&&safe(station)&&station?get(`http://swopenapi.seoul.go.kr/api/subway/${encodeURIComponent(subwayKey)}/json/realtimeStationArrival/0/40/${encodeURIComponent(station.replace(/역$/,''))}`).then(subwaySummary).catch(()=>({available:false})):Promise.resolve({available:false}),
  cityKey&&safe(area)&&area?get(`http://openapi.seoul.go.kr:8088/${encodeURIComponent(cityKey)}/xml/citydata/1/5/${encodeURIComponent(area)}`,true).then(crowdSummary).catch(()=>({available:false})):Promise.resolve({available:false})
 ]);return {subway,crowd,checkedAt:new Date().toISOString()};
}
