# Bounded recovery extensions

These modules add three distinct capabilities. None can universally reconstruct arbitrary missing bytes, interpret every historical variant or infer whether a carved file was deleted. No actual physical disk was accessed during implementation or self-tests.

## Exact repair with a previously created capsule

`lib/parity.mjs` has no dependencies. It requires browser/Node WebCrypto (`globalThis.crypto.subtle`) and standard base64 APIs. Input is capped at 16 MiB.

```js
const capsule = await createParityCapsule(originalBytes, 'observatory.dat');
// Save JSON.stringify(capsule) separately before the original becomes damaged.
const {bytes, repairedBlocks, warnings} = await repairWithCapsule(damagedBytes, capsule);
```

The JSON-safe version-1 capsule contains `name`, `originalSize`, `sha256`, `blockSize:4096`, `stripeWidth:8`, `blockHashes` (one SHA-256 per actual-length block) and `parityBlocks` (one canonical base64 encoding of exactly 4096 XOR parity bytes per stripe). Final partial blocks are padded with zeroes only for XOR; their hashes cover their actual original length. Block indexes in `repairedBlocks` are zero-based integers.

The repair function checks every data block and can recover at most one corrupted or missing block in each eight-block stripe. This includes a truncated tail if no stripe has more than one incomplete/missing block. A bad capsule, multiple damaged blocks within a stripe, inserted bytes or failed final SHA-256 returns an error and no repaired file. Nothing modifies the original input. Intact files return a verified copy with no repaired indexes.

The capsule must already exist or come from an independently trusted backup. Creating a capsule from an already damaged file only protects those damaged bytes. SHA-256 equality proves consistency with the capsule, not identity, provenance or cryptographic authenticity of an untrusted capsule. XOR parity is redundant information, not an AI guess at missing content. Shifts, unknown deletions in the middle and arbitrary corruption beyond parity capacity are not generally recoverable.

## Browser disk-image carving

`carveDiskImage(bytes)` from `lib/carve.mjs` takes a `Uint8Array` up to 64 MiB and returns up to 32 objects:

```js
[{name:'carved-00001000.png', offset:4096, bytes:Uint8Array, format:'PNG', warnings:[...]}]
```

The synthetic name encodes the byte offset. There is no original filename, deleted-state claim, filesystem ownership or directory restoration. Candidate bytes are copied unchanged. Each contiguous candidate is at most 16 MiB and 4,194,304 pixels. Scanning skips accepted candidate ranges so nested signatures inside a complete image are not separately emitted. At most 4096 candidate signatures and 192 MiB of cumulative structural-validation work are allowed; exceeding either throws an explicit error. Run carving in a worker with a caller-owned timeout; it is synchronous CPU work.

Accepted subsets:

- **PNG:** signature, legal IHDR parameters, ordered required chunks, palette constraints, nonempty IDAT, IEND and CRC32 on every chunk. Unknown critical chunks are rejected. Chunk count is bounded at 8192. Pixel/deflate decoding is left to the viewer; structural checks do not guarantee every compressed pixel stream is decodable.
- **BMP:** complete uncompressed 8/24/32-bit Windows bitmap with declared file length, bounded pixel array, legal dimensions and palette references. OS/2/compressed/bitfield variants are omitted.
- **JPEG:** bounded segment lengths, 8-bit baseline/progressive frame with one or three components, quantization/Huffman tables, scan headers, byte-stuffed entropy/restart markers and contiguous EOI. DQT and DHT must be present in the same image. Other coding modes, abbreviated external-table streams and malformed headers are omitted. Entropy coefficients are not decoded or repaired; structural candidates still require viewer validation.

The scanner finds only supported **contiguous** images. Fragmented files, overwritten sectors, filesystem-only recovery, missing file prefixes, proprietary formats and other variants are outside this implementation. Absence of a result does not prove absence of recoverable data. A structurally consistent candidate is not a guarantee of semantic correctness.

A user can import an already created disk image in the browser without this native helper. Work from a copy; this application never writes to the imported source.

## Optional macOS external-device helper

`native/companion.py` uses only Python's standard library and macOS `diskutil`. It binds exclusively to `127.0.0.1`, default port 3011. It will not launch on other platforms except in self-test mode.

```sh
python3 native/companion.py --self-test
python3 native/companion.py
```

