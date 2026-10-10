# TaxAgentEU — Product Requirements Document v2.0

Date: 2026-10-11
Status: development baseline / not legal clearance / not production-ready
Former project: NL Tax Accountant AI
Brand: TaxAgentEU — selected product name; trademark and domain clearance pending
Targets: NL, BE, DE, LV, LT, EE, SE, DK, FI, NO

## 1. Mission
TaxAgentEU is an AI-assisted accounting and tax preparation SaaS for European SMEs, sole proprietors, and accounting firms. It uses one auditable accounting core with country-specific tax plugins. AI extracts and suggests; deterministic rules compute; authorized people approve; official channels submit where lawful and technically supported.

The existing repository is an early Dutch prototype. It explicitly lacks authentication, persistence, encryption, tenant isolation and production filing. Do not ingest real customer financial documents before these controls exist.

## 2. Two portals, one company record
**TaxAgentEU Business**: company onboarding, invoices (PDF/image), consent-based read-only email integrations, bank CSV/MT940 import, optional regulated open-banking provider, categorized transactions, matching exceptions, VAT draft, explainable tax estimates, per-filing approval, exports, receipts, and consent revocation.

**TaxAgentEU Pro**: accounting-firm organization, client invitations and engagements, portfolio queue, exception triage, suggested journal adjustments, dual review, filing preparation, request for client authorization, deadline calendar, evidence bundles and audit export.

Both portals use the same backend; neither role can bypass tenant scoping. Engagements require client consent with scope, expiration, and revocation.

## 3. Jurisdiction rollout
Country | Code | Initial capability | Later capability
---|---|---|---
Netherlands | NL | domestic VAT draft, Dutch business types | verified tax filing adapter
Belgium | BE | ledger, VAT mapping, export | local filing adapter
Germany | DE | ledger, VAT mapping, export | authorized ELSTER workflow
Latvia | LV | ledger, VAT mapping, export | VID EDS-approved workflow
Lithuania | LT | ledger, VAT mapping, export | VMI EDS/i.MAS workflow
Estonia | EE | ledger, VAT mapping, export | e-MTA / X-tee workflow
Sweden | SE | ledger, VAT mapping, export | Skatteverket workflow
Denmark | DK | ledger, VAT mapping, export | TastSelv/NemVirksomhed workflow
Finland | FI | ledger, VAT mapping, export | Vero API workflow
Norway | NO | ledger, VAT mapping, export | Skatteetaten/Altinn workflow

Norway is outside the EU; do not apply intra-EU VAT rules to NO. Country registrations and VAT obligations may differ from business incorporation country. The country adapter declares feature readiness as NOT_SUPPORTED, DRAFT_ONLY, EXPORT_ONLY, SANDBOX, or LIVE_VERIFIED, separately per filing type.

## 4. Scope and non-goals
P0: two portals and roles, company/registration onboarding, audit-ready source storage, deterministic NL VAT prototype migration, double-entry ledger, invoice/bank import, human exception resolution, rule versioning, filing draft, snapshot approval and simulation. Seed all 10 jurisdiction records and adapter manifests; support UTF-8 locale, multi-currency and monetary precision.

P1: email OAuth with consent, connected bank provider, accountant engagements, Estonia VAT trial adapter, official sandbox proof, localized English/Dutch first.

P2: verified adapters for additional countries, recurring filing deadlines, professional portfolio features, full localization.

Out of scope for P0: unattended production filings, payroll, mandatory real-time bank connections, unreviewed generative tax assessments, claiming official certification, all tax types in all countries, autonomous signing using user e-ID credentials.

