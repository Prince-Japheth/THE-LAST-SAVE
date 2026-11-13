**Category: Resurrection** · Live demo: _[ADD URL]_ · Code: [github.com/Prince-Japheth/THE-LAST-SAVE](https://github.com/Prince-Japheth/THE-LAST-SAVE)

> **For judges, in 30 seconds:** Open the live link, click **Insert Demo Disk**, and five real 1990s binary files (PCX image, dBASE database, RTF letter, ANSI terminal log) are decoded from their original bytes in your browser. Export any of them as PNG/CSV/UTF-8 with a SHA-256 manifest. No login, no upload, no AI inventing data. 53 tests passing. The full `.kiro/` folder (4 specs, 4 steering docs, 4 hooks, 1 custom MCP server) is in the repo.

## Inspiration

Every decade of digital life leaves behind files that modern software refuses to open. Photos from old paint programs, dBASE spreadsheets, RTF letters and ANSI terminal logs are sitting on old disks and drives right now. Opening them usually means hunting down a thirty-year-old program, or giving up.

Even when you do get them open, there is no proof the file was read faithfully. Most "converters" silently drop what they don't understand, and AI tools will happily *guess* at what a damaged file "probably" said. For archivists, journalists, historians and families, a guessed record is worse than a missing one.

So I asked: what would it take to bring dead file formats back to life **without ever making anything up**? And what if that felt less like a utility and more like opening a haunted time capsule?

## What it does

The Last Save is a browser-local digital archaeology lab wrapped in a haunted 1996 observatory.

- **Decodes dead formats from real bytes.** PCX (8-bit RLE and 24-bit RGB planes), dBASE III, RTF, ANSI/CP437 text, BMP, PNG/JPEG and ZIP archives are parsed by hand-written, deterministic decoders. The demo disk's PCX image is decoded from the binary, not swapped for a PNG preview.
- **Shows its evidence.** Every file has a **Source bytes** hex view and a **Recovery report** with SHA-256 fingerprints, decoder limitations and explicit warnings (e.g. "deleted dBASE records omitted", "code page assumed CP437").
- **Exports modern files you can trust.** One click produces a recovery bundle: the untouched originals, PNG/CSV/UTF-8 conversions, and a JSON integrity manifest.
- **Refuses to invent data.** If a file is truncated or unsupported, it says so. Repair only happens with real redundancy: **Protect** creates a parity capsule before damage, and **Reconstruct** restores a missing block only if the final SHA-256 matches. Otherwise it refuses, out loud.
- **Three ways into one engine:**
  - `/`: the haunted MIRA archive and per-file workbench
  - `/proof`: a live demonstration that corrupts a generated image, reconstructs it from parity, and refuses when damage exceeds what parity can fix, with a downloadable evidence ZIP
  - `/preserve`: a collection workspace for batch audits, decoded-content search, duplicate detection and CSV/JSON inventories
- **Private by design.** Files never leave the machine. No account, no upload, no API key. Sessions persist locally in IndexedDB.

The Halloween layer is not a skin. The **Skeleton Crew** companion reacts to decoding, exports and errors. Ghosts rise when a file comes back to life. A dancing skeleton, lantern pumpkins and a pixel bat live in the workbench. Everything respects `prefers-reduced-motion`, has a persisted **Full/Calm** switch, and is keyboard accessible. Decorative layers can never intercept a click on a recovery control.

## How I built it

**Stack:** Next.js 16 (App Router) + React 19, hand-written decoders in plain JavaScript modules, Web Workers for all decoding and archive work, `fflate` for bounded ZIP inflation, IndexedDB for local sessions, Web Crypto for SHA-256, optional Vercel functions + Web Push (VAPID) for notifications, and a small read-only macOS companion for scanning external disks.

**Architecture (enforced, not aspirational):**

```
UI (app/, components/)    → props & events only
Session (session-store)   → the only IndexedDB writer
Worker (recovery.worker)  → time-boxed: 10s decode, 30s parity/carving
Core (decoders, archive,  → zero browser deps, testable in Node,
      parity, carve)        throws instead of guessing
```

Hard limits are part of the contract: 8 MiB per file, 16 MiB per session, 32 files, 4 megapixels, and ZIP headers, sizes and CRCs validated before anything is trusted.

## How I used Kiro

I didn't use Kiro just to generate code. I used it to make the project's core promise (*never invent data*) something the agent could not break.

| Kiro feature | How I used it | Why it mattered |
|---|---|---|
| **Specs** | Four spec suites in `.kiro/specs/`: `artifact-recovery`, `preservation-engine`, `ui-haunting`, and `validation-and-testing` (41 tasks). Each one defines requirements, design and an ordered task list before implementation. | Decoders have exact output schemas and failure modes. Writing them as specs first meant every format had acceptance criteria (pixels, record values, warnings) before a line of decoder code existed. |
| **Steering docs** | `product.md` (never invent data, treat imports as untrusted), `architecture-boundaries.md` (the layer map above, as 8 hard rules), `type-and-schema-guardrails.md` (the exact decoder return shape and limits), `design-system.md` (palette, motion, accessibility). | The biggest win was turning "no invented data" and "decorations never touch recovery state" into always-included rules, so every generated edit was checked against them. |
| **Agent hooks** | **Decoder Schema Guard**: before any write to the core libs, checks the schema, limits, layer isolation and no-fabrication rules, and blocks the write if violated. **Decoration Isolation Guard**: before edits to the Halloween components, checks they don't import recovery code, animate only transform/opacity, and stay `pointer-events: none`. **Test Gate**: runs the suite on every `lib/` save. **Recovery Evidence Gate**: runs tests whenever proof/parity/MCP code changes. | Two hooks guard rules *before* code is written; two prove correctness *after*. The spooky UI could grow freely without ever breaking the recovery engine. |
| **MCP** | A custom MCP server (`scripts/recovery-mcp.mjs`, configured in `.kiro/settings/mcp.json`) exposes two tools: `format_contract` (the implemented format subsets and hard limits) and `reconstruction_proof` (runs a real eight-block parity reconstruction or refusal on synthetic data and returns hashes). | Kiro can check ground truth from the actual engine instead of guessing what a format supports. The server never touches user files. |
| **Vibe coding** | Conversational sessions for the haunted interface: the observatory scene, the Skeleton Crew companion's reactions, ghost summoning and the night-shift workbench. | Creative UI work benefited from fast back-and-forth. The steering docs and hooks kept that speed from leaking into the recovery core. |

**Spec-driven vs. vibe coding:** Specs were essential for anything where "close enough" is a bug: binary parsing, ZIP validation, parity math. Vibe coding was right for atmosphere and interaction. Combining them, with hooks enforcing the boundary between the two, is what let a playful Halloween app also be a trustworthy recovery tool.

## Challenges I ran into

- **Binary formats lie.** Real PCX, DBF and ZIP files have off-by-one headers, misleading size fields and vendor quirks. I validated the PCX decoder against an independent Pillow decode across all 64,000 pixels.
- **ZIP is an attack surface.** Path traversal, forged CRCs, zip bombs and duplicate names all had to be rejected with clear errors, and each has a test.
- **Honest repair is hard to demo.** "We can't fix that" doesn't make a flashy demo, so I built `/proof` to make refusal visible: corrupt one block and it reconstructs, corrupt too much and it says no, with hashes to prove both.
- **Spooky without being in the way.** Fog, embers and bats had to feel alive without covering controls, hurting performance, or ignoring reduced-motion settings.

## Accomplishments that I'm proud of

- Real legacy binaries, decoded deterministically in the browser. Nothing is mocked or substituted.
- **53 passing tests** covering real pixel colors, dBASE record values, Unicode RTF, truncation, forged ZIP headers and CRCs, path traversal, CSV formula-injection safety, parity repair and refusal, image carving and session isolation.
- A recovery bundle a historian could actually cite: originals, conversions and a checksum manifest.
- A Halloween interface that makes data preservation feel like an adventure, while staying accessible.

## What I learned

Constraints are the best prompt. The most valuable thing I gave Kiro wasn't a feature request but a rule it couldn't break. I also learned that "I don't know" is a feature: an archive tool that admits its limits is more useful than one that confidently guesses.

## What's next for The Last Save: A Haunted Lab for Dead File Formats

- More dead formats: WordPerfect, Lotus 1-2-3, MacPaint, early PICT and more dBASE variants
- Shareable, verifiable recovery reports for archives, newsrooms and legal discovery
- An installable offline PWA, so the lab works on an air-gapped machine next to an old drive
- Opening the decoder contract so others can add formats against the same specs, hooks and MCP checks