At startup it prints a fresh random pairing token in the local terminal. Paste that token into the local application; do not publish it, store it in a URL, capture it in screenshots or commit it. Restarting the helper rotates it. There is no endpoint that returns the token. The HTTP request logger is disabled. The frontend should keep it in memory only.

Exact allowed frontend origins are `http://localhost:3010` and `http://127.0.0.1:3010`. Every non-preflight request also needs `Authorization: Bearer <pairing token>`, a matching loopback Host header and the exact allowed Origin. Requests from missing/arbitrary origins fail. OPTIONS permits only GET/POST with Authorization and Content-Type request headers; it does not access devices. There are no wildcard CORS headers or write endpoints.

### HTTP contract

- `GET /devices`: returns `{devices:[{device:'/dev/rdiskN',name,size,readOnly:true}],prefixLimitBytes:67108864}`. Inventory comes from the fixed command `/usr/sbin/diskutil list -plist external physical`, followed by fixed `diskutil info -plist /dev/diskN` calls only for validated inventory identifiers. An entry must independently report `Internal:false`, `WholeDisk:true`, `VirtualOrPhysical:'Physical'` and the exact expected device identifier/node. Unknown metadata is excluded.
- `POST /scan`, Content-Type application/json, Content-Length 1–4096 bytes: body must contain exactly `{device:'/dev/rdiskN',maxBytes:67108864}`. `maxBytes` must be a positive integer no greater than 64 MiB. A fresh external inventory must allowlist the exact device at scan time. The return is `application/octet-stream` containing at most the requested prefix or physical device size, whichever is smaller. The default 64 MiB prefix is sector-aligned. Arbitrary unaligned read lengths may be rejected by macOS raw-device drivers.

All input opens use `O_RDONLY`, plus `O_NOFOLLOW`/`O_CLOEXEC` where available, and verify a raw character device. The helper never writes a source, mounts/unmounts a disk, executes sudo, opens an internal disk or interpolates a user string into a command/shell. Commands use argument arrays and `shell=False` (Python's default). One HTTP request runs at a time; socket body reads time out after five seconds. Device I/O itself can stall on failing hardware; stop the helper and use specialist imaging tools if that happens.

A permission error returns a bounded JSON error with this guide. Do not weaken the allowlist or run a privilege escalation automatically. macOS may require explicit terminal/device permissions for raw external reads. Use an image obtained through your own authorized disk-imaging workflow instead if permissions are unavailable. Internal storage is intentionally unsupported regardless of permissions. No actual hardware-read functionality was tested during development.

**Prefix limitation:** this is a read of the beginning of an external disk, not a full-drive scan. Most user files may lie beyond the first 64 MiB. The application must display the requested/received byte count and this limitation. No result must be labeled a complete recovery of an entire device.

## Broader tools

PhotoRec can carve many additional file families and TestDisk can inspect/recover filesystem structures. They are separate specialist tools with their own platform, format and privilege requirements. This project neither installs nor runs them and does not claim their capabilities. Consult the official [PhotoRec](https://www.cgsecurity.org/wiki/PhotoRec) and [TestDisk](https://www.cgsecurity.org/wiki/TestDisk) documentation if broader recovery is needed. Do not write recovery output to the affected source disk.

## Verification and references

```sh
node --test tests/parity.test.mjs tests/carve.test.mjs
python3 native/companion.py --self-test
```

13 Node tests verify exact repair across stripes, incomplete final block length, entirely missing blocks, unrecoverable corruption, tampered capsules, bounds, known implanted image offsets/bytes, CRC damage, truncation, malformed dimensions/markers, signature noise and candidate limits. Six Python self-tests use mocked inventories and mocked file operations to verify external-only filtering, read-only flags, bounded reads/closing, regular-file refusal, Origin/Host/token gates and CORS. The tests never invoke diskutil or access a physical drive.

Format references: [W3C PNG specification](https://www.w3.org/TR/png-3/), [ITU-T T.81 JPEG specification](https://www.w3.org/Graphics/JPEG/itu-t81.pdf), Microsoft [BITMAPINFOHEADER](https://learn.microsoft.com/en-us/windows/win32/api/wingdi/ns-wingdi-bitmapinfoheader). Parity is the directly implemented XOR identity: data block = stripe parity XOR every other intact stripe block; final SHA-256 must match.
