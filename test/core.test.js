import test from "node:test";
import assert from "node:assert/strict";
import { calculateVatDraft } from "../src/tax.js";
import { reconcile } from "../src/reconcile.js";
test("domestic VAT draft uses integer cents and excludes unreviewed cases",()=>{
 const result=calculateVatDraft([{id:"s",kind:"sale",vatCents:2100,vatTreatment:"domestic-standard"},{id:"p",kind:"purchase",vatCents:900,vatTreatment:"domestic-standard",deductible:true},{id:"x",kind:"purchase",vatCents:200,vatTreatment:"reverse-charge",deductible:true}]);
 assert.equal(result.estimatedPayableCents,1200);assert.deepEqual(result.review,["x"]);
});
test("ambiguous bank matches require review",()=>{
 const inv={kind:"purchase",totalCents:12100,currency:"EUR",counterpartyIban:"NL12TEST1234",date:"2026-09-01"};
 const result=reconcile([{id:"t",amountCents:-12100,currency:"EUR",counterpartyIban:"NL12TEST1234",date:"2026-09-01"}],[{...inv,id:"a"},{...inv,id:"b"}]);
 assert.equal(result[0].status,"NEEDS_REVIEW");
});
