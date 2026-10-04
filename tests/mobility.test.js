import test from 'node:test';
import assert from 'node:assert/strict';
import {subwaySummary,crowdSummary,mobilityData,parseCityXml} from '../server/mobility.js';
import {rankArrivalPlaces} from '../src/ranking.js';
const now=Date.parse('2026-10-04T06:00:00Z');
test('다음 열차 평균은 노선·방향별 첫 열차만 사용하고 오래된 값은 제외한다',()=>{const r=subwaySummary({realtimeArrivalList:[{subwayId:'2',updnLine:'상행',trainLineNm:'성수행',barvlDt:'60',recptnDt:'2026-10-04 15:00:00'},{subwayId:'2',updnLine:'상행',trainLineNm:'성수행',barvlDt:'300',recptnDt:'2026-10-04 15:00:00'},{subwayId:'2',updnLine:'하행',trainLineNm:'신도림행',barvlDt:'180',recptnDt:'2026-10-04 15:00:00'},{barvlDt:100,recptnDt:'2026-10-04 14:00:00'},{barvlDt:0,recptnDt:'2026-10-04 15:00:00'}]},now);assert.equal(r.meanNextArrivalSeconds,120);assert.equal(r.sampleCount,2);});
test('혼잡도는 최신 지역 관측일 때만 사용하며 식당 대기시간을 생성하지 않는다',()=>{const r=crowdSummary({CITYDATA:{AREA_NM:'성수',LIVE_PPLTN_STTS:[{PPLTN_TIME:'2026-10-04 15:00',AREA_CONGEST_LVL:'붐빔'}]}},now);assert.equal(r.available,true);assert.equal(r.waitMinutes,undefined);assert.equal(crowdSummary({CITYDATA:{LIVE_PPLTN_STTS:[{PPLTN_TIME:'2026-10-04 12:00',AREA_CONGEST_LVL:'붐빔'}]}},now).available,false);});
test('API 키와 데이터가 없으면 평균·혼잡도 수치를 만들어내지 않는다',async()=>{const d=await mobilityData({station:'성수',area:'성수'});assert.equal(d.subway.available,false);assert.equal(d.crowd.available,false);});
test('추천은 알려진 장소만 사용하고 없는 혼잡도는 제외한다',()=>{const places=[{id:'near',distance:80},{id:'far',distance:800}];const rows=rankArrivalPlaces(places);assert.equal(rows[0].id,'near');assert.equal(rows[0].accessEstimateMinutes,1);assert.equal(rows[0].waitMinutes,undefined);const taste=rankArrivalPlaces(places,{scores:[0,1]});assert.equal(taste[0].id,'far');});

test('도시데이터 공식 XML의 중첩 인구 노드를 해석한다',()=>{const xml='<CITYDATA><AREA_NM>광화문&amp;덕수궁</AREA_NM><LIVE_PPLTN_STTS><LIVE_PPLTN_STTS><PPLTN_TIME>2026-10-04 15:00</PPLTN_TIME><AREA_CONGEST_LVL>여유</AREA_CONGEST_LVL></LIVE_PPLTN_STTS></LIVE_PPLTN_STTS></CITYDATA>';const r=crowdSummary(parseCityXml(xml),now);assert.equal(r.available,true);assert.equal(r.level,'여유');assert.equal(r.area,'광화문&덕수궁');assert.throws(()=>parseCityXml('<CITYDATA>'));});
