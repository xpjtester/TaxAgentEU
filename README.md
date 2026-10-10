# NL Tax Accountant AI (early prototype)

A Dutch SME bookkeeping and VAT preparation product for non-technical business owners.

## Scope
- Invoice upload (PDF/images), bank statement import (CSV/MT940), email OAuth (Gmail/Microsoft): planned, not implemented.
- Conservative bank/invoice matching and domestic VAT draft calculations: prototype modules implemented.
- Filing: NOT IMPLEMENTED. No tax authority integration or authority to submit returns.

## Run
Requires Node.js 20+.
```sh
npm test
npm start
curl http://localhost:8787/health
```

## Security and tax guardrails
Never upload real customer documents to this prototype. No authentication, persistence, encryption, malware scanning or tenant isolation exists yet. All amounts use integer cents. Foreign VAT, reverse-charge, KOR, private expenses, VAT exemptions and disputed deductibility must be reviewed by a qualified human. Do not use the draft result to file a return.

## Roadmap
1. Private multi-tenant storage, authentication, audit events, data retention and deletion.
2. File upload and extraction with source evidence; duplicate detection.
3. Bank CSV/MT940 parsing, conservative matching, exceptions review.
4. Deterministic Netherlands VAT rules, extensive fixtures and accountant verification.
5. OAuth with least-privilege access and explicit consent.
6. Filing export, approval and compliant submission integration after validation.
