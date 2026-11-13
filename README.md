# THE LAST SAVE

A local-first digital archaeology lab. Open a fictional 1996 observatory disk—or your own legacy files—decode the original bytes, inspect them, and export modern files with an integrity manifest.

## Run locally

```sh
git clone https://github.com/Prince-Japheth/THE-LAST-SAVE.git
cd THE-LAST-SAVE
npm install
npm run dev
```

Open **http://127.0.0.1:3010**. Keep the terminal running. Next.js Fast Refresh updates saved edits in `components/` and `app/`.

For a production build: `npm run build`, then `npm start`. Initial dependency installation requires internet; file processing and bundled resources run locally in the browser. The app also supports Vercel hosting with optional server functions for push; it is not an installed offline PWA. Originals and session preferences persist in IndexedDB across reloads in the same browser and origin. Clearing site storage or choosing Forget session removes them. Downloads remain on your computer.

## A complete demo in five minutes

1. Click **INSERT DEMO DISK**. The PCX image is decoded from the binary source, not substituted with its PNG preview.
2. Select **STARLOG.DBF** to display real database records; **LETTER.RTF** for the extracted letter; **NIGHT.ANS** for the archived terminal log.
3. Use **Source bytes** and **Recovery report** to inspect original bytes, decoder limitations, and SHA-256 fingerprints. Keyboard arrows navigate the viewer tabs; Escape closes field notes.
4. Export a modern file or **EXPORT RECOVERY BUNDLE**. The ZIP includes unmodified originals, PNG/CSV/UTF-8 text conversions, and a JSON manifest of checksums and warnings.
5. Download the sample disk ZIP and open it with **Open your own files** to demonstrate the same import pipeline. Your own supported files work through that input or drag-and-drop.

6. Reload while a file and tab are selected to demonstrate persistent originals and preferences. Use Forget session only when you want to clear that browser’s saved files.
7. Open **Recovery tools → Protect** to export a capsule before damage. **Reconstruct** accepts the damaged file plus that earlier capsule, retains both input and output, and verifies the output hash. Importing repair or carving results replaces the mounted collection; export the current bundle first if you want to keep that case separately.
8. **Disk image** scans a raw image up to 64 MiB for supported contiguous image candidates. **External disk** requires the local macOS companion and scans only the first 64 MiB of a selected external device; it is not full-drive undelete.
9. Open the bell button for optional push configuration, Enable push, Send test and Disable push. On Vercel, set the VAPID keys and redeploy first. Actual device delivery remains unverified.

The optional sound control synthesizes drive clicks locally; sound is on by default and starts after interaction, subject to browser autoplay policy. The saved preference is restored on reload. Reduced-motion preferences are respected.

## Supported subsets

- PCX: 8-bit RLE indexed-color or three RGB planes → PNG.
- PNG/JPEG: browser-native pixel decoding with dimensions checked before decoding → PNG. Metadata, animation and original compression are not preserved.
- BMP: uncompressed 8-, 24-, or 32-bit Windows bitmap → PNG.
- dBASE III: C/N/F/D/L fields → CSV. Deleted records are omitted and reported. Code page is assumed CP437 with a warning.
- RTF: plain text extraction, nested groups and Unicode → UTF-8 text. Formatting, pictures and embedded objects are omitted.
- ANSI/text: UTF-8 or CP437, with SGR color preview → UTF-8 text. Modern exports omit CSI controls; originals retain them. The viewer does not emulate arbitrary terminal cursor movement.
- ZIP: bounded stored/deflate archives, validated headers, sizes and CRC. Encryption, ZIP64, multidisk and descriptor-based archives are explicitly unsupported.

Limits: **8 MiB per input file, 16 MiB expanded session, 32 files, 4 million image pixels, 10 seconds per decode/archive operation; 30 seconds per parity/carving operation. Disk-image input is separately limited to 64 MiB; imported results must fit the normal session limits.** Unknown or truncated data is reported. Explicit parity reconstruction is available only with sufficient earlier redundancy and a verified final hash. ZIP expansion and decoding run off the UI thread. CSV formula-like cells are prefixed with an apostrophe for spreadsheet safety; the original DBF retains exact source values.

See `docs/FORMAT-NOTES.md` for format references and precise limitations.

## Edit the project

- `components/Laboratory.jsx`: session, file selection, tabs, dialogs and export controls.
- `components/RecoveryTools.jsx`: parity protection/reconstruction, image carving and companion pairing.
- `components/NotificationSettings.jsx`: optional VAPID subscription, test and disable controls.
- `lib/session-store.js`: bounded IndexedDB storage of originals, provenance and preferences.
- `lib/parity.mjs` / `lib/carve.mjs`: exact parity reconstruction and structural image carving.
- `native/companion.py`: paired, read-only external-disk prefix access.
- `app/api/push/`: database-free Vercel push functions; `public/sw.js` displays notifications.
- `components/Floppy.jsx`: interactive CSS 3D disk.
- `components/ArtifactView.jsx`: image, database, document and terminal viewers.
- `app/globals.css`: layout, typography, responsive views and motion.
- `lib/decoders.mjs`: deterministic legacy-format decoders.
- `lib/archive.mjs`: bounded streaming ZIP extraction and integrity validation.
- `lib/recovery.js` / `lib/recovery.worker.js`: background processing and exports.
- `scripts/generate-demo.mjs`: reproducible original demo disk and pixel art. Run `npm run demo` to regenerate it.
- `public/demo/`: actual binary fixtures, sample ZIP and image preview.
- `public/fonts/`: self-hosted open-source fonts; licenses in its `licenses/` folder.

