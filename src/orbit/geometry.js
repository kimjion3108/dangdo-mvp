const M=111320;
export const meters=(a,b)=>Math.hypot((b.lat-a.lat)*M,(b.lng-a.lng)*M*Math.cos((a.lat+b.lat)*Math.PI/360));
export function pointSegmentDistance(p,a,b){const c=Math.cos((a.lat+b.lat)*Math.PI/360),x=(p.lng-a.lng)*M*c,y=(p.lat-a.lat)*M,dx=(b.lng-a.lng)*M*c,dy=(b.lat-a.lat)*M,t=Math.max(0,Math.min(1,(x*dx+y*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-dx*t,y-dy*t);}
const insideRing=(p,r)=>{let inside=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const [x,y]=r[i],[xx,yy]=r[j];if((y>p.lat)!==(yy>p.lat)&&p.lng<(xx-x)*(p.lat-y)/(yy-y)+x)inside=!inside;}return inside;};
const polygons=g=>g.type==='Polygon'?[g.coordinates]:g.coordinates;
export const inside=(p,g)=>polygons(g).some(r=>insideRing(p,r[0])&&!r.slice(1).some(h=>insideRing(p,h)));
export function exposure(a,b,g){
 const cuts=[0,1],dx=b.lng-a.lng,dy=b.lat-a.lat;
 for(const polygon of polygons(g))for(const ring of polygon)for(let i=1;i<ring.length;i++){
  const [x,y]=ring[i-1],[xx,yy]=ring[i],ex=xx-x,ey=yy-y,den=dx*ey-dy*ex;
  if(Math.abs(den)<1e-16)continue;const t=((x-a.lng)*ey-(y-a.lat)*ex)/den,u=((x-a.lng)*dy-(y-a.lat)*dx)/den;if(t>=0&&t<=1&&u>=0&&u<=1)cuts.push(t);
 }
 cuts.sort((a,b)=>a-b);let ratio=0;for(let i=1;i<cuts.length;i++){const t=(cuts[i-1]+cuts[i])/2;if(inside({lng:a.lng+dx*t,lat:a.lat+dy*t},g))ratio+=cuts[i]-cuts[i-1];}
 return ratio*meters(a,b);
}
export function distanceToPolygon(p,g){if(inside(p,g))return 0;return Math.min(...polygons(g).flatMap(poly=>poly.flatMap(r=>r.slice(1).map((b,i)=>pointSegmentDistance(p,{lng:r[i][0],lat:r[i][1]},{lng:b[0],lat:b[1]})))));}
export function buildSegments(path,maxLength=100){const out=[];for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],parts=Math.max(1,Math.ceil(meters(a,b)/maxLength));for(let n=0;n<parts;n++){const at=t=>({lat:a.lat+(b.lat-a.lat)*t,lng:a.lng+(b.lng-a.lng)*t});const p=at(n/parts),q=at((n+1)/parts);if(meters(p,q)>0)out.push({a:p,b:q,distance:meters(p,q)});}}return out;}
export function boundsForRoutes(routes){const points=routes.flatMap(r=>r.path);return [Math.min(...points.map(p=>p.lng))-.002,Math.min(...points.map(p=>p.lat))-.002,Math.max(...points.map(p=>p.lng))+.002,Math.max(...points.map(p=>p.lat))+.002];}
