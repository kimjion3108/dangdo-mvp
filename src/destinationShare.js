export function destinationShare(base,place){
 const target=new URL(base);
 target.hash='';target.search='';
 if(place){if(!Number.isFinite(place.lat)||!Number.isFinite(place.lng)||Math.abs(place.lat)>90||Math.abs(place.lng)>180)throw new Error('목적지 좌표를 확인하세요.');target.search=new URLSearchParams({destName:String(place.name).slice(0,120),destLat:String(place.lat),destLng:String(place.lng)}).toString();}
 const text=place?`${String(place.name).slice(0,120)}에서 만나요. 당도에서 주변 식당과 이동 경로를 확인하세요.`:'당도에서 목적지 주변 식당과 이동 경로를 함께 찾아보세요.';
 return {objectType:'text',text,link:{webUrl:target.href,mobileWebUrl:target.href},buttonTitle:'당도 열기'};
}
export async function sendDestination(template,kakao,nav){
 if(kakao?.isInitialized?.()&&kakao.Share?.sendDefault){try{kakao.Share.sendDefault(template);return 'kakao';}catch{}}
 if(nav.share){await nav.share({title:'당도',text:template.text,url:template.link.webUrl});return 'native';}
 await nav.clipboard.writeText(template.link.webUrl);return 'copied';
}