## 5. Architecture
- Frontends: apps/business and apps/pro, shared design system and API client.
- Backend: Cloudflare Workers (API, workflow coordinator), D1 for metadata and transactional records with constraints, R2 for encrypted documents/evidence, Queues for asynchronous ingestion, service bindings where necessary.
- Modules: auth, tenant-context, company, engagements, documents, inbox-connectors, bank-ingestion, extraction, ledger, reconciliation, tax-engine, country-adapters, filing-workflow, notifications, audit, billing.
- Integrations: email OAuth, future third-party bank provider under PSD2 consent, official filing connectors per country.
- Never expose the R2 bucket directly; use short-lived signed access with tenant authorization.
- Processing must be idempotent and retriable, with dead-letter queue, malware and content-type checks before parsing.

## 6. Data model (proposed migrations)
All tenant data has tenant_id/company_id as appropriate; enforce at query/service boundary and test negative access. Use immutable identifiers (ULID/UUID), timestamps, created_by and status where applicable.

Identity: users, organizations, organization_members, sessions, MFA_factors.
Tenancy: companies, company_members, company_registrations, tax_registrations, jurisdictions, company_settings.
Professional delegation: accountant_firms, firm_members, firm_engagements, engagement_permissions, engagement_events.
Ingestion: integrations, oauth_grants (encrypted tokens), source_documents, document_files, extracted_fields, extraction_reviews, bank_accounts, bank_imports, bank_transactions, reconciliation_matches, reconciliation_exceptions.
Accounting: chart_of_accounts, accounting_periods, journal_entries, journal_lines, journal_sources, exchange_rates, accounting_locks.
Tax: tax_rule_sets, tax_rule_versions, tax_codes, tax_calculation_runs, tax_calculation_lines, filing_types, filing_periods, filing_drafts, filing_snapshots, filing_approvals, filing_attempts, filing_receipts, filing_evidence.
Compliance: access_consents, data_retention_policies, deletion_requests, audit_events, security_events, notification_outbox.
Commercial: subscriptions, subscription_items, invoices_billing, metered_usage.

Money: fixed-precision decimal or integer minor units with currency/exponent; preserve transaction currency, functional currency, exchange rate, rate source and effective date. Balanced posted journal entries cannot be edited; reverse and repost instead. Tax rule versions are effective-dated and immutable once referenced.

## 7. Roles and authorization
- PLATFORM_ADMIN: infrastructure/configuration only; production financial access requires break-glass dual control.
- BUSINESS_OWNER: company management and final filing approval.
- BUSINESS_FINANCE: data import, correction suggestions, draft review; no final approval by default.
- BUSINESS_VIEWER: read-only scoped reporting.
- FIRM_OWNER: professional organization and billing settings.
- ACCOUNTANT: client companies within active engagement, draft/review actions permitted by scope.
- FIRM_REVIEWER: independent review; no implicit authority to sign client's declaration.
- AUDITOR: read-only evidence scoped to granted audit engagement.
Permissions use capability strings plus company_id, engagement_id, permitted tax types, expiry, revocation, maker-checker segregation, and jurisdiction rules. Never trust role/country/company identifiers supplied by browser without server authorization.

## 8. Filing state machine
INGESTED -> RECONCILING -> READY_FOR_REVIEW -> DRAFT_CALCULATED -> VALIDATED -> AWAITING_APPROVAL -> APPROVED -> SUBMISSION_PENDING -> (SIMULATED_SUBMITTED | LIVE_SUBMITTED | EXPORTED_FOR_MANUAL_FILING) -> RECEIPT_CONFIRMED.

Any document/journal/tax rule change invalidates approval and requires a new immutable draft hash. Approval includes exact company, jurisdiction, tax type, period, totals, content hash, user, time and authorization method. A country adapter may prohibit automated submission and require a supported external/manual workflow. Never store or replay personal e-ID passwords.

