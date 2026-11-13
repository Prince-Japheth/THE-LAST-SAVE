# Shared preservation engine design

The existing archive, standalone Preservation Desk and synthetic proof share bounded recovery primitives. `proof.mjs` generates a fixed BMP and applies deterministic damage without mutating originals; `proof.worker.js` isolates parity computation. `catalog.mjs` normalizes audit records and sanitizes CSV. The desk uses existing archive/decoder workers sequentially, limits the input collection, persists original bytes under a separate IndexedDB key and regenerates derived previews. Import operation IDs supersede pending restoration.

The local stdio MCP reads implementation contracts and runs only synthetic proof. It accepts no paths, user bytes, shell commands or network inputs. Kiro loads it from `.kiro/settings/mcp.json`.
