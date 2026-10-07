// Engineering concept model, not calibrated hardware/coil measurements.
export const VEHICLE_TYPES={
 car:{label:'자동차',capacityKwh:60,battery:24,targetBattery:54,receiverPowerKw:11,gapMeters:.16,coilRadius:.2,receiverOffset:6,width:58,height:32},
 taxi:{label:'택시',capacityKwh:75,battery:32,targetBattery:62,receiverPowerKw:22,gapMeters:.16,coilRadius:.2,receiverOffset:7,width:62,height:34},
 bike:{label:'바이크',capacityKwh:.55,battery:28,targetBattery:85,receiverPowerKw:.35,gapMeters:.05,coilRadius:.08,receiverOffset:0,width:38,height:16}
};
export function vehicleFor(type='car',position={x:180,y:105},angle=0){const spec=VEHICLE_TYPES[type]||VEHICLE_TYPES.car;return {id:'내 차량',type,...spec,...position,angle,requestedAt:0,departureMinutes:type==='taxi'?30:type==='bike'?60:90};}
export function receiverPosition(v){const angle=(v.angle||0)*Math.PI/180;return {x:v.x+Math.cos(angle)*(v.receiverOffset||0),y:v.y+Math.sin(angle)*(v.receiverOffset||0)};}
export function motionDuration(distance,speed=2,acceleration=.8){if(distance<=0)return 0;if(!(speed>0&&acceleration>0))throw new Error('Invalid module motion');const rampDistance=speed*speed/acceleration;return distance<rampDistance?2*Math.sqrt(distance/acceleration):2*speed/acceleration+(distance-rampDistance)/speed;}
export function motionDistance(t,distance,speed=2,acceleration=.8){const total=motionDuration(distance,speed,acceleration);t=Math.max(0,Math.min(total,t));const ramp=Math.min(speed/acceleration,total/2),peak=acceleration*ramp;return t<ramp?.5*acceleration*t*t:t<=total-ramp?.5*acceleration*ramp*ramp+peak*(t-ramp):distance-.5*acceleration*(total-t)**2;}
export function couplingEfficiency(v,{offsetMeters=.002,angleDegrees=0,gapMeters=v.gapMeters||.16}={}){const radius=v.coilRadius||.2,nominal=v.gapMeters||.16;return .93*Math.exp(-((offsetMeters/radius)**2))*Math.exp(-.3*(gapMeters/nominal-1)**2)*Math.cos(angleDegrees*Math.PI/180)**2;}
export function chargeDuration(v,batteryPowerKw){if(!(batteryPowerKw>0&&v.capacityKwh>0))return Infinity;const from=Math.max(0,Math.min(100,v.battery)),to=Math.max(from,Math.min(99,v.targetBattery)),rate=batteryPowerKw/v.capacityKwh*100;const linear=Math.max(0,Math.min(to,80)-from)/rate;const taper=to>80?20/rate*Math.log((100-Math.max(from,80))/(100-to)):0;return (linear+taper)*3600;}
export function batteryAt(v,powerKw,seconds){if(!(powerKw>0))return v.battery;const rate=powerKw/v.capacityKwh*100,t=Math.max(0,seconds)/3600,linear=Math.max(0,80-v.battery)/rate;const soc=t<=linear?v.battery+rate*t:100-(100-Math.max(v.battery,80))*Math.exp(-rate*(t-linear)/20);return Math.min(v.targetBattery,soc);}
export function chargingSnapshot(job,elapsed){const seconds=Math.max(0,elapsed-job.startAt),battery=batteryAt(job,job.batteryPowerKw,seconds),deliveredKwh=Math.max(0,(battery-job.battery)/100*job.capacityKwh),charging=elapsed>=job.startAt&&elapsed<job.completeAt;const remainingSeconds=Number.isFinite(job.completeAt)?Math.max(0,job.completeAt-elapsed):0;return {battery,deliveredKwh,inputKwh:deliveredKwh/(job.efficiency||1),lossKwh:deliveredKwh/(job.efficiency||1)-deliveredKwh,powerKw:charging?job.batteryPowerKw*(battery>80?(100-battery)/20:1):0,remainingMinutes:Math.ceil(remainingSeconds/60)};}

// Resonant equivalent-circuit estimate; assumed coils, not measured hardware.
export function electromagneticState(v,{offsetMeters=.002,yawDegrees=0,tiltDegrees=0,gapMeters=v.gapMeters,inputPowerKw=v.receiverPowerKw}={}){
 const frequencyHz=85000,L1=v.type==='bike'?35e-6:200e-6,L2=L1,R1=v.type==='bike'?.15:.35,R2=R1;
 const radius=v.coilRadius||.2,k=.22*Math.exp(-((offsetMeters/radius)**2))*Math.pow(1+((gapMeters??.16)/radius)**2,-1.5)*( .85+.15*Math.cos(yawDegrees*Math.PI/180)**2)*Math.cos(tiltDegrees*Math.PI/180);
 const mutualInductance=Math.max(0,k)*Math.sqrt(L1*L2),omega=2*Math.PI*frequencyHz,Q1=omega*L1/R1,Q2=omega*L2/R2,chi=k*k*Q1*Q2;
 const coilEfficiency=chi/(1+Math.sqrt(1+chi))**2,efficiency=.96*coilEfficiency;
 return {frequencyHz,L1,L2,R1,R2,k,mutualInductance,Q1,Q2,efficiency,inputPowerKw,batteryPowerKw:inputPowerKw*efficiency};
}
export function driveVehicle(pose,steeringDegrees,distance){const heading=pose.angle*Math.PI/180,turn=distance/45*Math.tan(steeringDegrees*Math.PI/180),mid=heading+turn/2;return {x:Math.max(38,Math.min(482,pose.x+distance*Math.cos(mid))),y:Math.max(38,Math.min(322,pose.y+distance*Math.sin(mid))),angle:((pose.angle+turn*180/Math.PI+540)%360)-180};}
export function vehicleInsideZone(v,zones){const a=v.angle*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return zones.some(z=>[-1,1].every(i=>[-1,1].every(j=>{const x=v.x+i*v.width/2*c-j*v.height/2*s,y=v.y+i*v.width/2*s+j*v.height/2*c;return x>=z.x&&x<=z.x+z.w&&y>=z.y&&y<=z.y+z.h;})));}
