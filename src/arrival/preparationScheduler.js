export function preparationSchedule(merchant,humanArrivalETA,travelMinutes,now,previous){
 const duration=(merchant.prepMinutes+1)*60000;
 const earliest=now+merchant.currentWaitMinutes*60000;
 const alreadyStarted=previous&&now>=previous.prepStart;
 const prepStart=alreadyStarted?previous.prepStart:Math.max(earliest,humanArrivalETA-travelMinutes*60000-duration);
 const readyAt=alreadyStarted?previous.readyAt:prepStart+duration;
 return {prepStart,readyAt,status:now>=readyAt?'READY':now>=prepStart?'PREPARING':'HOLD'};
}
