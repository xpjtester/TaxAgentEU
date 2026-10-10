# Security gate before real customer onboarding

This repository is a prototype. DO NOT process real bank statements, invoices, credentials or tax IDs.

Production launch requires: authenticated accounts, tenant-scoped authorization on every query, encryption at rest and in transit, private file storage, malware/file-type/size validation, upload rate limits, CSRF protections, OAuth PKCE and minimal read-only scopes, token encryption and revocation, consent tracking, audit events, backup/restore drills, retention/deletion controls, EU GDPR processor agreements, incident response, and independent penetration/security testing.

Bank CSV parsing is format-specific and must be validated against real redacted samples from each supported bank. No bank connection, email OAuth, OCR or tax filing integration exists.

Tax classification and VAT deductibility are subject to Netherlands law and accountant review. The current calculator only demonstrates a limited domestic case; do not use its output to file returns.
