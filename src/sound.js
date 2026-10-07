let player;
export function playBrandSound(){try{if(typeof Audio==='undefined')return;player??=new Audio(import.meta.env.BASE_URL+'audio/mobility-start.mp3');player.volume=.55;player.currentTime=0;const result=player.play();result?.catch(()=>{});}catch{}}
