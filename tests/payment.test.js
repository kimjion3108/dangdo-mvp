import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initialState,offers,completePayment,eligible,merchantStats,restoreState} from '../src/model.js';
test('결제 한 건이 잔액, 할인, 포인트, 가맹점 매출에 동시에 반영된다',()=>{
 const state=initialState(),next=completePayment(state,offers[0],{id:'order-1'});
 assert.equal(next.balance,state.balance-3000);assert.equal(next.points,150);assert.equal(next.orders[0].discount,1500);
 assert.equal(merchantStats(next.orders,offers[0].merchant).revenue,54600);assert.equal(merchantStats(next.orders,offers[0].merchant).payments,13);
 assert.equal(state.orders.length,0);
});
test('중복 승인 및 동일 이동의 중복 상품 결제는 이중 차감되지 않는다',()=>{
 const state=completePayment(initialState(),offers[0],{id:'same'});
 assert.equal(completePayment(state,offers[0],{id:'same'}),state);
 assert.throws(()=>completePayment(state,offers[0],{id:'different'}));assert.equal(state.points,150);
});
test('ETA, 목적지, 잔액, 잔여 수량을 결제 시점에 검증한다',()=>{
 const state=initialState();assert.equal(eligible(offers[0],{...state.trip,eta:18},[]),false);
 assert.equal(eligible(offers[0],{...state.trip,dest:'forest'},[]),false);
 assert.throws(()=>completePayment({...state,balance:0},offers[0]));
 const full=Array.from({length:8},(_,i)=>({offerId:'coffee',tripId:String(i)}));assert.equal(eligible(offers[0],state.trip,full),false);
 assert.equal(eligible(offers[0],{...state.trip,eta:0},[]),true);
});
test('다른 가맹점 결제는 선택 가맹점 성과에 섞이지 않는다',()=>{
 const next=completePayment(initialState(),offers[1]);assert.equal(merchantStats(next.orders,offers[0].merchant).revenue,51600);assert.equal(merchantStats(next.orders,offers[1].merchant).revenue,57600);
});
test('저장한 주문은 복원하고 손상된 저장 데이터는 새 시연으로 복구한다',()=>{
 const state=completePayment(initialState(),offers[0]);assert.deepEqual(restoreState(JSON.stringify(state)),state);
 assert.equal(restoreState('{broken').orders.length,0);assert.equal(restoreState('{"version":1}').balance,246344);
});
