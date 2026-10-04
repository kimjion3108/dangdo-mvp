import test from 'node:test';
import assert from 'node:assert/strict';
import {proximity,parseSharedDestination,newWallet,buyDemo,cancelDemo} from '../src/journeyModel.js';
const destination={name:'목적지',lat:37.5,lng:127};
test('GPS 오차가 크면 도착으로 판정하지 않는다',()=>{assert.equal(proximity(destination,{...destination,accuracy:300}).near,false);assert.equal(proximity(destination,{...destination,accuracy:10}).near,true);});
test('카카오 공유 좌표를 목적지로 가져온다',()=>{assert.deepEqual(parseSharedDestination('https://map.kakao.com/link/map/목적지,37.5,127').destination,destination);});
test('할인 주문은 중복 차감하지 않고 취소하면 잔액을 복구한다',()=>{const args={trip:{id:'trip',destination},productId:'arrival-coffee',requestId:'order',quantity:2};const w=buyDemo(newWallet(),args);assert.equal(w.balance,94000);assert.equal(w.orders[0].discount,3000);assert.equal(buyDemo(w,args),w);assert.equal(cancelDemo(w,'order').balance,100000);});
