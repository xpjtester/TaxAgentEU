# TaxAgentEU — foundation design

Product promise: connect sources, upload receipts, review an evidence-backed draft, expressly approve, and only then use a legally supported official submission channel.

## Status

This branch adds a **schema and a pure simulation-only workflow**. It does not add authentication, secure uploads, persisted workflow endpoints, or an official Dutch tax filing integration. Do not upload real financial data.

## Architecture (planned)

- Web dashboard (NL/EN/ZH), non-technical business-owner UX.
- Cloudflare Worker API with verified user session + server-side tenant membership on every business route.
- D1 for metadata, immutable-ish audit events, tax drafts and membership; R2 for encrypted invoice and statement objects.
- Queue-backed document ingestion with antivirus scanning, retention settings and human exception review.
- Deterministic tax calculation rules separate from AI categorization; cite source evidence.
- Email/bank OAuth only after consent and provider compliance reviews.
- Protected submission adapter disabled by default until official authorization and integration are validated.

## Permissions

| Role | Read business | Edit sources/drafts | Approve | Simulate |
| --- | --- | --- | --- | --- |
| owner | yes | yes | yes | yes |
| admin | yes | yes | yes | yes |
| accountant | yes | yes | no | no |
| viewer | yes | no | no | no |

Authentication and tenant membership checks must be implemented at the API boundary; a supplied tenant ID alone is never authorization.

## Simulation states

draft -> needs_review -> ready_for_approval -> approved -> simulated_submitted

Any revision before simulated submission returns to draft. No state reaches the Belastingdienst. Later real submission must be a separate integration with explicit mandate, per-return confirmation, idempotency, authoritative receipts and reconciliation.

## Critical release blockers

Authentication + tenant authorization, PII/financial data encryption, GDPR retention/deletion, virus scanning, rate limiting, audit event integrity, validation of applicable NL VAT/IB/VPB rules by qualified specialists, and actual authorized filing channels. No DigiD credentials are collected by this product.
