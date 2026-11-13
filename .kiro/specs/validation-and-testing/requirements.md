# Validation and Testing — Requirements

## Overview
Deterministic, property-based testing proves that The Last Save processes real legacy bytes correctly and safely under adversarial inputs. This spec governs the automated test suite that judges and engineers can run with a single command.

## Requirements

- THE SYSTEM SHALL provide a single-command test runner: `npm test`
- THE SYSTEM SHALL include unit tests for every decoder using handcrafted real binary fixtures (not mocks of the output)
- THE SYSTEM SHALL include archive tests covering: valid ZIP, traversal attempts, CRC forgery, size inflation, multidisk/ZIP64/encryption rejection, and collision detection
- THE SYSTEM SHALL include session-store tests covering: IndexedDB write/read/clear, transaction failures, provenance retention, and storage-limit rejection
- THE SYSTEM SHALL include parity tests covering: successful reconstruction, insufficient redundancy, SHA-256 mismatch, and multi-stripe files
- THE SYSTEM SHALL include export tests covering: CSV BOM, quote escaping, formula neutralization, Unicode, and multiline values
- THE SYSTEM SHALL verify that decoder output contains real pixel colors, record values, and text — not placeholder assertions
- THE SYSTEM SHALL include push API tests covering: missing-origin rejection, valid subscription, expiry enforcement, and VAPID signing
- THE SYSTEM SHALL pass `npm run build` (production Next.js build) with zero errors
- THE SYSTEM SHALL run all tests in under 60 seconds on the development machine
