# Feature Backlog

Persistent feature board for future planning and implementation sessions.

## Agent workflow

Before starting any feature task:

1. Read this whole file.
2. Pick exactly one task unless the user explicitly asks for several.
3. Update only the selected task.
4. Set `Status` to `IN_PROGRESS` when implementation starts.
5. Keep `Current notes` short and concrete.
6. Update `Last updated` whenever the task status or notes change.
7. After implementation, mark completed checks in `Acceptance checks`.
8. If a decision is missing, set `Status` to `BLOCKED` and write the exact question in `Current notes`.

Allowed statuses:

- `TODO`
- `IN_PROGRESS`
- `BLOCKED`
- `DONE`
- `WONT_DO`

## Tasks

### B3 - Savings dashboard in rubles

- **Priority:** `P1`
- **Status:** `DONE`
- **Goal:** Show business-facing savings after route optimization: saved distance, saved time, and approximate savings in rubles.
- **Recommended slice:** Frontend-only MVP using existing base and optimized route metrics plus editable or default coefficients.
- **Decision needed:** Choose coefficients and UX placement before implementation. Recommended default: keep it near the existing metrics and avoid a new backend endpoint for MVP.
- **Implementation notes:** Reuse `baseRoute` and `optimizedRoute` from frontend state. Calculate savings from existing `distance_km` and `duration_minutes`; do not add `/savings` until there is a concrete reason.
- **Acceptance checks:**
  - [x] UI shows saved kilometers after optimization.
  - [x] UI shows saved minutes after optimization.
  - [x] UI shows approximate savings in rubles.
  - [x] User can understand or adjust the coefficients used for the estimate.
  - [x] No public API changes are required for the MVP.
- **Current notes:** Completed frontend-only savings dashboard under optimized metrics with editable default coefficients and no API changes.
- **Last updated:** 2026-05-30

### B4 - Before/after route comparison

- **Priority:** `P1`
- **Status:** `DONE`
- **Goal:** Make the route improvement visually obvious on the map.
- **Recommended slice:** Show base and optimized routes together: blue baseline route and green optimized route.
- **Decision needed:** Confirm whether MVP should be always-on dual-route display or a toggle. Recommended default: always show both routes after optimization.
- **Implementation notes:** Current map drawing has one active route layer. Add separate base and optimized route layers/sources rather than replacing the blue route when optimized route appears.
- **Acceptance checks:**
  - [x] After building the base route, the blue route is visible.
  - [x] After optimization, both blue base route and green optimized route are visible.
  - [x] Switching metrics does not make either route disappear unexpectedly.
  - [x] Clearing or regenerating points removes both route layers.
  - [x] Fallback straight-line routes still render correctly.
- **Current notes:** Completed MVP with independent blue/green route layers and map overlay toggles for base/optimized visibility; pytest passed and browser flow verified.
- **Last updated:** 2026-05-30

### B1 - Map style switcher

- **Priority:** `P2`
- **Status:** `DONE`
- **Goal:** Let the user switch map styles without introducing Mapbox token or authorization problems.
- **Recommended slice:** Add light/streets and dark styles first. Add satellite only after confirming a stable no-key provider.
- **Decision needed:** Confirm allowed style providers and whether satellite is required for the first implementation. Recommended default: ship light/dark only.
- **Implementation notes:** The app already uses MapLibre GL JS and OpenFreeMap style URL. Keep MapLibre; do not add Mapbox GL JS or `api.mapbox.com` dependency.
- **Acceptance checks:**
  - [x] User can switch between light/streets and dark styles.
  - [x] Existing points remain visible after style switch.
  - [x] Existing route layers are restored after style switch.
  - [x] No Mapbox token is required.
  - [x] Browser console has no Unauthorized errors from map providers.
- **Current notes:** MVP complete with OpenFreeMap liberty/dark switcher; points and B4 base/optimized routes restore after style reload; pytest and browser verification passed with no map provider Unauthorized errors.
- **Last updated:** 2026-05-30

### B2 - Addresses instead of coordinates

- **Priority:** `P3`
- **Status:** `TODO`
- **Goal:** Allow users to work with addresses instead of raw latitude/longitude where appropriate.
- **Recommended slice:** Create a separate planning task before implementation because provider, limits, ambiguity handling, and API shape must be chosen first.
- **Decision needed:** Choose geocoding provider, request limits policy, UX for ambiguous results, and whether addresses are stored or only resolved transiently.
- **Implementation notes:** Current app is coordinate-first and has no `/api/points/geocode` endpoint or address fields. Do not implement until product/API decisions are explicit.
- **Acceptance checks:**
  - [ ] Provider choice is documented before implementation starts.
  - [ ] API shape is documented before implementation starts.
  - [ ] UX for ambiguous or failed geocoding is documented before implementation starts.
  - [ ] Rate-limit behavior is documented before implementation starts.
  - [ ] Feature is not implemented until the decisions above are made.
- **Current notes:** Not started.
- **Last updated:** 2026-05-30
