# UI Haunting — Implementation Tasks

## Task 1: Halloween lobby scene
- [x] HalloweenStage renders SVG pumpkin, skeleton, moon, spider, ghosts
- [x] Pumpkin click toggles lantern glow (CSS class swap)
- [x] Skeleton click toggles dancing animation
- [x] "Wake the crew" button triggers ghost rise animation
- [x] All three interactions keyboard accessible (Enter/Space on focused element)

## Task 2: Persistent night-shift workbench
- [x] NightShiftScene renders pumpkin lanterns and pixel bat in sidebar during active recovery
- [x] Scene visible on both desktop sidebar and mobile header area
- [x] "Feed the bat" triggers a short flight animation

## Task 3: Pixel bat fly-bys
- [x] PixelBat renders 8-frame CSS sprite
- [x] Independent fly-by routes: leftbound and rightbound
- [x] Each fly-by has randomised departure delay, flight duration, and wingbeat phase
- [x] Rightbound sprites mirror the source left-facing artwork
- [x] Fly-bys use transform-only animation; no layout reflow

## Task 4: Skeleton Crew companion
- [x] Companion character renders in desktop sidebar and mobile accessible position
- [x] Reacts to `tls:decoded`, `tls:export`, `tls:error`, `tls:artifact-selected` events with contextual dialogue
- [x] Click companion to cycle through fictional archive banter lines
- [x] Companion never covers upload input or export controls

## Task 5: App-wide haunting effects
- [x] Cursor embers rendered via `pointer-events: none` overlay; do not intercept clicks
- [x] Edge fog layers on left/right viewport edges; CSS-only, no JS per-frame
- [x] Dialog and file-selection transitions use haunted entrance keyframes
- [x] All effects wrapped in `@media (prefers-reduced-motion: no-preference)` guards

## Task 6: Full/Calm toggle
- [x] Toggle button visible in header or sidebar
- [x] "Calm" disables: embers, fog, bat fly-bys, skeleton dancing, ghost drift
- [ ] Preference persisted in IndexedDB; restored on reload
- [x] `prefers-reduced-motion: reduce` forces Calm regardless of preference

## Task 7: Kiro badge
- [x] Badge renders official Kiro logo SVG (byte-for-byte match to source)
- [x] Links to kiro.dev; opens in new tab with `rel="noopener"`
- [x] Badge copy expresses intent/tribute; does not claim endorsement
