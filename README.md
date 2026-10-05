# DANGDO · 당도

**Destination × ETA × Merchant State → Recommendation → Purchase**

당도는 사용자가 이미 정한 목적지와 도착 예상시간을 기준으로 도착 시점에 이용하기 좋은 상품을 추천하는 Arrival Commerce MVP입니다.

## 현재 흐름

시작 → 이동수단 선택 → GPS 또는 출발 지역 검색 → 카카오맵과 목적지 검색 → 예상 도착시간 → 이동 시작 → 도착 맞춤 추천 → 상품 상세 → 카카오페이 형태의 결제 확인 → MVP 주문 완료 → 공유/주문 내역.

기본 출발 위치는 없습니다. GPS 거부 시에도 지역 검색으로 사용 가능합니다. 작동이 확인되지 않은 로그인은 노출하지 않습니다. 예전 기기 계정·주변 탐색·정산 모듈은 저장소에 남아 있으나 현재 진입 화면에 연결하지 않았습니다.

## 실제 API와 MVP 데이터

| 구분 | 현재 구현 |
| --- | --- |
| 지도/장소 검색 | 카카오맵 JavaScript SDK와 Places. 연결 불가 시 Leaflet/OpenStreetMap/Nominatim |
| GPS | 버튼을 눌러 허용한 경우 브라우저 Geolocation API. 좌표 이력 저장 없음 |
| ETA | 출발/목적지 직선 거리 × 우회 계수와 이동수단 속도의 로컬 추정. 실시간 경로/교통 ETA 아님 |
| 가맹점/상품/거리/상태 | `demoMerchants.js` 예시 가맹점. 실재 업체 API·실제 좌표·리뷰·재고가 아님. 화면에서 Demo Merchant State 명시 |
| 추천 | `arrivalEngine.js` 로컬 점수. 거리 + ETA 적합 + 예상 대기 + 할인 + 혼잡 + 선택 취향. ETA 적합 가장 큰 비중 |
| 결제/주문 | 실제 청구/매장 전송 없는 MVP 주문. 결제 직전 명시적 체크박스 확인. 잔액/카드번호/금융 정보 없음 |
| 카카오톡 공유 | 공식 SDK를 초기화할 수 있으면 공유창. Web Share/클립보드와 미리보기 대체 경로. 자동 발송 없음 |
| Arrival Reward | 일부 예시 가맹점에만 표시. 실제 가맹점 제공 혜택 아님 |

지도 위 예시 가맹점 위치는 목적지 주변 시각화용입니다. 실제 매장으로 오인하지 않도록 지도에도 표시합니다. 예시 상품 공유의 좌표 링크 역시 예시 위치이며, 상품 상세/완료 화면의 카카오맵 버튼은 실제 목적지를 엽니다.

카카오 JavaScript 키는 `VITE_KAKAO_MAP_KEY` 환경변수로 빌드 시 주입합니다. UI 키 입력/출력과 localStorage 키 저장은 없습니다. 브라우저용 JavaScript 키는 SDK 네트워크 요청에서 사용되므로 카카오 개발자 설정의 허용 도메인 제한이 필요합니다. REST 키/Client Secret은 프론트엔드에 사용하지 않습니다.

## 추천 규칙

도착 시간이 딜 시간대에 포함되면 ETA 적합 +60, 준비가 남은 이동시간 안에 완료될 수 있으면 +35. 예상 대기·혼잡·먼 거리는 감점합니다. 재고 없음 또는 예상 이용 시각이 마감 이후면 주문을 차단하고 하위에 배치합니다. 정가에 할인율을 적용하고 원 단위 반올림합니다. 예: 12,000원 × 18% 할인 = 9,840원. 카드, 상세, 결제에서 같은 계산을 사용합니다.

준비 완료 예상은 주문 시각 + 대기/준비시간과 '도착 3분 전' 중 늦은 시각입니다. 일반 흐름에서도 가맹점 상태는 예시 데이터이며 실제 주문 예약을 약속하지 않습니다.

## 심사용 시나리오

설정 → **Arrival Commerce Demo** → **성수 시나리오 시작 · 18:47** → 이 목적지로 출발.

