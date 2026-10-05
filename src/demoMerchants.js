export const DEMO_DESTINATION={name:'성수역',address:'서울 성동구 아차산로 100',lat:37.5446,lng:127.0559};
export const demoClock=()=>new Date('2026-10-05T18:23:00+09:00').getTime();
export function demoMerchants(destination){const seed=[
{id:'demo-coffee',name:'무브커피',category:'카페',distance:90,currentWaitMinutes:0,prepMinutes:4,discountPercent:20,dealStart:'18:30',dealEnd:'18:55',stockLevel:20,congestion:'quiet',price:8500,product:'아메리카노 + 디저트',tags:['픽업'],reward:null},
{id:'demo-bowl',name:'온더볼',category:'음식점',distance:180,currentWaitMinutes:5,prepMinutes:8,discountPercent:18,dealStart:'18:30',dealEnd:'19:00',stockLevel:12,congestion:'normal',price:12000,product:'치킨볼 세트',tags:['식사'],reward:{name:'미니 디저트 증정',terms:'첫 주문 고객, 재고 소진 시 종료'}},
{id:'demo-burger',name:'성수버거',category:'음식점',distance:320,currentWaitMinutes:25,prepMinutes:8,discountPercent:20,dealStart:'18:55',dealEnd:'19:30',stockLevel:15,congestion:'busy',price:11000,product:'버거 세트',tags:['식사'],reward:null}
];return seed.map((m,i)=>({...m,capacity:20,pickupAvailable:true,discountedPrice:Math.round(m.price*(1-m.discountPercent/100)),latitude:destination.lat+(i-1)*.001,longitude:destination.lng+.001+i*.0007,lat:destination.lat+(i-1)*.001,lng:destination.lng+.001+i*.0007,kind:m.category,rating:null,source:'Demo Merchant State',isDemo:true}));}
