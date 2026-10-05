import React,{useEffect,useRef} from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {loadKakao} from './places.js';
export default function LiveMap({center,places,selected,onSelect,onMove,gps,destination,kakaoKey,onError,routePath,hazards=[]}){
 const host=useRef(null),map=useRef(null),layers=useRef([]),type=useRef(''),latest=useRef({onSelect,onMove,onError});
 latest.current={onSelect,onMove,onError,places,selected,gps,destination,routePath,hazards};
 useEffect(()=>{
  let dead=false,observer;
  async function init(){try{
   if(kakaoKey){const k=await loadKakao(kakaoKey);if(dead)return;type.current='kakao';map.current=new k.maps.Map(host.current,{center:new k.maps.LatLng(center.lat,center.lng),level:5});k.maps.event.addListener(map.current,'dragend',()=>{const c=map.current.getCenter();latest.current.onMove({lat:c.getLat(),lng:c.getLng()});});observer=new ResizeObserver(()=>map.current?.relayout());}
   else{type.current='osm';map.current=L.map(host.current,{zoomControl:false}).setView([center.lat,center.lng],15);L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'}).addTo(map.current);L.control.zoom({position:'bottomright'}).addTo(map.current);map.current.on('dragend',()=>{const c=map.current.getCenter();latest.current.onMove({lat:c.lat,lng:c.lng});});observer=new ResizeObserver(()=>map.current?.invalidateSize());}
   observer.observe(host.current);draw();
  }catch(e){latest.current.onError(e.message);}}
  init();
  return()=>{dead=true;observer?.disconnect();layers.current.forEach(x=>type.current==='osm'?x.remove():x.setMap(null));layers.current=[];if(type.current==='osm')map.current?.remove();map.current=null;host.current?.replaceChildren();};
 },[kakaoKey]);
 function draw(){const {places,selected,gps,destination,routePath,hazards}=latest.current;if(!map.current)return;layers.current.forEach(x=>type.current==='osm'?x.remove():x.setMap(null));layers.current=[];
  if(routePath?.length){if(type.current==='osm')layers.current.push(L.polyline(routePath.map(p=>[p.lat,p.lng]),{color:'#b49f00',weight:5,dashArray:'7 5'}).addTo(map.current));else layers.current.push(new window.kakao.maps.Polyline({map:map.current,path:routePath.map(p=>new window.kakao.maps.LatLng(p.lat,p.lng)),strokeWeight:5,strokeColor:'#b49f00',strokeStyle:'dash'}));}
  hazards.forEach(p=>{if(type.current==='osm')layers.current.push(L.circleMarker([p.lat,p.lng],{radius:9,color:'#cb531e',fillOpacity:.3}).bindTooltip('Demo 위험구간').addTo(map.current));else layers.current.push(new window.kakao.maps.Circle({map:map.current,center:new window.kakao.maps.LatLng(p.lat,p.lng),radius:25,strokeColor:'#cb531e',fillColor:'#cb531e',fillOpacity:.3}));});
  const add=(p,i)=>{const button=document.createElement('button');button.className=`place-pin ${selected?.id===p.id?'selected':''}`;button.textContent=String(i+1);button.setAttribute('aria-label',p.name);button.onclick=()=>latest.current.onSelect(p);
   if(type.current==='osm'){const marker=L.marker([p.lat,p.lng],{icon:L.divIcon({html:button,className:'pin-wrapper',iconSize:[36,42],iconAnchor:[18,42]})}).addTo(map.current);layers.current.push(marker);}
   else{const k=window.kakao;layers.current.push(new k.maps.CustomOverlay({map:map.current,position:new k.maps.LatLng(p.lat,p.lng),content:button,yAnchor:1}));}
  };places.slice(0,30).forEach(add);if(selected&&!places.slice(0,30).some(p=>p.id===selected.id))add(selected,Math.max(0,places.findIndex(p=>p.id===selected.id)));
  if(destination){const label=document.createElement('span');label.className='destination-pin';label.textContent=destination.name;label.setAttribute('aria-label','목적지 '+destination.name);if(type.current==='osm'){layers.current.push(L.marker([destination.lat,destination.lng],{icon:L.divIcon({html:label,className:'pin-wrapper',iconSize:[80,30],iconAnchor:[40,30]})}).addTo(map.current));}else{layers.current.push(new window.kakao.maps.CustomOverlay({map:map.current,position:new window.kakao.maps.LatLng(destination.lat,destination.lng),content:label,yAnchor:1}));}}
  if(gps){if(type.current==='osm'){layers.current.push(L.circleMarker([gps.lat,gps.lng],{radius:8,color:'#fff',weight:3,fillColor:'#287af5',fillOpacity:1}).addTo(map.current));layers.current.push(L.circle([gps.lat,gps.lng],{radius:Math.min(gps.accuracy||20,500),color:'#287af5',weight:1,fillOpacity:.08}).addTo(map.current));}else{const k=window.kakao;layers.current.push(new k.maps.Circle({map:map.current,center:new k.maps.LatLng(gps.lat,gps.lng),radius:12,strokeWeight:3,strokeColor:'#ffffff',fillColor:'#287af5',fillOpacity:1}));}}
 }
 useEffect(()=>{if(!map.current)return;if(type.current==='osm')map.current.setView([center.lat,center.lng],15);else map.current.setCenter(new window.kakao.maps.LatLng(center.lat,center.lng));},[center]);
 useEffect(draw,[places,selected,gps,destination,routePath,hazards]);
 useEffect(()=>{if(!selected||!map.current)return;if(type.current==='osm')map.current.panTo([selected.lat,selected.lng]);else map.current.panTo(new window.kakao.maps.LatLng(selected.lat,selected.lng));},[selected]);
 return <div ref={host} className="live-map" aria-label="이동과 추천 지도"/>;
}
