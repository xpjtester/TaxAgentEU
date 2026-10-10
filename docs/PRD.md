# NL Tax Accountant AI — PRD V1.0 development baseline

**Date:** 2026-10-11. **Status:** design baseline, pending Dutch tax and security review.

## Vision
Zero-technical-knowledge Dutch SME tax preparation: connect Gmail/Outlook with OAuth, upload invoices and bank statements, reconcile transactions, review a VAT draft, approve an immutable snapshot, authorize a compliant filing channel, submit and archive the official receipt.

## Personas
ZZP/eenmanszaak (MVP), BV/VOF (later), accountants and bookkeepers (later).

## Scope and priorities
- P0: account/org tenancy, strict RBAC, document import, bank reconciliation, review queue, deterministic VAT calculations, immutable approval, simulated submission state machine, audit.
- P1: Gmail/Microsoft OAuth, multilingual NL/EN/ZH, production-grade VAT mapping and review.
- P2: eligible authorized filing integration (SBR/Digipoort or approved service), official receipts, multi-entity accountant workflows, advanced cross-border scenarios.

## Core acceptance criteria
1. All financial records are scoped by org_id; unauthorized cross-tenant access fails.
2. No default input VAT deduction when evidence or legal treatment is uncertain.
3. Every VAT line is traceable to source evidence and versioned rules.
4. Approval is explicit, attributed to an authorized member, and bound to a hash of the immutable filing payload.
5. Filing is blocked without verified submission authorization and correct role.
6. Retry is idempotent and does not confuse HTTP transport success with official acceptance.
7. A MOCK receipt is always marked non-official.
8. DigiD/eHerkenning credentials and MFA codes are never collected by the product.
9. Production launch is blocked until GDPR, security, accounting validation and legal channel requirements are met.

## Domain model
See `migrations/0001_initial.sql`. Roles: owner, admin, bookkeeper, reviewer, submitter. Filing flow: DRAFT → NEEDS_REVIEW / READY_FOR_APPROVAL → APPROVED → AUTHORIZATION_PENDING → AUTHORIZED → SUBMISSION_QUEUED → SUBMITTED → RECEIVED → ACCEPTED / REJECTED / UNKNOWN.

## Screens
Home, onboarding, dashboard, documents, transactions, review, filings, filing review, authorization, receipt, integrations, security.

## Non-goals for MVP
Automated corporate income tax, personal income tax, payroll, unapproved browser automation of tax portals, or claiming an official submission without verified receipt.

## Source document
The full PRD V1.0 was supplied as a project artifact in the originating conversation. This condensed baseline captures engineering gates; changes to scope require PRD review.
