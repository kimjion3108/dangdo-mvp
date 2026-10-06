// Stable seeded presentation data: place identity/coordinates remain live.
// Benefits, menu, price and merchant state are MVP fixtures, not merchant offers.
function seed(id){let h=2166136261;for(const c of id){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
export function presentationMerchant(place){const n=seed(place.id),cafe=place.kind==='카페',gift=n%3===0,cashbackPercent=gift?0:3+n%10;const reward=gift?{name:cafe?'미니 디저트 증정':'음료 1잔 증정',terms:'MVP 혜택 시나리오'}:null;
 return {...place,category:place.kind,placeCategory:place.placeCategory||place.category||place.kind,isDemo:true,isPresentation:true,product:cafe?'커피 + 디저트 세트':'추천 메뉴 세트',price:(cafe?6500:11000)+(n%4)*1000,currentWaitMinutes:n%6,prepMinutes:cafe?4:8,stockLevel:20,capacity:20,pickupAvailable:true,congestion:n%2?'quiet':'normal',discountPercent:0,dealStart:'00:00',dealEnd:'23:59',cashbackPercent,reward,benefitLabel:gift?`${reward.name}!`:`${cashbackPercent}% 캐시 적립`,offer:{isDemo:true,title:gift?reward.name:`${cashbackPercent}% 캐시 적립`,discountPercent:0,cashbackPercent,reward:reward?.name,terms:'MVP 혜택 시나리오'}};
}
