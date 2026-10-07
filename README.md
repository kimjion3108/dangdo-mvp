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
| Bike routes / risk | Official route proxy implemented; deployment requires backend. Accident export required for baseline risk/SAFE. No invented lane ratio or nearby bikes |
| Walking | Straight-line distance × route factor / assumed 4.5 km/h; no real walking route |
| Merchant inventory/wait/deals/capacity/rewards | Demo Merchant State |
| Preparation / robot fleet / dispatch / arrival gap | Local deterministic simulation, no merchant or physical robot API |
| Payment | Explicit consent-gated MVP checkout; no charge or merchant submission |

No public-data feed is connected in the deployed Pages frontend. Official integration references checked: [Kakao Mobility public automobile directions](https://developers.kakaomobility.com/guide/navi-api/start.html), [Seoul subway arrivals](https://data.seoul.go.kr/dataList/OA-12764/A/1/datasetView.do), [KoROAD bicycle accident hotspots](https://www.data.go.kr/data/15056681/openapi.do). They require appropriate server configuration/access; browser JS key is not a REST key. No private APIs/crawling are used.

### Hero demos

Settings → Arrival Commerce Demo → Seongsu scenario resets virtual clock to 18:23. Compare transport, start, purchase Move Coffee with explicit MVP consent. Arrival Sync shows R1 / 18:47. Open Demo → traffic +11: arrival 18:58, coffee deal expires, prep is delayed, R1 released and R2 reserved, arrival gap 0. Return to Journey to see reranked merchants.

For transit: reset scenario → Transit → buy → Demo → missed train. Catchable 7-minute train becomes 15-minute train; arrival 18:51→18:59, preparation rescheduled, robot reassigned. Boarding advances virtual clock while preserving ETA.

For bike: connect the routing backend and covered public accident data first. Select FAST → SAFE; the actual selected duration propagates through recommendations, preparation and dispatch. There is no fixed production 18:52/18:56 bike scenario.

`npm test` includes normalized ETA, catchable train, missed-train propagation, FAST/SAFE deal and robot changes, traffic release/reassignment, HOLD, started-prep preservation and non-overlapping robot reservations. Mobile browser QA uses 390×844 with GPS granted/denied and network fixtures; fixture tests do not prove a live external provider. Production map/share initialization is checked separately after Pages deployment.

### ORBIT official-route integration (2026-10-05)

The old illustrative offset routes, invented lane percentages, green lane strokes, and preset risk numbers have been removed. The connected `kimjion3108/orbit-bike` repository was inspected: main contains only `.gitattributes`, and no other branch/source is available. This update does **not** claim to reuse missing ORBIT navigation source.

- `server/bicycle.js`: GET `/api/routing/bicycle`, official `https://dapi.kakao.com/v2/routing/bicycle`, validated coordinates and SHORTEST / ACCESSIBLE / BIKE_ONLY options, server-only REST key, timeout, bounded five-minute cache. No private API.
- `src/orbit/routeProvider.js`: preserves official `legs[].steps[].path.points` geometry, duration, distance and guidance. Only trusted Kakao landing URLs are accepted.
- `src/orbit/geometry.js`: <=100 m analysis segments preserving raw bends, polygon/hole overlap lengths and near distances. Display uses source geometry; no generated shortcut lines.
- `featureExtractor.js`, `riskModel.js`, `riskInference.js`, `modelMetadata.js`: separate feature extraction and **ORBIT Risk Baseline 1.0**. This is a transparent exposure index, not a trained AI model or accident probability. No unavailable intersection, road-share or signal inputs are invented.
- `src/mobility/orbitRouting.js`: official candidates → segmentation → feature extraction → inference → scoring → selected candidate. FAST shows official SHORTEST; BALANCED shows official ACCESSIBLE; SAFE minimizes minutes + 2.0 × displayed risk across all returned candidates. Costs for FAST/BALANCED use 0.2/0.8 for inspection; their official route modes remain fixed as requested. No hidden divide-by-ten. Identical geometry is explicitly reported; route differences are never forced.
- `OrbitSafety.jsx`: concise Korean cards, true path comparison, avoided hotspot count/overlap distance, ETA change, official step guidance and Kakao Maps handoff. Safe selection drives the existing recommendation, preparation and robot pipeline.
- Payment: product → KakaoPay method → required no-charge consent → amount/arrival confirmation sheet → local order → Arrival Sync. Cancel/close creates no order. This is a DANGDO MVP flow, **not a KakaoPay authorization screen or charge**.
- Black bottom toast replaced by inline feedback. Browser history follows screen transitions; first Home back asks again, second follows browser history. No `window.close`.

#### Activation and accurate data status

GitHub Pages hosts the frontend only. Set the deployed backend's `KAKAO_REST_API_KEY`; set repository variable `DANGDO_API_BASE_URL` to that backend. Do not put REST keys in VITE variables or localStorage. The backend CORS origin must match `FRONTEND_URL`.

No live backend credentials or public accident dataset were available in this workspace. Consequently deployed Bike mode may show **route connection required**. It must not show a simulated live path. If routing works but accident data do not, FAST/BALANCED remain available and SAFE/risk values are omitted. A successful empty hotspot result is accepted only when the server certifies geographic coverage.

`ORBIT_HOTSPOTS_FILE` accepts a lawful KoROAD GeoJSON export normalized with `scripts/import_orbit_hotspots.py`. Metadata must include source URL/year and verified coverageBounds; each feature must be a Polygon/MultiPolygon. Features preserve occurrence/casualty/fatality/serious-injury counts. The file is loaded once and filtered by a route-envelope request, not requested for each route coordinate. **A direct KoROAD API downloader is not connected.** Accident polygons, actual bike-lane geometry, public signals and T Bike availability are not live on the deployed app.

`train_orbit_risk_model.py` is an optional offline training pipeline: >=200 sourced samples, >=5 geographic areas, grouped holdout, weak exposure labels, logistic regression and exported model metadata/validation. No actual training dataset was available; no trained artifact or accuracy claim is shipped. The production UI uses baseline-1.0 only; a trained model would require separate validation and inference deployment.

Official documentation: https://developers.kakao.com/docs/ko/kakaomap/rest-api and https://www.data.go.kr/data/15056681/openapi.do.

#### Verification scope

Node tests exercise documented response fixtures, exact geometry preservation, polygon exposure/hole handling, safe candidate selection, identical routes, unavailable providers, server-only authorization/cache, ETA/deal/preparation/robot propagation and prior app behavior. Browser fixtures are test-only, not production demo data. These checks do **not** prove real KAIST → Expo Science Park API access. Real route times, risk scores, avoided hotspot counts and lane percentages cannot be reported until the server and public dataset are connected.

### Uploaded ORBIT source now integrated

The subsequently supplied `orbit-bike.zip` resolves the missing-source blocker. See [source integration and limits](docs/orbit-source-integration.md). DANGDO now uses the original Valhalla/OSM bicycle engine directly from Pages, ports polyline decoding and GPS guidance/rerouting, imports the original nearby-road inventory semantics, and adds detected accident polygons to a genuine routing avoidance request. Original secrets and SQLite chat data are excluded from commits. The Kakao route proxy is retained for an optional backend but is not mislabeled as the active ORBIT route provider.

Actual public accident requests currently fail; SAFE risk analysis is unavailable until that data connection is repaired. Real routing works independently and FAST/friendly directions remain available. No trained AI or accident-probability claim is introduced. Payment confirmation/cancel/completion remains the consent-gated local MVP flow.



## Active Charging
기존 시작화면과 이동·상점·주문 흐름을 유지합니다. 설정 → 자동충전에서 주차 위치 확인, 모듈 배정, 통로 이동, 정렬, 충전 완료와 여러 차량 출차 우선순위를 시연합니다. 실내 위치와 충전장치는 시뮬레이션이며 실제 BLE·주차 관제와 연결되지 않습니다. 계산은 `src/charging/chargingScheduler.js`, 데이터는 `parkingData.js`로 분리했습니다.


## 이동 취향과 ORBIT 비교
설정 → 내 이동 취향에서 안전 선호, 보행·자전거 이동 속도, 상점 종류, 혜택을 직접 선택한다. 취향은 이 브라우저에 저장되며 도보 ETA, 자전거 후보별 추정 시간과 안전 비용, 상점 정렬에 반영된다. 속도 변경은 기존 경로 시간에 대한 개인별 추정 보정이며 실시간 교통 정보가 아니다. 안전 우선은 SAFE 비용의 위험 가중치를 높인다. 프로필 보정은 원본 시간을 보존해 반복 적용해도 누적되지 않는다.

사용자 화면의 남은 시간과 대기시간, 인계 시간 차이는 정수 분으로 올림한다. 실제 이동 경과 초와 로봇 배차 비용은 내부에서 정밀도를 유지한다.

ORBIT 비교는 실제 후보 폴리라인과 사고구간 노출 분석 결과에서 계산한다. 안전 경로 선택 시 빠른 경로와 안전 경로를 동시에 표시하고 우회한 구간에 ‘우회’를 표시한다. 위험 감소는 자체 점수 변화이며 실제 사고 확률 변화가 아니다. 사고 데이터 서버가 연결되지 않으면 SAFE 또는 위험 감소를 만들어내지 않으며 일반 경로만 제공한다. GitHub Pages에 별도 API 서버가 설정되지 않은 경우 사고구간 회피는 사용할 수 없다.

설정 → 이동 시나리오 → 성수 시나리오에서 바이크를 선택하면 외부 서버 없이 ORBIT 우회를 검증할 수 있다. `src/data/orbitScenario.js`의 서로 다른 경로와 교차로 위험영역을 실제 segment/exposure/cost 엔진으로 분석한다. 이 입력은 시나리오 데이터이며 공공 사고 기록이나 실제 자전거 안내가 아니다. 일반 목적지 검색에서는 이 데이터를 사용하지 않는다.

## 이동체를 찾아가는 충전
충전 존 안에서 주차 위치와 방향을 직접 바꾼다. 자동차/택시/바이크 선택에 따라 수신부 위치, 배터리 용량, 공극, 코일 반경, 최대 수신 전력이 달라진다. 모듈은 통로를 거쳐 해당 수신부 아래로 이동하고 정렬한다. 카카오 T 바이크 맥락을 검증하는 개념 UX이며 실제 공유 바이크/차량의 무선충전 지원 또는 장치 연동을 뜻하지 않는다.

`chargingPhysics.js`는 가속/정속/감속 이동, 정렬 오차에 따른 결합 효율, P×효율에 따른 배터리 전달 전력, 80% 이후 충전 출력 감소, 에너지 보존을 계산한다. 구체적인 코일/출력/공극 값은 제품 사양이나 실험 측정값이 아닌 MVP 가정이다. 효율식은 검증된 전자기 해석 대신 단순화한 감쇠 모델이다. SOC, 전달 에너지, 손실 에너지와 남은 시간은 같은 모델에서 계산한다. 화면 재생은 압축된 시뮬레이션 시간이며 실제 충전시간은 모델의 분 단위 예상값이다. 여러 이동체는 출차 순서로 배정하며 모듈을 중복 예약하지 않는다.

참고: ORNL 무선 전력 전달 연구는 코일 형상, 공극 및 정렬이 효율에 영향을 준다는 배경이다. 여기의 가정 효율이나 곡선은 ORNL 실험 결과가 아니다.
https://impact.ornl.gov/en/publications/fourier-analysis-and-loss-modeling-for-inductive-wireless-electri/

## 휠체어와 무장애길
휠체어는 여섯 번째 이동수단이다. Valhalla의 공식 pedestrian `type: wheelchair`와 개인 이동 속도로 경로와 ETA를 요청한다. 일반 보행 경로를 무장애 검증 경로라고 표시하지 않는다. 지도에 기록되지 않은 단차, 경사, 통행 장애는 보장할 수 없다. 성수 시나리오는 별도 경로 fixture를 사용한다. 승차 위치의 무장애길 정렬은 `wheelchair=yes` 표시를 우선하고 `wheelchair=no`, 계단, 높은 연석 등 알려진 장애 지점을 제외한다. 확인되지 않은 접근성은 `unknown`으로 유지한다. 표시된 승강장 접근성은 전체 접근 경로의 인증이 아니다.
https://valhalla.github.io/valhalla/api/route/api-reference/
https://wiki.openstreetmap.org/wiki/Key:wheelchair

## 혜택과 사운드
주변 실재 장소에 적용하는 상품/혜택 fixture는 장소 ID별로 고정된 5~15% 도착 할인과 캐시 적립 또는 사은품을 포함한다. 할인은 카드, 상세, 결제 및 주문 완료의 동일 견적에 반영한다. 검증된 가맹점 혜택 데이터가 있으면 해당 할인율과 시간대를 우선한다. 실제 금액은 청구하지 않는다. 사용자 제공 약 1.87초 음원을 시작하기, 목적지로 출발, 승차 위치 추천, 충전 진입, 주차/충전 신청에 재생한다. 브라우저가 재생을 차단해도 사용자 흐름은 계속된다.


### Parking controls and resonant circuit model
The steering control and forward/reverse buttons use a kinematic bicycle model. Whole rotated vehicle footprint must fit inside a charging zone; arbitrary parking uses bounded generated poses. The module moves along X/Y waypoints then rotates to the receiver yaw.
An assumed 85 kHz resonant equivalent circuit computes M = k sqrt(L1 L2), Q = ωL/R and matched-load coil efficiency χ/(1+sqrt(1+χ))², χ=k²Q1Q2. Converter efficiency is assumed 0.96. Offset, gap, yaw and tilt affect assumed coupling. This is a conceptual model, not electromagnetic field simulation or validated equipment performance. Planar yaw differs from coil-normal tilt. Reference: https://www.ornl.gov/publication/field-enhancement-integration-design-featuring-misalignment-tolerance-wireless-ev

### Bike fallback and T Bike profile
When accident data is unavailable, stable seeded test polygons are generated around route maneuver points (or path bends if no maneuver details), sent to the existing exclusion routing adapter and included in route scoring. These are not verified accident sites or necessarily surveyed intersections. Source kind remains DEMO and appears in analysis information. Real routing geometry is retained; failure to generate a distinct avoidance path is reported rather than fabricated. The Kakao T Bike-use option is DANGDO's balanced time + 0.8 × risk recommendation, not a Kakao T API or fleet availability integration.
