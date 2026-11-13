# Verification

## Verified implementation

- 51 Node tests passed: legacy decoding and exports, archive integrity and bounds, PNG/JPEG dimensions, exact parity repairs and unrecoverable cases, image carving, IndexedDB transaction failures and provenance, push endpoint validation, signed ticket expiry, bounded requests, and real VAPID signing/encryption.
- Six Python companion safety tests passed using mocked inventories and file operations. They check external-only selection, read-only access, bounded reads, authentication/origin/host checks and CORS. No physical device was accessed.
- Production Next.js build passed with three dynamic push routes. A scan of generated browser assets found no private VAPID key.
- Browser verification passed for the five demo artifacts, ZIP uploads, PNG/bundle exports, byte-for-byte original preservation, raw-byte views, corrupt-file refusal, desktop/mobile layouts and dialogs, with no JavaScript errors.
- Browser reload preserved all five originals byte-for-byte, selected artifact, view tab and muted sound preference. A fresh session defaults sound on. Forget session removed retained artifacts.
- The actual browser worker reconstructed a damaged RTF byte-for-byte using its earlier capsule; input/output and provenance survived reload.
- An embedded PNG was carved at exact byte offset 512 and decoded in the viewer.
- Push settings rendered and the API rejected a request without Origin. No real push delivery was tested.
- The original independent Pillow check matched the PCX decode and PNG export across all 64,000 pixels.

## Still requires live verification

- Vercel deployment, environment configuration, browser/OS permission and end-to-end notification delivery.
- A real external physical disk and platform permissions. Current companion access is limited to its first 64 MiB.
- Format variants outside the documented subsets. No universal repair, filesystem undelete or overwritten/fragmented-file recovery is claimed.

Recovery work requires the browser tab to stay open. Local sessions are scoped to their browser and origin; they do not sync between localhost and a Vercel domain. Existing screenshots in docs/screenshots reflect the earlier interface, not complete evidence of the new recovery and push controls.

## Halloween presentation

The themed landing and recovery UI passed desktop (1440 px) and mobile (390 px) browser checks. Pumpkin toggling, skeleton dancing, ghost summoning, Kiro link, real PCX/RTF decoding, field notes and recovery dialogs were exercised without JavaScript errors or horizontal overflow. Reduced-motion behavior was included. Original SVG artwork and CSS add no remote asset requests or dependencies.

## App-wide haunting

Desktop and mobile browser checks verified skeleton dialogue and summons, decode/export-triggered apparitions, successful bundle download, persisted Full/Calm preference, modal focus visibility, reduced-motion suppression and no horizontal overflow or JavaScript errors. The desktop companion sits in the sidebar flow so it does not cover uploads. The production build and 51 existing tests passed.

## Pixel bat, persistent scene and sidebar

The supplied eight-frame CSS bat was converted to a 2,565-byte local PNG sprite. Control icons use iconsax-reactjs. Browser checks at 1440×900, 1280×720, 1024×768 and 390×844 passed for pumpkin toggles, bat interaction, persistent workbench decorations and real decoding. All five demo files and footer controls fit the desktop rail; a 32-file archive scrolls only inside its list. The mobile collection drawer opens, selects files, closes with Escape and restores the workbench. Production build and 51 unit tests passed.

## Independent bat fly-bys

Browser verification observed three distinct departure delays, flight durations and wingbeat phases; both leftbound and rightbound routes are present. Rightbound sprites are mirrored from the source’s left-facing artwork, and their measured screen position advances to the right. The original app PNG passed a before/after SHA-256 comparison; Oneko’s white skin is a separate asset outside this app. Normal recovery, 51 tests and production build passed.

## Kiro badge and ghosts

The ghost crew and summon behavior follow the original design: clicking the ghost triggers the original spirit-trail rise and wake-up message. All ghost instances render the official Kiro logo SVG path while preserving their distinct theme colors. The supplied Kiro SVG matches the served source byte-for-byte and retains its lavender tint on the badge. Aspiring-ambassador wording expresses intent rather than an appointment.


## Shared engine, proof and preservation

The core suite passes 53 tests, including all eight selectable corruption blocks, byte-exact reconstruction, absent-tail recovery, multi-block refusal, safe CSV output, hash duplicates, stdio MCP initialization/tool calls and separate IndexedDB namespaces. An independent review identified an import/restoration race; imports now reserve their operation ID before asynchronous extraction.

Browser checks verified the original archive remains mounted, Japheth credits, the caption’s unobscured dedicated row, scattered bottom-origin ghosts, real single-block and missing-tail proof, explicit two-block refusal, five-file preservation audit, decoded-content search and desk restoration after reload. The downloaded proof ZIP was checked for byte-identical repaired/original BMPs and matching recorded SHA-256. The downloaded preservation bundle contains all five original files, five conversions, hashes and warnings. The proof page has no horizontal overflow at 390px. Kiro MCP was protocol-tested locally; a live Kiro agent invocation remains to be recorded.
