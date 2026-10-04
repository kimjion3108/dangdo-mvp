import {distance} from './places.js';
export const APPROACH_METERS=800;
export const DEMO_PRODUCTS=[
 {id:'arrival-coffee',merchant:'당도 데모 카페',name:'아이스 아메리카노',kind:'coffee',price:4500,discount:1500},
 {id:'arrival-bread',merchant:'당도 데모 베이커리',name:'소금빵 2개',kind:'bread',price:7000,discount:1000},
 {id:'arrival-meal',merchant:'당도 데모 키친',name:'치킨 샐러드',kind:'meal',price:12000,discount:2000},
];
export function validDestination(p){return !!p&&typeof p.name==='string'&&p.name.trim().length>0&&p.name.length<=200&&Number.isFinite(p.lat)&&Math.abs(p.lat)<=90&&Number.isFinite(p.lng)&&Math.abs(p.lng)<=180;}
export function destinationFromURL(raw){try{const u=new URL(raw);const lat=u.searchParams.get('destLat'),lng=u.searchParams.get('destLng');if(lat===null||lng===null)return null;const p={name:u.searchParams.get('destName')||'공유받은 목적지',lat:Number(lat),lng:Number(lng)};return validDestination(p)?p:null;}catch{return null;}}
export function parseSharedDestination(raw){const text=raw.trim();if(!text)throw new Error('공유한 장소 이름이나 링크를 붙여넣어 주세요.');const urlText=text.match(/https?:\/\/[^\s]+/)?.[0];if(urlText){let u;try{u=new URL(urlText);}catch{throw new Error('링크를 확인해 주세요.');}const own=destinationFromURL(urlText);if(own)return {destination:own};if(!['map.kakao.com','place.map.kakao.com','kko.kakao.com'].includes(u.hostname))throw new Error('카카오맵 공유 내용이나 당도 목적지 링크를 넣어 주세요.');const parts=decodeURIComponent(u.pathname).split('/').filter(Boolean);for(let i=parts.length-1;i>=0;i--){const m=parts[i].match(/^(.+),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/);if(m){const p={name:m[1],lat:Number(m[2]),lng:Number(m[3])};if(!validDestination(p))throw new Error('목적지 좌표가 올바르지 않아요.');return {destination:p};}}}
 const lines=text.replace(/https?:\/\/[^\s]+/g,'').split(/\n/).map(s=>s.replace(/^\s*\[(?:카카오맵|카카오내비)\]\s*/, '').trim()).filter(Boolean);if(lines.length)return {query:lines.slice(0,2).join(' ').slice(0,150)};throw new Error('이 링크에는 좌표가 없어요. 카카오맵의 장소 이름·주소도 함께 복사해 주세요.');}
export function proximity(destination,point){if(!validDestination(destination)||!point||!Number.isFinite(point.lat)||!Number.isFinite(point.lng))return {near:false,meters:null,reliable:false};const meters=distance(destination,point),reliable=Number.isFinite(point.accuracy)&&point.accuracy>=0&&point.accuracy<=200;return {meters,reliable,near:reliable&&meters+point.accuracy<=APPROACH_METERS};}
export const newWallet=()=>({version:1,balance:100000,orders:[]});
export function restoreWallet(raw){try{const w=JSON.parse(raw);if(w?.version!==1||!Number.isSafeInteger(w.balance)||w.balance<0||!Array.isArray(w.orders)||!w.orders.every(o=>DEMO_PRODUCTS.some(p=>p.id===o.productId)&&typeof o.id==='string'&&typeof o.tripId==='string'&&typeof o.destination==='string'&&['paid','cancelled','picked-up'].includes(o.status)&&Number.isSafeInteger(o.total)&&o.total>=0))return newWallet();return w;}catch{return newWallet();}}
export function buyDemo(wallet,{trip,productId,requestId,coupon=true,quantity=1},now=new Date().toISOString()){
 if(wallet.orders.some(o=>o.id===requestId))return wallet;
 const product=DEMO_PRODUCTS.find(p=>p.id===productId);if(!trip?.id||!validDestination(trip.destination)||!product||!requestId)throw new Error('목적지와 상품을 다시 확인해 주세요.');
 if(!Number.isInteger(quantity)||quantity<1||quantity>3)throw new Error('수량은 1~3개만 선택할 수 있어요.');
 if(wallet.orders.some(o=>o.tripId===trip.id&&o.productId===productId&&o.status!=='cancelled'))throw new Error('이번 이동에서 이미 구매한 상품이에요. 주문 내역을 확인해 주세요.');
 const original=product.price*quantity,discount=coupon?product.discount*quantity:0,total=original-discount;if(total>wallet.balance)throw new Error('체험 잔액이 부족해요.');
 const order={id:requestId,tripId:trip.id,productId,product:product.name,merchant:product.merchant,destination:trip.destination.name,quantity,original,discount,total,status:'paid',code:String(1000+wallet.orders.length+1),createdAt:now};
 return {...wallet,balance:wallet.balance-total,orders:[order,...wallet.orders]};
}
export function cancelDemo(wallet,id){const order=wallet.orders.find(o=>o.id===id);if(!order)throw new Error('주문을 찾지 못했어요.');if(order.status==='cancelled')return wallet;if(order.status==='picked-up')throw new Error('수령 완료한 체험 주문은 취소할 수 없어요.');return {...wallet,balance:wallet.balance+order.total,orders:wallet.orders.map(o=>o.id===id?{...o,status:'cancelled'}:o)};}
export function pickupDemo(wallet,id){const order=wallet.orders.find(o=>o.id===id);if(!order||order.status!=='paid')throw new Error('결제 완료된 체험 주문만 수령할 수 있어요.');return {...wallet,orders:wallet.orders.map(o=>o.id===id?{...o,status:'picked-up'}:o)};}
