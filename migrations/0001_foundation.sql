-- TaxAgentEU foundation (Cloudflare D1 / SQLite).
-- Identifiers are opaque application-generated UUIDs. Store encrypted objects outside D1.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY, email_normalized TEXT NOT NULL UNIQUE, display_name TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS businesses (
 id TEXT PRIMARY KEY, legal_name TEXT NOT NULL, country_code TEXT NOT NULL DEFAULT 'NL',
 kvk_number TEXT, btw_id TEXT, legal_form TEXT NOT NULL CHECK(legal_form IN ('eenmanszaak','bv','vof','other')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_business_kvk ON businesses(country_code,kvk_number) WHERE kvk_number IS NOT NULL;
CREATE TABLE IF NOT EXISTS memberships (
 business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 role TEXT NOT NULL CHECK(role IN ('owner','admin','accountant','viewer')),
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('invited','active','suspended')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(business_id,user_id)
);
CREATE TABLE IF NOT EXISTS source_documents (
 id TEXT PRIMARY KEY, business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
 uploaded_by TEXT NOT NULL REFERENCES users(id), object_key TEXT NOT NULL UNIQUE,
 kind TEXT NOT NULL CHECK(kind IN ('invoice','receipt','bank_statement','other')),
 sha256 TEXT NOT NULL, mime_type TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending'
 CHECK(status IN ('pending','processing','ready','needs_review','rejected')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(business_id,sha256)
);
CREATE INDEX IF NOT EXISTS idx_documents_business ON source_documents(business_id,created_at);
CREATE TABLE IF NOT EXISTS bank_transactions (
 id TEXT PRIMARY KEY, business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
 source_document_id TEXT REFERENCES source_documents(id), booked_on TEXT NOT NULL,
 amount_cents INTEGER NOT NULL, currency TEXT NOT NULL DEFAULT 'EUR',
 description TEXT NOT NULL DEFAULT '', external_fingerprint TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(business_id,external_fingerprint)
);
CREATE INDEX IF NOT EXISTS idx_tx_business_date ON bank_transactions(business_id,booked_on);
CREATE TABLE IF NOT EXISTS tax_returns (
 id TEXT PRIMARY KEY, business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
 return_type TEXT NOT NULL CHECK(return_type IN ('btw','ib','vpb','icp')),
 period_start TEXT NOT NULL, period_end TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','needs_review','ready_for_approval','approved','simulated_submitted')),
 version INTEGER NOT NULL DEFAULT 1 CHECK(version >= 1),
 totals_json TEXT NOT NULL DEFAULT '{}', evidence_json TEXT NOT NULL DEFAULT '[]',
 created_by TEXT NOT NULL REFERENCES users(id),
 approved_by TEXT REFERENCES users(id), approved_at TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK(period_start <= period_end),
 CHECK((approved_by IS NULL AND approved_at IS NULL) OR (approved_by IS NOT NULL AND approved_at IS NOT NULL)),
 UNIQUE(business_id,return_type,period_start,period_end,version)
);
CREATE INDEX IF NOT EXISTS idx_returns_business_status ON tax_returns(business_id,status);
CREATE TABLE IF NOT EXISTS filing_events (
 id TEXT PRIMARY KEY, business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
 tax_return_id TEXT NOT NULL REFERENCES tax_returns(id),
 actor_user_id TEXT NOT NULL REFERENCES users(id),
 action TEXT NOT NULL, from_status TEXT, to_status TEXT,
 is_simulation INTEGER NOT NULL DEFAULT 1 CHECK(is_simulation=1),
 timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, details_json TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_events_business_return ON filing_events(business_id,tax_return_id,timestamp);
-- In production, all queries MUST be scoped by verified membership + business_id;
-- D1 does not provide PostgreSQL row-level security.
