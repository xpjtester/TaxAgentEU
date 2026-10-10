# Implementation status — TaxAgentEU

## Implemented on development branch
- Ten country manifests, all conservative DRAFT_ONLY.
- Pure policy engine for company membership and consented time-limited accountant engagements.
- Pure VAT filing draft/approval/simulation flow with content digest and no official submission.
- Initial D1-compatible SQL schema for users, companies, delegated engagements, documents, bank transactions, journals, VAT rules, approvals and audit.
- Unit tests and GitHub Actions CI workflow.

## Not yet implemented; do not use with real customer information
- Production identity provider, MFA, sessions, tenant-scoped repositories and authorized APIs.
- User-facing Business/Accountant portals.
- Encryption key management, safe R2 document quarantine, backup and retention.
- Atomic journal posting checks and immutable ledger DB enforcement.
- Persistent filing workflow (CAS transactions), replay protection and cryptographic attestation.
- Country tax rule validation with local professionals.
- Any live government filing connector, official receipt or legal authorization.

## Next engineering milestone: authenticated vertical slice
1. Identity provider and sessions; company/user membership management; deny-by-default middleware.
2. D1 persistence repositories with company-scope mandatory for every query.
3. Owner/company onboarding and accountant engagement invitation/revocation.
4. Add browser UI after contract tests for cross-company access pass.
5. Allow demonstration data only until independent privacy/security review.

## Brand and repository
Product brand selected: TaxAgentEU. Portals: TaxAgentEU Business and TaxAgentEU Pro. Trademark/domain checks remain pending. Existing GitHub repository name is unchanged pending a separate migration and redirect plan.
