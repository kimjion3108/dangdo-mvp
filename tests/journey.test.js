import test from 'node:test';
import assert from 'node:assert/strict';
import {proximity,parseSharedDestination,newWallet,buyDemo,cancelDemo} from '../src/journeyModel.js';
const destination={name:'목적지',lat:37.5,lng:127};
test('GPS 오차가 크면 도착으로 판정하지 않는다',()=>{assert.equal(proximity(destination,{...destination,accuracy:300}).near,false);assert.equal(proximity(destination,{...destination,accuracy:10}).near,true);});
test('카카오 공유 좌표를 목적지로 가져온다',()=>{assert.deepEqual(parseSharedDestination('https://map.kakao.com/link/map/목적지,37.5,127').destination,destination);});
test('할인 주문은 중복 차감하지 않고 취소하면 잔액을 복구한다',()=>{const args={trip:{id:'trip',destination},productId:'arrival-coffee',requestId:'order',quantity:2};const w=buyDemo(newWallet(),args);assert.equal(w.balance,94000);assert.equal(w.orders[0].discount,3000);assert.equal(buyDemo(w,args),w);assert.equal(cancelDemo(w,'order').balance,100000);});

test('카카오페이 시연은 할인 후 1% 적립, 취소 시 포인트 회수',()=>{const args={trip:{id:'trip',destination},productId:'arrival-coffee',requestId:'pay',quantity:2};const w=buyDemo(newWallet(),args);assert.equal(w.points,60);assert.equal(w.orders[0].paymentMethod,'카카오페이머니 · 시연');assert.equal(buyDemo(w,args).points,60);const cancelled=cancelDemo(w,'pay');assert.equal(cancelled.points,0);assert.equal(cancelDemo(cancelled,'pay'),cancelled);});
test('할인 해제와 수량은 결제금과 적립금에 함께 반영된다',()=>{const w=buyDemo(newWallet(),{trip:{id:'trip',destination},productId:'arrival-meal',requestId:'pay',quantity:3,coupon:false});assert.equal(w.orders[0].total,36000);assert.equal(w.orders[0].discount,0);assert.equal(w.points,360);});

test('기존 구매 내역은 포인트 중복 지급 없이 새 지갑으로 복원한다',async()=>{const {restoreWallet}=await import('../src/journeyModel.js');const w=buyDemo(newWallet(),{trip:{id:'trip',destination},productId:'arrival-coffee',requestId:'old'});const old={...w,version:1};delete old.points;delete old.orders[0].reward;delete old.orders[0].paymentMethod;const migrated=restoreWallet(JSON.stringify(old));assert.equal(migrated.version,2);assert.equal(migrated.points,0);assert.equal(migrated.orders[0].reward,0);assert.equal(migrated.orders[0].total,3000);assert.equal(cancelDemo(migrated,'old').points,0);});
