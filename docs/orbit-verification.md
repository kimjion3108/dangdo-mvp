# ORBIT routing integration verification — 2026-10-05

## Source audit

Connected repository `kimjion3108/orbit-bike`: only main, one initial commit, `.gitattributes` only. Original navigation source cannot be reused until it is uploaded or its actual repository path is supplied.

## Executed checks

- 57 Node tests pass, including official-format routing fixtures, polygon risk avoidance, same-route result, missing risk provider, API authentication/cache, existing commerce and robot scheduling.
- Vite GitHub Pages production build (`--base=/dangdo-mvp/`) passes.
- Chromium 390×844 integration checks pass: GPS allow/deny and manual search, five transport modes, taxi traffic→R1/R2 reassignment, missed subway/boarding, FAST→SAFE path change (Leaflet SVG geometry differs), ETA 18:52→18:56 and expired deal removal, preparation reschedule, checkout consent, payment confirmation cancellation (zero new orders), order completion, share payload, order cancellation, history back, refresh, no horizontal overflow and no page runtime errors.
- Route and public-risk **test fixtures** were intercepted in the browser; they are not bundled into the app. Failure checks verify no fake ETA/recommendations on route failure, and only FAST/BALANCED with no risk scores when accident data are unavailable.
- A Leaflet animation/unmount error found during QA was fixed by disabling map animations and stopping the map before disposal.
- Python importer/training scripts compile. No actual training was performed; no trained model or measured model accuracy is claimed.

## External checks still blocked

There is no deployed routing backend or REST credential available to this task, and no public KoROAD polygon dataset supplied. Production live bike navigation and the KAIST→Expo Science Park route metrics therefore remain unverified. No actual safety-reduction percentage, bike-lane percentage, travel time or avoided public hotspot count is reported. Model version is baseline-1.0, not trained AI.

KakaoPay remains a clearly disclosed local MVP checkout. No KakaoPay approval, charge, merchant submission or actual robot action takes place.
