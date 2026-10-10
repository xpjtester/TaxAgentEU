import test from "node:test";
import assert from "node:assert/strict";
import {JURISDICTIONS,jurisdiction} from "../src/platform/jurisdictions.js";
import {ACTIONS,canAccess} from "../src/platform/permissions.js";
import {createDraft,requestApproval,approve,simulate,invalidate} from "../src/platform/filing.js";
const owner={userId:"owner",companyId:"company-1",role:"BUSINESS_OWNER",status:"ACTIVE"};
const finance={userId:"finance",companyId:"company-1",role:"BUSINESS_FINANCE",status:"ACTIVE"};
const mk = (payableMinor=2100)=>createDraft({companyId:"company-1",country:"NL",taxType:"VAT",
  period:"2026-09",totals:{payableMinor},ruleVersion:"nl-vat-test-v1",evidenceIds:["inv-1"]});
test("ten jurisdictions and Norwegian EU separation",()=>{
  assert.equal(JURISDICTIONS.length,10);
  assert.equal(jurisdiction("NO").euMember,false);
  assert.equal(jurisdiction("DK").currency,"DKK");
  assert.ok(JURISDICTIONS.every(x=>x.filingCapability==="DRAFT_ONLY"));
  assert.throws(()=>jurisdiction("US"),/UNSUPPORTED/);
});
test("deny cross tenant, finance approvals and unconsented firms",()=>{
  assert.equal(canAccess({actorId:"owner",companyId:"another",action:ACTIONS.APPROVE,memberships:[owner]}),false);
  assert.equal(canAccess({actorId:"finance",companyId:"company-1",action:ACTIONS.APPROVE,memberships:[finance]}),false);
  const e={userId:"accountant",companyId:"company-1",role:"ACCOUNTANT",status:"ACTIVE",
    clientConsent:true,expiresAt:Date.now()+10000,scopes:[ACTIONS.PREPARE]};
  assert.equal(canAccess({actorId:"accountant",companyId:"company-1",action:ACTIONS.PREPARE,engagements:[e]}),true);
  assert.equal(canAccess({actorId:"accountant",companyId:"company-1",action:ACTIONS.APPROVE,engagements:[e]}),false);
  assert.equal(canAccess({actorId:"accountant",companyId:"company-1",action:ACTIONS.PREPARE,
    engagements:[{...e,clientConsent:false}]}),false);
  assert.equal(canAccess({actorId:"accountant",companyId:"company-1",action:ACTIONS.PREPARE,
    engagements:[{...e,expiresAt:0}]}),false);
});
test("approval is required, snapshot changes invalidate and receipt is simulation only",()=>{
  const ctx={actorId:"owner",companyId:"company-1",memberships:[owner],now:Date.now()};
  const draft=mk();
  assert.throws(()=>simulate(draft,ctx),/APPROVAL_REQUIRED/);
  const pending=requestApproval(draft,{actorId:"finance",memberships:[finance]});
  assert.throws(()=>approve(pending,{actorId:"finance",memberships:[finance]}),/ACCESS_DENIED/);
  const approved=approve(pending,ctx);
  const result=simulate(approved,ctx);
  assert.equal(result.status,"SIMULATED_SUBMITTED");
  assert.equal(result.receipt.governmentAccepted,false);
  const changed=invalidate(approved,mk(2200));
  assert.equal(changed.status,"DRAFT");
  assert.throws(()=>simulate(changed,ctx),/APPROVAL_REQUIRED/);
  assert.throws(()=>approve({...pending,snapshot:{...pending.snapshot,totals:{payableMinor:999}}},ctx),/SNAPSHOT_CHANGED/);
});
test("reject unsupported/invalid draft values",()=>{
  assert.throws(()=>createDraft({companyId:"x",country:"NO",taxType:"VAT",period:"2026-13",
    totals:{payableMinor:12},ruleVersion:"v1"}),/INVALID_DRAFT/);
  assert.throws(()=>createDraft({companyId:"x",country:"NO",taxType:"VAT",period:"2026-09",
    totals:{payableMinor:1.5},ruleVersion:"v1"}),/INVALID_DRAFT/);
});
