import test from 'node:test';
import assert from 'node:assert/strict';
import {findNearbyMerchants,SEARCH_RADII} from '../src/commerce/nearbySearch.js';
const destination={lat:36.38,lng:127.44};
const place=(id,kind='카페')=>({id,name:id,kind,lat:36.37,lng:127.43});
test('empty mountain area expands and fills each filter with three actual stores',async()=>{const calls=[],rows=Array.from({length:6},(_,i)=>place(String(i),i<3?'카페':'음식점'));const result=await findNearbyMerchants({destination,search:async radius=>{calls.push(radius);return radius<7000?[]:rows;}});assert.deepEqual(calls,[1000,3000,7000]);assert.equal(result.length,6);assert.equal(result.filter(p=>p.kind==='카페').length,3);assert.ok(result.every(p=>p.distance>0));});
test('deduplicates larger-radius results and preserves partial results when expansion fails',async()=>{const result=await findNearbyMerchants({destination,radii:[1000,3000,7000],search:async r=>{if(r===7000)throw Error('offline');return [place('same'),place('food','간편식')];}});assert.equal(result.length,2);assert.equal(result[1].kind,'음식점');});
test('aborted destination does not publish stale results; empty results never fabricate stores',async()=>{const c=new AbortController();await assert.rejects(findNearbyMerchants({destination,signal:c.signal,search:async()=>{c.abort();return [place('old')];}}),{name:'AbortError'});let calls=0;assert.deepEqual(await findNearbyMerchants({destination,search:async()=>{calls++;return [];}}),[]);assert.equal(calls,SEARCH_RADII.length);assert.ok(Math.max(...SEARCH_RADII)<=20000);});
