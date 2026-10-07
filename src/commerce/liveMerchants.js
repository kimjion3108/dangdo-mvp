import {distance} from '../places.js';
import {presentationMerchant} from './presentationBenefits.js';
import {calculateMerchantScore,inDealWindow} from '../arrivalEngine.js';
export function eligibleOffer(place,arrival,offers=[],now=Date.now()){
 return offers.find(o=>o.verified===true&&o.placeId===place.id&&typeof o.title==='string'&&typeof o.terms==='string'&&Number.isFinite(Date.parse(o.validUntil))&&Date.parse(o.validUntil)>now&&Date.parse(o.validUntil)>=arrival&&Date.parse(o.validFrom)<=arrival&&Number.isFinite(o.discountPercent)&&o.discountPercent>=0&&o.discountPercent<=90&&(!o.redeemUrl||/^https:\/\//.test(o.redeemUrl))&&inDealWindow(arrival,o.startTime||'00:00',o.endTime||'23:59'))||null;
}
export function rankNearbyMerchants(places,journey,preference='all',offers=[]){
 if(!Number.isFinite(journey?.estimatedArrivalTime))return [];
 return places.filter(p=>preference==='all'||p.kind===preference).map(p=>{const meters=distance(journey.destination,p),confirmed=eligibleOffer(p,journey.estimatedArrivalTime,offers),m=presentationMerchant({...p,distance:meters});const ranked=calculateMerchantScore(m,journey,preference);return {...ranked,offer:confirmed||m.offer,category:p.kind,placeCategory:p.category,walkMinutes:Math.max(1,Math.ceil(meters/75)),score:100-Math.min(100,meters/10)+(confirmed?25:0)};}).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
}
export async function loadMerchantOffers(base,signal){
 const url=base?`${base.replace(/\/$/,'')}/api/merchant-offers`:`${import.meta.env.BASE_URL}data/merchant-offers.json`;
 const response=await fetch(url,{signal});if(!response.ok)throw new Error('혜택 조회 실패');const data=await response.json();return Array.isArray(data.offers)?data.offers:[];
}
