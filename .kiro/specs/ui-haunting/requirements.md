# UI Haunting — Requirements

## Overview
The Halloween presentation layer wraps the core recovery lab in an atmospheric, polished UI where spooky visual design directly enhances functional UX. This targets the **Best Costume Contest** category: the theme is not cosmetic decoration bolted on — it is the navigational and emotional frame for the entire experience.

## Functional requirements

- WHEN the user lands, THE SYSTEM SHALL display an interactive Halloween observatory lobby with a 3D CSS floppy disk, animated pumpkins, ghosts, skeleton and moon.
- THE SYSTEM SHALL allow users to toggle the pumpkin lantern (click), toggle skeleton dancing (click), and summon ghosts ("Wake the crew" button) — all keyboard accessible.
- THE SYSTEM SHALL display a persistent Skeleton Crew companion character that reacts contextually to decode events, export completions, errors, selected artifact types and dialog states.
- THE SYSTEM SHALL render an app-wide night-shift workbench scene (pumpkin lanterns, pixel bat) that persists during active recovery, not only on the lobby screen.
- THE SYSTEM SHALL provide a Full/Calm haunting toggle that reduces effects app-wide; this preference persists in IndexedDB.
- THE SYSTEM SHALL respect the OS `prefers-reduced-motion` media query to suppress moving apparitions.
- THE SYSTEM SHALL support decorative cursor ember effects that never intercept pointer events on recovery controls.
- THE SYSTEM SHALL display edge fog and occasional bats that never overlap or block file selection, upload, or export controls.
- ALL decorative interactions SHALL be purely cosmetic and SHALL NOT alter recovery data or session state.
- THE SYSTEM SHALL render dialog and file-selection transitions with haunted entrance animations.

## Non-functional requirements

- All Halloween assets (SVG, PNG, CSS) SHALL be self-hosted; zero remote asset requests from decoration.
- Animations SHALL target 60 FPS; debounced where appropriate.
- Dark-mode color palette SHALL be consistent across all views.
- Reduced-motion suppression SHALL apply to: ghost animations, bat fly-bys, cursor embers, skeleton dancing, and fog drift.
