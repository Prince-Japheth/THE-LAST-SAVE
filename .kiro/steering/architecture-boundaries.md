---
inclusion: always
---
# Architecture Boundaries

Enforce strict separation between these layers. Never let a lower layer import from a higher one.

## Layer map

```
UI layer          app/*, components/*
  ↓ props / events only
Session layer     lib/session-store.js
  ↓ calls into
Worker layer      lib/recovery.worker.js
  ↓ calls into
Core libs         lib/decoders.mjs, lib/archive.mjs,
                  lib/parity.mjs, lib/carve.mjs,
                  lib/image-dimensions.mjs
```

## Hard rules

1. **Core libs have zero browser dependencies.** They may only use standard JavaScript and the globals available in both Node.js and browser workers (`TextDecoder`, `crypto.subtle`, `Uint8Array`, etc.). Never import `react`, `next`, or DOM APIs.

2. **Workers are the only entry point to core libs from the UI.** Components never call `decoders.mjs`, `archive.mjs`, `parity.mjs` or `carve.mjs` directly. All decode/archive calls go through `recovery.worker.js`.

3. **Workers enforce time budgets.** Every worker operation must be wrapped in a timeout: 10 s for decode/archive, 30 s for parity/carving. Exceeding the budget posts an error message and terminates the worker.

4. **Session-store is the only IndexedDB writer.** Components read session state via props or context. They never call `indexedDB` directly.

5. **API routes are push-only.** `app/api/push/*` routes handle subscription metadata. They never receive, store or forward file bytes. File processing is always client-side.

6. **Originals are immutable.** Once stored in IndexedDB, original bytes are never modified in place. Reconstruction produces a separate derived artifact with distinct provenance.

7. **No invented data.** If a decoder cannot parse a structure, it throws an Error. It never returns fabricated or interpolated values. Warnings are explicit strings; silence is not a warning.

8. **Halloween decorations are a separate concern.** Components in `components/AppHaunting.jsx`, `HalloweenStage.jsx`, `NightShiftScene.jsx`, and `PixelBat.jsx` must not import from `lib/` or write to session state. They communicate with the rest of the app only via `CustomEvent` on `window`.
