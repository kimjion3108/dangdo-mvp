# DANGDO: one moving-contact engine

DANGDO는 현실에서 움직이는 두 주체의 마지막 접점을 실시간으로 다시 정한다.

Taxi and robot are two validation scenes for the same graph-based rendezvous problem. Charging reverses the last-leg movement: the parked vehicle stays while a capable module travels to its measured position. Arrival Commerce reuses the destination and resulting travel ETA; it is a continuation, not the home screen.

## Implemented flow

Welcome → browser GPS or origin search → destination search → Dynamic Pickup comparison → accept → moving user and vehicle → delay and optional new contact → meeting → destination journey → ETA-dependent merchant recommendation → product → consent/confirmation → local demo order. The meeting result also continues to Robot Handoff and Active Charging. The introduction and familiar search/map/pay design are retained; no equal-sized four-service home menu is added.

## Engines

- `contact/scenarios.js`: single source for all **new** deterministic scenario geometry, accessibility and parking fixtures. Existing commerce/transit demo datasets remain in their existing modules.
- `dynamicPickupEngine.js`: Dijkstra path traversal on a directed vehicle graph and bidirectional walking graph; evaluates walk/approach ETA, max-ETA rendezvous, arrival gap and walking penalty. Illegal/unavailable candidates are filtered first. `replanFromFrame` splits the current edges and starts from the actors' actual simulated positions, preserving completed movement. `shouldPropose` requires at least 60 seconds benefit plus 25 seconds switching penalty. Every change is explicitly accepted or refused. Routes on the real basemap are **scenario geometry**, not official live taxi driving/walking directions or verified legal curbs.
- `handoffEngine.js`: shared rendezvous engine; robot-inaccessible stair contact is excluded. The same UI component renders both scenes.
- `chargingScheduler.js`: earliest departure priority, capable/available modules, non-overlapping reservations, aisle routes, energy and charge duration. Status progresses through allocation, approach, receiver search, alignment and charging. Multiple requests use the same scheduler. Admin metrics derive from the jobs, not constants. Daily throughput is an eight-hour capacity estimate with constant power, not measured fleet productivity.
- `adapters/contactAdapters.js`: injectable mobility/robot/parking provider contracts and live merchant search adapter. The default physical adapters advertise `mode: simulation`. The parking adapter explicitly sets `gpsAvailable: false`, `positionSource: SIMULATED_BLE`; no browser BLE positioning or real camera calibration is claimed.

## Measurement

Static and dynamic routes start in the same scenario. Their meeting seconds, vehicle/robot approach meters, walking seconds and arrival mismatch are calculated. Position increments are deterministic accelerated virtual seconds. Delay is injected into both the fixed-contact counterfactual and active trajectory. On accepted replanning, already traveled distance and time are preserved in final measurements. The PoC screen computes time reduction, approach reduction and extra walking from this run. These are **simulated**, not field-trial taxi results. The static comparator is computed through the same engine rather than separately playing a second vehicle.

## API audit — 2026-10-07

Official references inspected:

- [Kakao Maps Web guide](https://apis.map.kakao.com/web/guide/): JS map SDK, services library, place search, marker/polyline display and map links. Existing public JS build key is used; no key entry UI or server secret in client.
- [Kakao Mobility Directions](https://developers.kakaomobility.com/guide/navi-api/start.html): car directions, multiple origins/destinations and future directions, REST authentication. No REST key/backend is configured for the new contact engine. Do not label scenario approach paths as Kakao routing results.
- [Official BRING / parking cooperation](https://www.kakaomobility.com/newsroom/detail/카카오모빌리티-삼성물산과-주거단지-빌딩-내-로봇-및-주차-솔루션-협력-협약체결-209): establishes product context, not a usable public robot/BLE dispatch SDK. No public taxi-after-dispatch/BRING/parking-device API was confirmed in the inspected documentation; these integrations remain explicit adapters.

| Feed | Runtime source |
|---|---|
| Map / place search | Kakao JS SDK; OSM/Nominatim fallback |
| Origin GPS | Browser permission; manual search fallback |
| Vehicle / robot positions / contact candidates | Central deterministic scenario fixtures |
| Walking / approach / rendezvous | Scenario graph engine, not real street routing |
| Destination ETA | Existing mobility engine; estimated car/walk, demo transit; existing ORBIT provider for bike |
| Merchant names / locations | Live nearby search |
| Wait / stock / example products / cashback / gifts | Seeded MVP Merchant State |
| Payment | DANGDO Pay demo UX, local order; no authorization or charge |
| Indoor positioning / camera alignment / charge modules | Simulation adapter |

Demo Mode appears once at the physical-scene heading. Detailed provenance is in Service Information and this document, rather than repeated caveats on every card. Checkout retains one necessary no-charge consent. The payment flow uses DANGDO naming and no copied Kakao Pay logo or authorization claim.

## Demo and verification

Start → origin / destination → compare pickup → accept → press vehicle delay → accept new contact → meeting → PoC. From the same result select robot → accept → handoff. Then charging → park → multiple requests → charge → watch current phase, advance virtual time and inspect admin results. Return to the meeting result and continue toward destination to purchase a suggested item.

`npm test` covers meeting optimization, converging trajectories, frame-based reroute, hysteresis, robot accessibility, charging reservation conflicts, aisle paths and derived admin metrics. Mobile browser QA uses network fixtures only for place/map availability; production Kakao integration is verified separately. Existing bike and transit providers remain intact.

### Verified 2026-10-07

- Node suite: 76 passed, zero failures.
- 390×844 click-through: GPS granted and denied/manual-search, destination, accept pickup, delayed vehicle/new contact accepted, calculated PoC table, robot handoff completion, simultaneous charging/departure priority/admin statistics/completion, ETA merchant cards/detail, cancel then confirm demo payment, completed local order/Kakao Share payload, browser back and reload.
- No page runtime errors; no horizontal overflow at 390 px or 1280 px. Primary buttons remain usable; notices are placed near the top and ignore pointer events.
- These automated browser checks use test-only network fixtures for external place/map availability, and do not certify a real taxi, robot or charging device connection.
