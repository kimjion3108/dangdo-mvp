import {contactScenario,CONTACT_SOURCE,parkingFixture} from '../contact/scenarios.js';
import {searchArea,nearbyKakao,nearbyOSM,loadKakao} from '../places.js';
// No undocumented dispatch, BRING or BLE endpoints. An injected provider must satisfy this contract.
export function createMobilityAdapter(provider){return provider||{source:CONTACT_SOURCE,createScenario:origin=>contactScenario(origin,'taxi')};}
export function createRobotAdapter(provider){return provider||{source:CONTACT_SOURCE,createScenario:origin=>contactScenario(origin,'robot')};}
export function createParkingAdapter(provider){return provider||{source:CONTACT_SOURCE,locateVehicle:()=>({...structuredClone(parkingFixture),positionSource:'SIMULATED_BLE',gpsAvailable:false})};}
export function createMerchantAdapter({key='',fetcher}={}){return {source:key?'Kakao Places':'OpenStreetMap',search:(query,signal)=>searchArea(query,key,signal),nearby:async(destination,signal)=>key?nearbyKakao(await loadKakao(key),destination,1000):nearbyOSM(destination,1000,signal)};}
export const mobilityAdapter=createMobilityAdapter(),robotAdapter=createRobotAdapter(),parkingAdapter=createParkingAdapter();
