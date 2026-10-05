import {pointSegmentDistance} from './geometry.js';
export function nearestInventoryRoad(roads,point){const entries=roads.filter(r=>[r.lat1,r.lon1,r.lat2,r.lon2].every(Number.isFinite)).map(r=>({...r,distance:pointSegmentDistance(point,{lat:r.lat1,lng:r.lon1},{lat:r.lat2,lng:r.lon2})})).sort((a,b)=>a.distance-b.distance);return entries[0]&&entries[0].distance<300?entries[0]:null;}
