# Decoder and archive boundaries

No recovery result is invented for damaged or unsupported files.

`lib/decoders.mjs` is a browser-compatible byte decoder. Imported code is never executed. Input limit is 8 MiB, raster limit 4,194,304 pixels. Offsets, complete records and pixel arrays, palette references and RLE scanline bounds are validated. DBF has a 100,000-record limit and RTF a 256-group nesting limit. See BUILD.md for the public output contract; all titles derive from filenames.

## Supported subsets

- **PCX:** 8-bit RLE with one palette-indexed plane or three RGB planes. Indexed images require the final 0x0C plus 768-byte palette. Uses header bytes-per-line and a bounded scanline buffer. Lower bit depths and uncompressed PCX are unsupported.
- **BMP:** BITMAPINFOHEADER or newer, BI_RGB 8/24/32 bits; top-down or bottom-up and DWORD row padding. Indexed palette references checked. The unused fourth BI_RGB byte is ignored; alpha is opaque. OS/2 headers, compression and bitfields are unsupported.
- **dBASE III:** version 0x03 or 0x83, fixed-width C/N/F/D/L fields. Numeric and logical values remain original strings; YYYYMMDD dates display as YYYY-MM-DD. Deleted records omitted with a count warning. CP437 is assumed and disclosed. Memo fields, external DBT files and newer DBF variants are unsupported.
- **RTF:** nested groups, escaped braces/backslashes, Windows-1252 raw text and hexadecimal escapes, signed Unicode code units, scoped `uc` fallback, paragraph/line breaks and tabs. Skips font/color/style/info/picture/object and ignorable destinations; binary payload lengths checked. Extracts text without formatting or embedded objects. Other code-page declarations and complex alternate Unicode destinations are unsupported and may produce incomplete text.
- **ANSI/text:** preserves valid UTF-8; otherwise decodes high bytes as CP437. Escape sequences are preserved for the viewer to interpret safely. The decoder does not execute terminal escapes. NUL-bearing binary input is rejected.

## Browser-native images and recovery tools

`lib/recovery.worker.js` detects PNG/JPEG dimensions before native browser pixel decoding, limits rasters to 4,194,304 pixels and imports to 8 MiB, and exports pixels to PNG. Browser support determines accepted variants; no every-variant guarantee is made. Export omits original metadata, animation and compression.

Prior-parity reconstruction and signature carving are separate from these decoders. See [bounded recovery](NATIVE-RECOVERY.md) for exact algorithms, accepted PNG/BMP/JPEG carving subsets and failure cases. UI sessions admit at most 32 files and 16 MiB total, with 8 MiB per imported result, even where an underlying module has a larger bound. Decode/archive workers time out after 10 seconds; parity/carving workers after 30 seconds.

## ZIP policy

`lib/archive.mjs` exports synchronous `openArchive(bytes,name)`, `MAX_FILE_BYTES` (8 MiB) and `MAX_TOTAL_BYTES` (16 MiB). It returns original extracted bytes as `{name,bytes}` entries. The caller should invoke it inside a time-limited worker to keep the interface responsive.

Stored and deflate archives are accepted. Central and local headers must agree on names, flags, method, sizes and CRC. Header order and payload bounds are checked. Actual streaming output size and CRC32 must match. Fflate Unzip/UnzipInflate receives 256-byte compressed chunks, so dishonest size declarations cannot allocate arbitrarily large output buffers before the output limit is checked. At most 32 archive entries and 16 MiB expanded bytes are admitted, including ignored metadata. Each file must be at most 8 MiB.

Rejects traversal, absolute paths, drive-letter paths, backslashes, control characters and case-insensitive basename collisions. Paths are flattened only after validation; metadata files are omitted. ZIP64, multidisk, encryption, data descriptors, non-stored/non-deflate methods, prepended executable data and unreferenced local payloads are unsupported. This deliberately strict compatibility policy prevents silent extraction of a truncated prefix as an allegedly intact original. CRC checks establish consistency rather than cryptographic authenticity.

## Format references

- Microsoft [BITMAPINFOHEADER](https://learn.microsoft.com/en-us/windows/win32/api/wingdi/ns-wingdi-bitmapinfoheader): BI_RGB, dimensions, orientation, bit depth and stride.
- ZSoft [PCX Technical Reference Manual, archived vendor specification](https://www.moon-soft.com/program/FORMAT/graphics/pcx.htm): PCX header, planes, palette and RLE. [EGFF PCX](https://www.fileformat.info/format/pcx/egff.htm) is a secondary explanatory reference.
- dBASE [file format documentation](https://www.dbase.com/Knowledgebase/INT/db7_file_fmt.htm): little-endian common header fields, record markers and field encodings. The linked document describes Level 7; the implementation intentionally accepts older dBASE III with 32-byte field descriptors and does not claim Level 7 support.
- Microsoft [Rich Text Format Specification 1.9.1](https://interoperability.blob.core.windows.net/files/Archive_References/%5bMSFT-RTF%5d.pdf): group and control syntax, Unicode and destination semantics.
- PKWARE [ZIP Application Note](https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT): local and central ZIP records and CRC fields.
- Fflate [source and streaming API](https://github.com/101arrowz/fflate): incremental Unzip/UnzipInflate callbacks. No dependency's declared size is treated as proof of actual extracted size.

## Verification

`node --test tests/decoders.test.mjs tests/recovery.test.mjs`

Seven decoder tests use handcrafted fixtures to check real BGR/RGB/indexed colors, top-down BMPs, PCX RLE scanline bounds, DBF deletion behavior, RTF groups/hex/Unicode surrogate pairs, ANSI escape/CP437 preservation, truncation and malicious dimensions/counts.

Ten recovery tests check archive bytes, metadata omission, traversal/count/input/expansion limits, basename collisions, malformed archives, local-central inconsistencies, forged sizes and CRC in both headers, and unsupported ZIP flags/methods/disks. Export tests verify CSV BOM, quote escaping, Unicode and multiline values, plus verbatim document text. Spreadsheet formula neutralization belongs to recovery.js and its caller, not the decoder.