1. 18:47 도착, 무브커피가 1위. 19:00까지 20% 딜과 도착 전 준비 가능.
2. 설정 → Demo → 교통 체증 ETA +19분. **19:06**으로 변경되고 추천 업데이트 안내 표시.
3. 커피 딜은 빠지고 **19:00–19:30 성수버거**가 1위로 올라옴.
4. 시나리오를 재시작하고 무브커피 대기 변화 버튼을 누르면 온더볼이 1위. 상품 상세 → 결제 확인 → 동의 → 9,840원 MVP 주문.
5. **18:44 준비 / 18:47 도착**, 사은품과 공유. 주문 내역에서 취소 가능.

고정 시각은 이 명시적 데모에서만 사용합니다. 설정에서 대기·혼잡·재고·할인율을 수정하거나 10분 진행/자동 진행을 제어할 수 있습니다. 주문은 이 브라우저에 저장되고, 위치와 이동 경로는 저장하지 않습니다. 새로고침은 시작 화면으로 돌아오며 주문 내역은 유지됩니다.

## 실행 및 검증

```sh
npm ci
npm run dev
npm test
npm run build
# GitHub Pages와 동일한 경로 확인
npm run build -- --base=/dangdo-mvp/
```

단위 테스트는 ETA·시간대·할인·상태 변경·품절·마감·추천 순위·기존 공유/인증/정산을 검증합니다. 390×844 브라우저 검증 항목: GPS 허용/거부, 출발/목적지 검색, 이동수단, ETA/출발, 추천 이유, 상태/ETA 재추천, 할인/상세/확인/완료, 공유, 주문 취소, 뒤로가기, 새로고침, 가로 overflow, runtime error.

실시간 차량/지하철 ETA, 가맹점 상태 API, 서버 주문, 카카오페이 실결제, 실제 로그인, 자동 카카오톡 알림은 구현되지 않았습니다. 과거 공공 API 서버 코드는 현재 화면에 연결되어 있지 않습니다. 당도는 카카오 공식 앱이 아닌 독립 프로젝트입니다.

## Multi-Modal Arrival Commerce (October 2026)

The existing white/yellow UI, real place search, GPS/map, merchant cards, checkout and share flow are retained. Entry now follows Welcome → GPS/manual origin → destination → transport comparison → Journey → purchase → Arrival Sync.

`mobility/mobilityEngine.js` normalizes five modes into `humanArrivalETA` / `estimatedArrivalTime`. Taxi/car and walking are distance estimates; transit selects an attainable train using walk-to-station + boarding buffer; Bike Intelligence compares FAST/SAFE route factors. Original ORBIT source/data was not present in this repository: its specified concepts have been implemented here, not represented as an imported production system.

`arrivalEngine.js` weights arrival-window fit above distance/reviews. `arrival/preparationScheduler.js` delays preparation until needed and preserves preparation already started. `physical/robotDispatchEngine.js` scores arrival gap, robot travel, battery, availability/current-job windows and overlapping reservations. It releases/reassigns a reservation when necessary, keeps an already dispatched robot, and exposes an unsynchronized gap or unavailable robot rather than fabricating synchronization. Paid demo order prices remain fixed after ETA updates.

### Sources and limits

| Feature | Source / deployed status |
|---|---|
| GPS | Browser Geolocation after permission; manual search when refused |
| Map / destination search | Kakao JS Maps/Places when build key works; OSM/Nominatim fallback |
| Kakao sharing / map links | Official Kakao Share SDK chooser; Web Share / clipboard fallback, exact map destination |
| Taxi/car route | Distance estimate; demo traffic delay. No live road routing |
| Transit journey / subway arrivals | Demo transit data. Existing server public-data adapter retained but no deployed public key/backend connected |
| Bike FAST/SAFE, risk, road share, hotspots, nearby bikes | DEMO; illustrative factors, not actual navigation, T Bike inventory or live safety guidance |
| Walking | Straight-line distance × route factor / assumed 4.5 km/h; no real walking route |
| Merchant inventory/wait/deals/capacity/rewards | Demo Merchant State |
| Preparation / robot fleet / dispatch / arrival gap | Local deterministic simulation, no merchant or physical robot API |
| Payment | Explicit consent-gated MVP checkout; no charge or merchant submission |

