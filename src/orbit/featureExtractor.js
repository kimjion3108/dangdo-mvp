import {exposure,distanceToPolygon} from './geometry.js';
export function extractFeatures(segments,hotspots){return segments.map(s=>{
 const hits=hotspots.map(h=>({h,overlap:exposure(s.a,s.b,h.geometry),near:Math.min(distanceToPolygon(s.a,h.geometry),distanceToPolygon(s.b,h.geometry))}));
 const passed=hits.filter(x=>x.overlap>0);const count=key=>passed.reduce((sum,x)=>sum+(Number.isFinite(x.h.properties?.[key])?x.h.properties[key]:0),0);
 return {...s,hotspotIds:passed.map(x=>x.h.id),overlapMeters:passed.length?exposure(s.a,s.b,{type:'MultiPolygon',coordinates:passed.flatMap(x=>x.h.geometry.type==='Polygon'?[x.h.geometry.coordinates]:x.h.geometry.coordinates)}):0,nearestHotspotMeters:hits.length?Math.min(...hits.map(x=>x.near)):null,accidentCount:count('accidentCount'),casualties:count('casualties'),fatalities:count('fatalities'),seriousInjuries:count('seriousInjuries')};
});}
