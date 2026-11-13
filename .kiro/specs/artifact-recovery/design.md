# Artifact Recovery — Design

## Architecture

The recovery pipeline runs entirely in the browser. No server receives file bytes.

```
User input (File / ZIP / Disk image)
        │
        ▼
  recovery.worker.js  (off-thread, 10 s / 30 s budget)
        │
   lib/archive.mjs      ← bounded ZIP streaming, CRC validation
   lib/decoders.mjs     ← deterministic legacy-format decoders
   lib/parity.mjs       ← prior-parity capsule reconstruction
   lib/carve.mjs        ← contiguous image signature carving
        │
        ▼
  lib/session-store.js  ← IndexedDB; originals + provenance + prefs
        │
        ▼
  components/Laboratory.jsx   ← session, file list, tabs, dialogs
  components/ArtifactView.jsx ← image / table / document / terminal viewers
  components/RecoveryTools.jsx ← protect / reconstruct / carve / companion
```

## Decoder contract

`decodeArtifact(bytes, filename)` returns:
```
{
  kind: 'image' | 'table' | 'document' | 'terminal',
  format, title, era, description,
  metadata: [{label, value}],
  warnings: [],
  text?, table?: {columns, rows[][]},
  image?: {width, height, rgba: Uint8ClampedArray}
}
```
Throws on invalid or unsupported data. Input ≤ 8 MiB, raster ≤ 4 M pixels.

## Archive contract

`openArchive(bytes, name)` → `[{name, bytes}]`  
- Accepts stored / deflate only  
- Rejects: traversal, ZIP64, multidisk, encryption, data descriptors  
- Limits: 32 files, 16 MiB expanded, 8 MiB per file  
- CRC32 verified on actual streaming output, not header claim

## Session storage

IndexedDB key-value store. Stores:
- `originals`: `{name, bytes, sha256, provenance}`
- `preferences`: `{selectedFile, selectedTab, muted, hauntingLevel}`
- `capsules`: `{name, capsuleBytes, timestamp}`

Errors surface in UI. Clearing site storage or "Forget session" removes all data.

## Parity reconstruction

RAID-like 8-block stripe with one parity block. Reconstructs exactly one damaged 4 KiB block per stripe. Requires a prior capsule created before damage. Output SHA-256 must match capsule manifest. Damaged input and derived output are retained separately with distinct provenance labels.

## Image carving

Scans raw bytes for contiguous PNG / BMP / JPEG signature headers. Reports byte offset of each candidate. Does not determine deletion state, fragmented files or overwritten sectors. Input capped at 64 MiB.

## Companion (native/companion.py)

Read-only. Scans first 64 MiB of a user-selected external disk. Validates origin, host and authentication. CORS restricted to localhost.

## Push (optional, Vercel)

Database-free VAPID. Subscription metadata stored server-side; zero file bytes transmitted. Requires VAPID env vars. Not a verified delivery mechanism.
