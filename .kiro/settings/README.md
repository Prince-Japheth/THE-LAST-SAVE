# Local recovery evidence MCP

The workspace configuration in `mcp.json` starts `node scripts/recovery-mcp.mjs` from the project directory. Open the repository root in Kiro. It exposes two bounded tools: `format_contract` reads implementation limits; `reconstruction_proof` runs the actual parity core against generated data and returns SHA-256 evidence or refusal. It reads no user files, accepts no filesystem paths, opens no network port and needs no API key. No tools are automatically approved.

Run `npm run test:mcp` to verify initialize, listing, real repair, refusal and invalid arguments over stdio. The PostFileSave evidence hook runs the test suite after relevant core changes.

Official references: [MCP configuration](https://kiro.dev/docs/mcp/configuration/), [Hooks](https://kiro.dev/docs/hooks/), [stdio transport](https://modelcontextprotocol.io/specification/2025-03-26/basic/transports).

Suggested Kiro task: “Use format_contract to inspect the current BMP limits. Use reconstruction_proof with blocks [3], then [2,5]. Explain the different outcomes before proposing a decoder extension. Keep source bytes immutable and add a malformed-input regression test.”
