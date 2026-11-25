# Artifact Recovery — Implementation Tasks

## Task 1: Decoder correctness
- [x] All supported formats (PCX, BMP, DBF, RTF, ANSI) decode deterministically from raw bytes
- [x] Unsupported variants throw with an explicit message; no silent fallback
- [x] Input ≤ 8 MiB and raster ≤ 4 M pixels enforced before decode
- [x] SHA-256 fingerprint computed and stored with every original

## Task 2: Archive pipeline
- [x] ZIP stored/deflate accepted; all other methods rejected with a named error
- [x] CRC32 verified against actual streaming output, not header claim
- [x] Traversal, absolute paths, ZIP64, multidisk, encryption rejected
- [x] Expansion limits (32 files, 16 MiB total, 8 MiB per file) enforced

## Task 3: Worker isolation
- [x] All decode/archive work runs in recovery.worker.js off the UI thread
- [x] Decode/archive workers abort at 10 s; parity/carving workers abort at 30 s
- [x] Worker errors surface as user-visible warnings, never silent failures

## Task 4: Session persistence
- [x] Originals, provenance, selected file, selected tab, muted flag persisted in IndexedDB
- [x] Storage errors shown in UI; no false "saved" confirmation
- [x] "Forget session" clears all IndexedDB entries and confirms to user
- [x] Session survives page reload; does not persist across origins

## Task 5: Parity reconstruction
- [x] "Protect" exports a capsule containing parity blocks and SHA-256 manifest
- [x] "Reconstruct" requires capsule + damaged file; reconstructs exactly one missing 4 KiB block per stripe
- [x] Output SHA-256 verified against capsule manifest; mismatch shown as error
- [x] Damaged input and derived output retained separately with distinct provenance labels
- [x] Cases with insufficient redundancy reported explicitly; no invented data

## Task 6: Image carving
- [x] Scan up to 64 MiB raw input for contiguous PNG / BMP / JPEG signatures
- [x] Report byte offset and candidate size for each hit; no deletion-state claims
- [x] Carved candidates importable as normal session artifacts within standard limits

## Task 7: Export
- [x] "Export modern file" produces format-converted output (PNG / CSV / UTF-8)
- [x] "Export recovery bundle" ZIP contains: unmodified originals + conversions + JSON manifest
- [x] JSON manifest includes filename, sha256, warnings, decoder version, export timestamp
- [x] CSV formula-like values prefixed with apostrophe for spreadsheet safety

## Task 8: Accessibility and presentation
- [x] Full keyboard navigation (arrows for tabs, Escape for dialogs)
- [x] Reduced-motion preference suppresses animated decorations
- [x] Responsive layout verified at 1440 px (desktop) and 390 px (mobile)
- [x] All Halloween decorations are purely cosmetic; no recovery logic altered

## Task 9: Push (optional)
- [x] VAPID subscribe / unsubscribe flow requires explicit user action
- [x] No file bytes sent to server; subscription metadata only
- [x] API rejects requests missing correct Origin header
- [x] UI distinguishes push-provider acceptance from OS delivery
