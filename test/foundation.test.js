import test from "node:test";
import assert from "node:assert/strict";
import {can} from "../src/domain/permissions.js";
import {approveDraft,queueMockSubmission,mockReceipt,transition} from "../src/domain/filing.js";
const orgId="org-1",owner={orgId,role:"owner",status:"active"};
test("cross-tenant access denied",()=>assert.equal(can(owner,"filing:submit","org-2"),false));
test("bookkeeper cannot approve or submit",()=>{
 const m={orgId,role:"bookkeeper",status:"active"};
 assert.equal(can(m,"filing:approve",orgId),false);assert.equal(can(m,"filing:submit",orgId),false);
});
test("approval requires explicit consent and resolved tasks",()=>{
 const draft={id:"d1",orgId,status:"READY_FOR_APPROVAL",payload:{vatCents:2100}};
 assert.throws(()=>approveDraft({draft,membership:owner,userId:"u",statementAccepted:false}),/APPROVAL_BLOCKED/);
 assert.throws(()=>approveDraft({draft,membership:owner,userId:"u",statementAccepted:true,unresolvedTasks:1}),/APPROVAL_BLOCKED/);
});
test("mock submission enforces authorization and snapshot integrity",()=>{
 const draft={id:"d1",orgId,status:"READY_FOR_APPROVAL",payload:{vatCents:2100}};
 const {snapshot,approval}=approveDraft({draft,membership:owner,userId:"u",statementAccepted:true});
 const auth={snapshotId:snapshot.id,status:"AUTHORIZED"};
 assert.throws(()=>queueMockSubmission({snapshot,approval,authorization:auth,membership:owner,currentPayload:{vatCents:2101},idempotencyKey:"a-long-idempotency-key"}),/SNAPSHOT_CHANGED/);
 assert.throws(()=>queueMockSubmission({snapshot,approval,authorization:null,membership:owner,currentPayload:draft.payload,idempotencyKey:"a-long-idempotency-key"}),/SUBMISSION_BLOCKED/);
 const attempt=queueMockSubmission({snapshot,approval,authorization:auth,membership:owner,currentPayload:draft.payload,idempotencyKey:"a-long-idempotency-key"});
 assert.equal(mockReceipt(attempt).official,false);
});
test("invalid state transition rejected",()=>assert.throws(()=>transition("DRAFT","ACCEPTED"),/INVALID_TRANSITION/));
