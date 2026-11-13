# Preservation engine: implementation plan

Goal: prove real, reusable recovery value beyond the haunted archive. Add an independent Preservation Desk and a deterministic proof playground, both reusing the same bounded decoder and parity workers. Browser-local only: no new backend, account or paid dependency.

- [x] Restore bottom-origin ghosts on their scattered routes, preserve their artwork, and verify the caption no longer intersects the pumpkins.
- [x] Add deterministic eight-block damage fixtures and proof calculations. Test exact repair, missing-tail reconstruction and explicit two-block refusal; originals must remain immutable.
- [x] Add /proof with user-selected damage, before/damaged/repaired pixels, SHA-256 evidence, a downloadable evidence bundle and direct links from the main app.
- [x] Add /preserve: batch ZIP/files inventory, per-file success/refusal, searchable decoded text, migration risk, duplicate hashes, original retention, CSV/JSON and recovery bundle exports. Reuse the decoder workers; never claim every format works.
- [x] Add local domain MCP tools exposing format contracts and bounded synthetic proof, wire them into the project Kiro configuration and hooks, and verify the stdio protocol locally.
- [x] Update in-app field notes, the demo script and developer onboarding for the implemented capabilities.
- [x] Run the core tests and production build, then exercise both apps and the original lobby at desktop and mobile sizes.