## Checks

```sh
npm test
npm run build
```

Unit tests cover real pixel colors, record values, Unicode/RTF, truncation and resource limits, forged ZIP headers/CRCs, path traversal, and CSV export safety. Browser verification additionally exercises real uploads, exports, raw-byte inspection, dialogs and responsive layouts. See `docs/VERIFICATION.md`.

## Project provenance

The MIRA archive and all of its people and events are fictional. Its files are newly authored real binary demonstration artifacts, not historical discoveries. The UI never uses an AI model to invent recovered data.

Built with Kiro. `.kiro/` holds the four specs (`artifact-recovery`, `preservation-engine`, `ui-haunting`, `validation-and-testing`), four steering docs, four agent hooks and the project MCP server configuration used during development.


## Local recovery capabilities

Original bytes, selection, view and sound preferences persist in IndexedDB in the same browser and origin. Clearing site storage or using a different browser/origin removes access to that local session. Use Forget session to clear it. Storage errors are shown instead of claiming a successful save. Sound defaults on and plays after interaction, subject to browser autoplay policies.

Recovery tools can create prior parity capsules and reconstruct one damaged/missing 4 KiB block per eight-block stripe, verified by SHA-256. This needs redundancy created before damage and is not arbitrary corruption repair. Both the damaged input and derived output are retained. PNG/JPEG previews now use bounded native browser decoding; specialist format variants are still limited by the existing decoders.

Disk-image scans carve validated contiguous PNG/BMP/JPEG candidates from up to 64 MiB. They do not determine deletion state, recover overwritten sectors, or reconstruct fragmented files. The optional read-only macOS companion scans only the first 64 MiB of a user-selected external physical device. Run it only with the local app. See [native recovery](docs/NATIVE-RECOVERY.md). Physical devices were not accessed during development verification.

Optional VAPID push uses Vercel functions with no database or account. Files remain local; only subscription metadata and fixed events reach the server. Configure the VAPID environment variables and test delivery on your deployed HTTPS site: [push setup](docs/PUSH-SETUP.md). Recovery runs while the tab remains open. Server push acceptance is not proof of OS delivery.


## Haunted observatory interface

The Halloween presentation includes original SVG pumpkins, ghosts, a skeleton, moon and spider. Click the pumpkin to toggle its lantern, click the skeleton to toggle dancing, and Wake the crew to summon ghosts. All controls are keyboard accessible; decorative animation respects reduced motion. These interactions do not touch recovery data. The original Kiro Afterlife Lab badge links to Kiro as a Kiroween tribute; it does not imply endorsement by Kiro or AWS. Scene artwork is local. UI icons use iconsax-reactjs.


The app-wide Skeleton Crew companion reacts to decoding, exporting, errors, selected artifacts, tabs and dialogs. Click it for fictional archive banter or summon ghosts from any view. Decorative cursor embers avoid recovered content, edge fog and occasional bats never intercept controls, and dialogs/file selections have haunted entrances. The persisted Full/Calm switch reduces effects across the app; OS reduced-motion settings suppress moving apparitions. These effects do not change file processing or add network requests.


The persistent workbench night-shift scene exposes pumpkin lanterns and the animated pixel bat while recovering files, not only in the lobby. Click Feed the bat for a short flight. The desktop sidebar stays within the viewport with an internally scrolling artifact list; on mobile the header folder button opens a focus-trapped collection drawer.

## Creator & Contact

Conceived, designed, and built by **Japheth** (Japheth).
- **Portfolio & Contact**: [yafetport.vercel.app](https://yafetport.vercel.app/)


## Three ways into the same recovery engine

- `/`: the haunted MIRA archive and individual-file workbench.
- `/proof`: a generated eight-block BMP, selectable corruption, missing-tail reconstruction, explicit refusal beyond parity limits, before/after pixels and a reproducible evidence ZIP.
- `/preserve`: an independent browser-local collection workspace with batch audits, decoded-content search, conversion warnings, duplicate hashes, filtered CSV/JSON inventories and a full original-plus-conversion bundle.

Both collections persist separately. The proof fixture is synthetic; exported evidence includes actual input, capsule and output bytes. No new backend, account or API key is needed.

Run `npm run test:mcp` to verify the local evidence MCP. `.kiro/settings/mcp.json` exposes format contracts and bounded synthetic reconstruction to Kiro; it does not read private files. See `.kiro/settings/README.md`.

## License

MIT. See [LICENSE](LICENSE). Bundled fonts keep their own open-source licenses in `public/fonts/licenses/`; third-party asset credits are in `docs/ASSET-CREDITS.md`.
