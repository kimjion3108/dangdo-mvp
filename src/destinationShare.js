export function kakaoPlaceURL(place){
 if(!place||!Number.isFinite(place.lat)||!Number.isFinite(place.lng)||Math.abs(place.lat)>90||Math.abs(place.lng)>180)throw new Error('목적지 좌표를 확인하세요.');
 const id=String(place.kakaoId||(/^kakao-(\d+)$/.exec(place.id||'')?.[1])||'');
 return /^\d+$/.test(id)?`https://place.map.kakao.com/${id}`:`https://map.kakao.com/link/map/${encodeURIComponent(String(place.name).slice(0,120))},${place.lat},${place.lng}`;
}
export function mapLanding(base,place){kakaoPlaceURL(place);const u=new URL('map.html',base);u.search=new URLSearchParams({name:String(place.name).slice(0,120),lat:String(place.lat),lng:String(place.lng),...(place.kakaoId?{id:String(place.kakaoId)}:/^kakao-(\d+)$/.test(place.id||'')?{id:place.id.slice(6)}:{})}).toString();return u.href;}
export function destinationShare(base,place){
 const target=new URL(base);target.hash='';target.search='';
 if(!place)return {objectType:'text',text:'당도에서 목적지 주변 식당과 이동 경로를 함께 찾아보세요.',link:{webUrl:target.href,mobileWebUrl:target.href},buttonTitle:'당도 열기'};
 kakaoPlaceURL(place);const name=String(place.name).slice(0,120),address=String(place.address||'').trim().slice(0,200);
 target.search=new URLSearchParams({destName:name,destLat:String(place.lat),destLng:String(place.lng)}).toString();
 const map=mapLanding(base,place),mapLink={webUrl:map,mobileWebUrl:map},ownLink={webUrl:target.href,mobileWebUrl:target.href};
 return {objectType:address?'location':'feed',...(address?{address,addressTitle:name}:{}),content:{title:name,description:address||`공유한 위치 · ${place.lat.toFixed(5)}, ${place.lng.toFixed(5)}`,imageUrl:new URL('share-place.png',base).href,imageWidth:640,imageHeight:320,link:mapLink},buttons:[{title:'카카오맵에서 보기',link:mapLink},{title:'당도에서 보기',link:ownLink}]};
}
export async function sendDestination(template,kakao,nav){
 if(kakao?.isInitialized?.()&&kakao.Share?.sendDefault){try{kakao.Share.sendDefault(template);return 'kakao';}catch{}}
 const link=template.content?.link||template.link,text=template.content?[template.content.title,template.content.description].join('\n'):template.text;
 if(nav.share){await nav.share({title:template.content?.title||'당도',text,url:link.webUrl});return 'native';}
 await nav.clipboard.writeText(link.webUrl);return 'copied';
}
