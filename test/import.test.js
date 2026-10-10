import test from "node:test";
import assert from "node:assert/strict";
import {parseIngCsv} from "../src/import/bank-csv.js";
import {normalizeInvoice} from "../src/import/invoices.js";
const header="Date;Name / Description;Account;Counterparty;Code;Debit/Credit;Amount (EUR)";
test("ING sample parses decimal comma and debit sign",()=>{
 const data=header+"\n20260901;Hosting;NL00OWN;NL00OTHER;GT;Debit;12,10\n";
 const result=parseIngCsv(data);
 assert.equal(result.transactions[0].amountCents,-1210);
 assert.equal(result.transactions[0].date,"2026-09-01");
 assert.equal(result.requiresReview,true);
});
test("reject unknown bank layout",()=>assert.throws(()=>parseIngCsv("date;amount\n2026-01-01;12"),/Unsupported/));
test("reject invalid calendar date",()=>assert.throws(()=>parseIngCsv(header+"\n20260230;x;a;b;c;Credit;1,00"),/Invalid date/));
test("reject VAT larger than invoice",()=>assert.throws(()=>normalizeInvoice({id:"x",kind:"purchase",date:"2026-09-01",currency:"EUR",totalCents:100,vatCents:101}),/Invalid invoice/));
test("manual invoices always require review",()=>assert.equal(normalizeInvoice({id:"x",kind:"purchase",date:"2026-09-01",currency:"EUR",totalCents:121,vatCents:21,reviewRequired:false}).reviewRequired,true));
