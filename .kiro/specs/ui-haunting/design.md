# UI Haunting — Design

## Component map

```
app/layout.jsx
  └─ AppHaunting.jsx          ← ghost summon, cursor embers, fog, bat fly-bys
       └─ HalloweenStage.jsx  ← lobby SVG scene (pumpkin, skeleton, moon, spider)
       └─ NightShiftScene.jsx ← persistent workbench scene (bat, lanterns)
       └─ PixelBat.jsx        ← 8-frame CSS sprite bat, independent fly-bys
       └─ Laboratory.jsx      ← core recovery UI, receives hauntingLevel prop
            └─ Floppy.jsx     ← interactive 3D CSS disk insert animation
```

## State

| State | Location | Persistence |
|---|---|---|
| `hauntingLevel` ('full'\|'calm') | AppHaunting | IndexedDB via session-store |
| `ghostsAwake` | AppHaunting | in-memory |
| `pumpkinLit` | HalloweenStage | in-memory |
| `skeletonDancing` | HalloweenStage | in-memory |
| `skeletonDialogue` | AppHaunting | in-memory, driven by events |

## Event bus (custom events)

Components emit `CustomEvent` on `window` so the haunting layer can react without tight coupling to the recovery pipeline:

- `tls:decoded` — artifact successfully decoded
- `tls:export` — bundle or file exported
- `tls:error` — decode/archive error
- `tls:artifact-selected` — user selects a file; payload: `{kind}`

## CSS architecture

| File | Scope |
|---|---|
| `app/globals.css` | Layout, typography, responsive, reduced-motion resets |
| `app/halloween.css` | SVG scene, pumpkin, skeleton, ghost, moon, spider keyframes |
| `app/haunting.css` | App-wide embers, fog, bat routes, dialog entrances |
| `app/grand.css` | Color palette tokens, dark-mode surface hierarchy |

## Accessibility

- All interactive decorations have `aria-label` and `role="button"` where needed.
- Ghost and skeleton animations use `animation-play-state: paused` when `prefers-reduced-motion: reduce`.
- Cursor embers use `pointer-events: none` globally.
- Dialog entrances use `@media (prefers-reduced-motion: no-preference)` guard.

## Performance

- Bat fly-bys use `transform` only (no layout reflows).
- Ghost opacity transitions use `will-change: opacity, transform`.
- Ember particles are CSS-only, no JavaScript per-frame calculation.
