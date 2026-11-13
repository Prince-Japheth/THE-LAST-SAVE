# Preservation engine requirements

- A user can demonstrate byte-exact reconstruction of one damaged 4 KiB block using an earlier capsule; all SHA-256 values are computed from actual bytes.
- Two damaged blocks in the same stripe must produce refusal and no fabricated output.
- The proof download includes the intact fixture, actual damaged input, capsule, report and reconstructed output only if verified.
- An independent collection-audit app reuses the existing bounded decoder workers, retains originals, searches readable content and exports inventories plus supported modern copies.
- Unreadable files and conversion omissions remain visible. Hashes do not establish authorship or completeness.
- The Preservation Desk persists separately from the haunted archive and leaves that collection intact.
- Local MCP tooling exposes only format contracts and bounded synthetic recovery proof; no user file or arbitrary command access.
- Existing Halloween interactions remain decorative, respect reduced motion and never alter source files.
