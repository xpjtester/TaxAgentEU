# TaxAgentEU

**Your AI Tax Agent for Europe.**

TaxAgentEU is an early-stage AI-assisted bookkeeping and tax-filing workflow for Dutch small businesses (ZZP, eenmanszaak and BV), designed for non-technical business owners.

## Intended experience
Connect permitted sources, upload invoices and bank statements, review an evidence-backed tax draft, and explicitly approve it. Real filing will require a separate authorized submission integration.

## Current implementation
- Prototype modules for conservative bank-to-invoice reconciliation and domestic VAT draft calculations.
- Node.js HTTP service with a health endpoint only.
- On the `feat/taxagenteu-foundation` branch: Cloudflare D1 schema, multi-business role model and a **simulation-only** filing state machine with unit tests.
- **Not implemented:** production authentication, secure file ingestion, live database API, payment system, or tax authority submissions.

## Run locally
Requires Node.js 20+.
```sh
npm test
npm start
curl http://localhost:8787/health
```

## Safety
**Never upload real customer financial records to this prototype.** No production authentication, persisted tenant authorization, encryption, or malware scanning is present. Store amounts in integer cents. Reverse charge, KOR, cross-border VAT, private expenditure, VAT exemptions and disputed deductibility require qualified human review. Simulated filings are never submitted to Belastingdienst.

See [foundation architecture](docs/FOUNDATION.md) for the planned permission model and release blockers.

Copyright © 2026 Qi IT Consulting. All rights reserved.