## 9. API contract v1
GET /health
GET /v1/jurisdictions
POST /v1/companies
GET /v1/companies/:id
POST /v1/companies/:id/members
POST /v1/companies/:id/documents
POST /v1/companies/:id/bank-imports
GET /v1/companies/:id/reconciliation/exceptions
POST /v1/companies/:id/journals
POST /v1/companies/:id/tax-calculations
POST /v1/companies/:id/filings/drafts
POST /v1/companies/:id/filings/:filingId/validate
POST /v1/companies/:id/filings/:filingId/request-approval
POST /v1/companies/:id/filings/:filingId/approve
POST /v1/companies/:id/filings/:filingId/simulate
GET /v1/companies/:id/filings/:filingId/receipt
POST /v1/firm/engagements
GET /v1/firm/portfolio

All mutations use CSRF/session checks where relevant, idempotency keys, authenticated actor context and audited results. Live submission endpoint is feature-gated by adapter readiness and authorized submission credentials.

## 10. AI boundaries and review UX
Extracted fields include source file, page/region, confidence, parser/model version, and reviewer. Low confidence or sensitive tax categories always enter an exception queue. LLM output must never post directly to books, change a return, or submit it. Prompt-injection-resistant parsing, safe previews, PII minimization and model provider data processing contracts are mandatory. Show users the original source for every number.

## 11. GDPR, security and tax compliance
EU/EEA hosting preference, encryption at rest and in transit, documented processor/subprocessor inventory, DPIA assessment, least privilege, MFA for privileged roles, OAuth token rotation, immutable audit logs, per-country statutory retention rules, backup/recovery and verified deletion workflow. Consult qualified local tax professionals and official channel specifications before marking any adapter LIVE_VERIFIED.

## 12. Test strategy and acceptance gates
Unit: money precision, exchange rates, balanced journals, date-effective tax rules, idempotent imports, duplicate detection, approval invalidation.
Security: horizontal/vertical tenant escape, revoked engagement access, OAuth scopes, document ownership, replay and privilege escalation.
Contract: adapters return explicit capability flags and normalized validation/errors, never invent government confirmation.
E2E: owner onboarding -> file import -> proposed ledger -> accountant review -> VAT draft -> owner approval -> simulated submission -> simulated receipt.
Go-live blocks: independent tax review, tax fixture coverage, signed-channel qualification, backup restore drill, incident response rehearsal, privacy/security assessment, signed processing agreements.

## 13. Phased execution
Milestone A: security foundation, schema, seed countries, dual portal auth/roles, tenant isolation.
Milestone B: source document ingestion, bank import, ledger, matching and review.
Milestone C: Dutch deterministic VAT rules + evidence and reproducible draft snapshots.
Milestone D: engagement workflow + per-filing owner authorization + simulation receipt.
Milestone E: country plugin SDK and Estonia feasibility/sandbox trial.
Milestone F: expand other country adapters only after jurisdiction-specific legal, testing and connector gates.

## 14. Engineering repository structure
apps/business; apps/pro; apps/api
packages/auth; packages/db; packages/ledger; packages/tax-core; packages/country-adapters/{nl,be,de,lv,lt,ee,se,dk,fi,no}; packages/filing; packages/ai-extraction; packages/shared
migrations; fixtures; tests/{unit,integration,e2e,security,contracts}; docs/{product,architecture,compliance}; scripts.

## 15. Brand migration plan
Selected brand: **TaxAgentEU**. Product surfaces: **TaxAgentEU Business** (self-service) and **TaxAgentEU Pro** (accountant workspace). Trademark, competitor and domain clearance are pending; do not claim exclusive rights or publish an unverified domain. Preserve original historical commit history. Update README, package names and UI strings when implementation begins. Do not rename the GitHub repository, domains, OAuth callbacks, integrations or production URLs until trademark/domain review and redirect/deployment plan are complete. No domain availability or trademark exclusivity is asserted.

## 16. Definition of done
Each feature requires migrations, server-side permissions, tests (positive and negative), observability, redaction, data retention plan, user documentation and rollback. Real tax authority submission is never enabled by merely changing a feature flag; connector accreditation/permissions and live integration verification are separate release gates.
