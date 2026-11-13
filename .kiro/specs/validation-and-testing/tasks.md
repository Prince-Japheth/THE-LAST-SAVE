# Validation and Testing — Implementation Tasks

## Task 1: Decoder tests (tests/decoders.test.mjs)
- [x] PCX indexed-color: verify real pixel colors at known offsets
- [x] PCX RGB planes: verify three-plane decode
- [x] BMP 24-bit: verify BGR→RGB conversion and row padding
- [x] BMP 8-bit indexed: verify palette lookup
- [x] DBF C/N/D/L fields: verify field values and deleted-record omission
- [x] RTF groups, hex escapes, Unicode surrogate pairs: verify extracted text
- [x] ANSI CP437 preservation and UTF-8 passthrough
- [x] Truncation and malicious dimensions/pixel-count attacks rejected

## Task 2: Archive tests (tests/recovery.test.mjs)
- [x] Valid stored ZIP extracts correctly
- [x] Valid deflate ZIP extracts correctly
- [x] Traversal path rejected
- [x] CRC forgery in local header caught
- [x] CRC forgery in central header caught
- [x] Inflated size exceeds limit rejected
- [x] File count exceeds limit rejected
- [x] ZIP64 rejected with named error
- [x] Encryption flag rejected
- [x] Data descriptor rejected
- [x] Case-insensitive basename collision rejected
- [x] Local/central header inconsistency rejected

## Task 3: Export tests (tests/recovery.test.mjs)
- [x] CSV BOM present in output
- [x] CSV quote escaping correct
- [x] CSV formula neutralization (apostrophe prefix)
- [x] CSV Unicode values preserved
- [x] CSV multiline values quoted
- [x] Document text extracted verbatim

## Task 4: Session-store tests
- [x] Write original → read back → bytes match
- [x] Provenance metadata persisted
- [x] Transaction failure surfaced as error (not silent)
- [x] Forget session clears all entries

## Task 5: Parity tests
- [x] Reconstruct one damaged block per stripe correctly
- [x] Insufficient redundancy returns explicit error; no invented bytes
- [x] SHA-256 mismatch returns explicit error
- [x] Damaged input and output stored with distinct provenance

## Task 6: Push API tests
- [x] Subscribe endpoint rejects missing Origin
- [x] Notify endpoint rejects expired ticket
- [x] VAPID signing produces valid signature
- [x] No file bytes reach the server in any path

## Task 7: Build verification
- [x] `npm run build` exits 0
- [x] Generated browser bundle contains no private VAPID key
- [x] No TypeScript/ESLint errors block the build
