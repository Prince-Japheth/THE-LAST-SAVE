---
inclusion: always
---
# Type and Schema Guardrails

## Decoder output schema

Every call to `decodeArtifact(bytes, filename)` must return an object that satisfies this shape exactly. Kiro must never generate code that returns partial or extended shapes.

```js
{
  kind: 'image' | 'table' | 'document' | 'terminal',  // required
  format: string,           // required, e.g. "PCX", "dBASE III", "RTF"
  title: string,            // required, derived from filename only
  era: string,              // required, e.g. "1990s"
  description: string,      // required
  metadata: Array<{ label: string, value: string }>,  // required, may be []
  warnings: Array<string>,  // required, may be []
  // exactly one of:
  image?: { width: number, height: number, rgba: Uint8ClampedArray },
  table?: { columns: string[], rows: string[][] },
  text?: string,
}
```

Throws `Error` (not returns null / undefined / {}) when the input is invalid or unsupported.

## Archive output schema

`openArchive(bytes, name)` returns `Array<{ name: string, bytes: Uint8Array }>`.  
Never mutates the input `bytes`. Never returns metadata-only entries; only user files.

## Session provenance schema

Every stored artifact must include:
```js
{
  name: string,
  bytes: Uint8Array,        // original, unmodified
  sha256: string,           // hex string
  importedAt: number,       // Date.now()
  source: 'upload' | 'zip' | 'demo' | 'reconstruction' | 'carved',
  warnings: string[],
  isDerived?: boolean,      // true for reconstructed/carved outputs
  parentSha256?: string,    // sha256 of the input that produced this
}
```

## JSON manifest schema (export bundle)

```json
{
  "tool": "the-last-save",
  "exportedAt": "<ISO-8601>",
  "files": [
    {
      "name": "<filename>",
      "sha256": "<hex>",
      "source": "<upload|zip|demo|reconstruction|carved>",
      "warnings": [],
      "isDerived": false
    }
  ]
}
```

## Limit constants — never change without updating tests

```js
MAX_INPUT_BYTES     = 8 * 1024 * 1024   //  8 MiB
MAX_PIXELS          = 4_000_000
MAX_ZIP_FILES       = 32
MAX_ZIP_TOTAL_BYTES = 16 * 1024 * 1024  // 16 MiB
MAX_DISK_BYTES      = 64 * 1024 * 1024  // 64 MiB
DECODE_TIMEOUT_MS   = 10_000
PARITY_TIMEOUT_MS   = 30_000
```

## Naming conventions

- Decoder functions: `decode<Format>(bytes)` → internal, called by `decodeArtifact`
- Worker messages: `{ type: 'decode' | 'archive' | 'parity' | 'carve', payload: ... }`
- Worker responses: `{ type: 'result' | 'error', payload: ... }`
- CSS custom properties: `--tls-<token>` (e.g. `--tls-surface-1`, `--tls-accent`)
- Halloween CustomEvents: `tls:<event>` (e.g. `tls:decoded`, `tls:export`)
