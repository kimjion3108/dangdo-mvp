import test from 'node:test';
import assert from 'node:assert/strict';
import {distance,normalizeOSM,routeURL,rankPlaces} from '../src/places.js';
test('GPS 좌표의 직선 거리와 단위가 일치한다',()=>{assert.equal(distance({lat:37,lng:127},{lat:37,lng:127}),0);assert.ok(Math.abs(distance({lat:0,lng:0},{lat:0,lng:1})-111195)<10);});
test('실제 장소 응답에서 이름 없는 장소·중복은 제외하고 노드와 건물 좌표를 함께 처리한다',()=>{const rows=normalizeOSM([{type:'node',id:1,lat:36,lon:127,tags:{name:'카페 A',amenity:'cafe'}},{type:'way',id:2,center:{lat:36,lon:127},tags:{name:'식당 B',amenity:'restaurant',cuisine:'korean'}},{type:'node',id:3,lat:36,lon:127,tags:{}},{type:'node',id:4,lat:36,lon:127,tags:{name:'카페 A',amenity:'cafe'}}].map(e=>e),{lat:36,lng:127});assert.equal(rows.length,2);assert.equal(rows[0].distance,0);assert.equal(rows[1].category,'한식');});
test('카카오 길찾기는 선택한 이동 수단과 실제 좌표를 보존한다',()=>{const url=routeURL({name:'국수 & 밥',lat:36.1,lng:127.1},{name:'내 위치',lat:36,lng:127},'traffic');assert.ok(url.startsWith('https://map.kakao.com/link/by/traffic/'));assert.ok(url.includes('36,127/'));assert.ok(url.includes(encodeURIComponent('국수 & 밥')));});
test('AI는 조회된 식당만 의미 유사도와 거리로 정렬하며 가짜 장소를 생성하지 않는다',()=>{const places=[{id:'a',distance:100},{id:'b',distance:200},{id:'c',distance:20}];const ranked=rankPlaces(places,[.1,.9,.2]);assert.equal(ranked[0].id,'b');assert.deepEqual(ranked.map(x=>x.id).sort(),['a','b','c']);});