No public-data feed is connected in the deployed Pages frontend. Official integration references checked: [Kakao Mobility public automobile directions](https://developers.kakaomobility.com/guide/navi-api/start.html), [Seoul subway arrivals](https://data.seoul.go.kr/dataList/OA-12764/A/1/datasetView.do), [KoROAD bicycle accident hotspots](https://www.data.go.kr/data/15056681/openapi.do). They require appropriate server configuration/access; browser JS key is not a REST key. No private APIs/crawling are used.

### Hero demos

Settings → Arrival Commerce Demo → Seongsu scenario resets virtual clock to 18:23. Compare transport, start, purchase Move Coffee with explicit MVP consent. Arrival Sync shows R1 / 18:47. Open Demo → traffic +11: arrival 18:58, coffee deal expires, prep is delayed, R1 released and R2 reserved, arrival gap 0. Return to Journey to see reranked merchants.

For transit: reset scenario → Transit → buy → Demo → missed train. Catchable 7-minute train becomes 15-minute train; arrival 18:51→18:59, preparation rescheduled, robot reassigned. Boarding advances virtual clock while preserving ETA.

For bike: reset scenario → Bike FAST → buy → SAFE. 18:52→18:56 crosses coffee's 18:55 deal cutoff; recommendations, preparation and dispatch recalculate. Safety data are explicitly DEMO. No live signal claim.

`npm test` includes normalized ETA, catchable train, missed-train propagation, FAST/SAFE deal and robot changes, traffic release/reassignment, HOLD, started-prep preservation and non-overlapping robot reservations. Mobile browser QA uses 390×844 with GPS granted/denied and network fixtures; fixture tests do not prove a live external provider. Production map/share initialization is checked separately after Pages deployment.

### ORBIT segment safety routing

Bike candidates now consist of actual distinct DEMO polylines split into segments. Each segment stores distance, travelTime, bikeLane coverage, detected accident risk, intersections, arterial risk and crossings. Hazard passage is computed by point-to-segment distance (30 m Demo zones); the same hazard markers remain on the map after switching routes. SAFE does not hide dangerous points: its path avoids B/C/D while A remains unavoidable in this graph.

Route risk is the sum of hazard severity × 4, intersection count × 3, no-bike-lane distance share × 20, distance-weighted arterial risk × 20, and crossings × 1.5, capped at 100. Segment penalties and route components are retained for inspection. This is a local illustrative model, not calibrated accident probability. DEMO road attributes and graph coordinates must not be used as real navigation.

FAST minimizes `Time + 0.2 × RoutingRisk`; BALANCED minimizes `Time + 0.8 × RoutingRisk`; SAFE minimizes `Time + 2.0 × RoutingRisk`. Time is minutes. **RoutingRisk = displayed 0–100 Risk Score / 10**, so the optimization uses 0–10 risk units. UI explains this normalization. Without it, the old 29 min / Risk 62 versus 33 min / Risk 24 numbers would make even FAST choose the latter. Every profile evaluates all candidates and may legitimately pick the same path; no route winner is forced by its label.

The fixed 18:23 demo yields:

| Profile | Time | ETA | Risk Score | Hotspots | Bike lanes |
|---|---:|---|---:|---:|---:|
| FAST | 29 min | 18:52 | 62 | 4 | 43% |
| BALANCED | 31 min | 18:54 | 35 | 1 | 62% |
| SAFE | 33 min | 18:56 | 24 | 1 | 78% |

FAST → SAFE: +4 min, score −38 (61%), 3 hazard zones avoided, 5 fewer risk intersections, 2 fewer major-road crossings. Additional bike-lane distance is calculated from the actual Demo segment lengths, not a fixed 2.1 km claim.

`More safe route` previews the actual different polyline without changing the trip/order. `Select safe route` commits ETA 18:52→18:56, removes Move Coffee's 18:55 Arrival Deal, reranks merchants, reschedules preparation and robot dispatch. A comparison toggle draws both polylines; green indicates Demo bike-lane segments and gray hazard markers indicate avoided zones. The reasons panel explains why the recommendation changed. Debug panel labels bike routes, accident hotspots and bike lanes DEMO, safety score DANGDO/ORBIT model and signals unconnected.

Routing tests also modify hazard positions/severity and verify the selected SAFE path changes, and verify all zero risk penalties select the fastest path. No risk-reduction or public-data/API claims are inferred from these simulations.
