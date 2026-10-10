-- D1 / SQLite development baseline. Apply only after migration review.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS jurisdictions (
  code TEXT PRIMARY KEY CHECK(length(code)=2),
  name TEXT NOT NULL,
  currency TEXT NOT NULL,
  filing_capability TEXT NOT NULL DEFAULT 'DRAFT_ONLY'
    CHECK(filing_capability IN ('NOT_SUPPORTED','DRAFT_ONLY','EXPORT_ONLY','SANDBOX','LIVE_VERIFIED'))
);
INSERT OR IGNORE INTO jurisdictions(code,name,currency) VALUES
('NL','Netherlands','EUR'),('BE','Belgium','EUR'),('DE','Germany','EUR'),
('LV','Latvia','EUR'),('LT','Lithuania','EUR'),('EE','Estonia','EUR'),
('SE','Sweden','SEK'),('DK','Denmark','DKK'),('FI','Finland','EUR'),('NO','Norway','NOK');
CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS organizations (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN ('BUSINESS','ACCOUNTING_FIRM')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS organization_members (
 organization_id TEXT NOT NULL REFERENCES organizations(id),
 user_id TEXT NOT NULL REFERENCES users(id),
 role TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'ACTIVE',
 PRIMARY KEY(organization_id,user_id)
);
CREATE TABLE IF NOT EXISTS companies (
 id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id),
 legal_name TEXT NOT NULL, country TEXT NOT NULL REFERENCES jurisdictions(code),
 base_currency TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS company_members (
 company_id TEXT NOT NULL REFERENCES companies(id),
 user_id TEXT NOT NULL REFERENCES users(id), role TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'ACTIVE', PRIMARY KEY(company_id,user_id)
);
CREATE TABLE IF NOT EXISTS accountant_engagements (
 id TEXT PRIMARY KEY, company_id TEXT NOT NULL REFERENCES companies(id),
 firm_id TEXT NOT NULL REFERENCES organizations(id),
 status TEXT NOT NULL CHECK(status IN ('INVITED','ACTIVE','REVOKED','EXPIRED')),
 scopes_json TEXT NOT NULL DEFAULT '[]', consent_actor_id TEXT REFERENCES users(id),
 consent_at TEXT, expires_at TEXT NOT NULL, revoked_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_engagements_company ON accountant_engagements(company_id,status);
CREATE TABLE IF NOT EXISTS source_documents (
 id TEXT PRIMARY KEY, company_id TEXT NOT NULL REFERENCES companies(id),
 object_key TEXT NOT NULL UNIQUE, sha256 TEXT NOT NULL,
 original_name TEXT NOT NULL, media_type TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('QUARANTINED','PROCESSING','READY','REJECTED')),
 uploaded_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_documents_company_hash ON source_documents(company_id,sha256);
CREATE TABLE IF NOT EXISTS bank_transactions (
 id TEXT PRIMARY KEY, company_id TEXT NOT NULL REFERENCES companies(id),
 bank_account_ref TEXT NOT NULL, external_ref TEXT, value_date TEXT NOT NULL,
 currency TEXT NOT NULL, amount_minor INTEGER NOT NULL,
 source_document_id TEXT REFERENCES source_documents(id),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_bank_company_date ON bank_transactions(company_id,value_date);
CREATE TABLE IF NOT EXISTS journal_entries (
 id TEXT PRIMARY KEY, company_id TEXT NOT NULL REFERENCES companies(id),
 period TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('DRAFT','POSTED','REVERSED')),
 currency TEXT NOT NULL, created_by TEXT NOT NULL REFERENCES users(id),
 posted_at TEXT, reversed_by_entry_id TEXT REFERENCES journal_entries(id)
);
CREATE TABLE IF NOT EXISTS journal_lines (
 id TEXT PRIMARY KEY, entry_id TEXT NOT NULL REFERENCES journal_entries(id),
 account_code TEXT NOT NULL, debit_minor INTEGER NOT NULL DEFAULT 0 CHECK(debit_minor>=0),
 credit_minor INTEGER NOT NULL DEFAULT 0 CHECK(credit_minor>=0),
 CHECK((debit_minor=0 AND credit_minor>0) OR (credit_minor=0 AND debit_minor>0))
);
CREATE INDEX IF NOT EXISTS idx_journal_entries_company ON journal_entries(company_id,period);
-- Journal balance and immutability enforced by transactional service and audited DB guards before production.
CREATE TABLE IF NOT EXISTS tax_rule_versions (
 id TEXT PRIMARY KEY, jurisdiction TEXT NOT NULL REFERENCES jurisdictions(code),
 tax_type TEXT NOT NULL, version TEXT NOT NULL, effective_from TEXT NOT NULL,
 effective_to TEXT, status TEXT NOT NULL CHECK(status IN ('DRAFT','VERIFIED','RETIRED')),
 UNIQUE(jurisdiction,tax_type,version)
);
CREATE TABLE IF NOT EXISTS filings (
 id TEXT PRIMARY KEY, company_id TEXT NOT NULL REFERENCES companies(id),
 jurisdiction TEXT NOT NULL REFERENCES jurisdictions(code),
 tax_type TEXT NOT NULL, period TEXT NOT NULL,
 rule_version_id TEXT REFERENCES tax_rule_versions(id),
 snapshot_json TEXT NOT NULL, snapshot_hash TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('DRAFT','AWAITING_APPROVAL','APPROVED',
 'SIMULATED_SUBMITTED','EXPORTED_FOR_MANUAL_FILING','LIVE_SUBMITTED','RECEIPT_CONFIRMED')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_filings_company ON filings(company_id,period,status);
CREATE TABLE IF NOT EXISTS filing_approvals (
 id TEXT PRIMARY KEY, filing_id TEXT NOT NULL REFERENCES filings(id),
 actor_id TEXT NOT NULL REFERENCES users(id),
 snapshot_hash TEXT NOT NULL, approved_at TEXT NOT NULL,
 UNIQUE(filing_id,snapshot_hash)
);
CREATE TABLE IF NOT EXISTS filing_receipts (
 id TEXT PRIMARY KEY, filing_id TEXT NOT NULL REFERENCES filings(id),
 receipt_type TEXT NOT NULL CHECK(receipt_type IN ('SIMULATION_ONLY','MANUAL','OFFICIAL')),
 reference TEXT NOT NULL, authority_accepted INTEGER NOT NULL DEFAULT 0,
 received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS audit_events (
 id TEXT PRIMARY KEY, company_id TEXT REFERENCES companies(id), actor_id TEXT REFERENCES users(id),
 action TEXT NOT NULL, resource_type TEXT NOT NULL, resource_id TEXT,
 occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 metadata_json TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_audit_company_time ON audit_events(company_id,occurred_at);
