# PRD implementation baseline — 2026-10-11

Source of truth: PRD v1.0, see `docs/PRD.md`.

## Delivered in this branch
- D1/SQLite schema for users, organizations, memberships, consents, OAuth references, document metadata, invoices, banking, reviews, VAT periods, filing snapshots, authorizations, mock submissions, receipts and audit events.
- Role/tenant authorization policy module and tests.
- Explicit approval + immutable payload hash + mock submission orchestration with negative tests.
- Frontend UI shell as static HTML; no real login or tax submission.
- All integrations remain mock/unimplemented. Do not onboard customers.

## Next implementation gates
1. Real OIDC login and server-validated sessions, scoped D1 repository methods and authorization middleware.
2. Private R2 upload pipeline with malware/type/size validation and per-tenant signed access.
3. Extraction and bank imports with evidence and human review.
4. Verified NL VAT rules and official field mappings.
5. Persistent transactional filing state machine, idempotency and mock adapter.
6. Certified/approved production filing channel and receipt verification.
7. GDPR/security review, penetration testing, monitoring and backups.

## Non-negotiable
No DigiD credentials collected. No browser bot claiming official filing. No unverified mock receipt represented as official. Never deploy the demo with real financial data.
