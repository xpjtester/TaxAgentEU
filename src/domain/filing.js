import {createHash,randomUUID} from "node:crypto";
import {requirePermission} from "./permissions.js";
const transitions={
 DRAFT:["NEEDS_REVIEW","READY_FOR_APPROVAL"],
 NEEDS_REVIEW:["READY_FOR_APPROVAL"],
 READY_FOR_APPROVAL:["APPROVED"],
 APPROVED:["AUTHORIZATION_PENDING"],
 AUTHORIZATION_PENDING:["AUTHORIZED"],
 AUTHORIZED:["SUBMISSION_QUEUED"],
 SUBMISSION_QUEUED:["SUBMITTED","UNKNOWN"],
 SUBMITTED:["RECEIVED","UNKNOWN"],
 RECEIVED:["ACCEPTED","REJECTED","UNKNOWN"],
 UNKNOWN:["RECEIVED","ACCEPTED","REJECTED"]
};
export function transition(state,next){
 if(!(transitions[state]??[]).includes(next))throw new Error("INVALID_TRANSITION");
 return next;
}
export function stablePayload(payload){
 if(!payload||typeof payload!=="object"||Array.isArray(payload))throw new Error("INVALID_PAYLOAD");
 return JSON.stringify(Object.fromEntries(Object.entries(payload).sort(([a],[b])=>a.localeCompare(b))));
}
export function hashPayload(payload){return createHash("sha256").update(stablePayload(payload)).digest("hex");}
export function approveDraft({draft,membership,userId,statementAccepted,unresolvedTasks=0}){
 requirePermission(membership,"filing:approve",draft.orgId);
 if(draft.status!=="READY_FOR_APPROVAL"||!statementAccepted||unresolvedTasks!==0)throw new Error("APPROVAL_BLOCKED");
 const snapshot={id:randomUUID(),orgId:draft.orgId,draftId:draft.id,payload:structuredClone(draft.payload),hash:hashPayload(draft.payload)};
 return {snapshot,approval:{snapshotId:snapshot.id,approvedBy:userId,statementVersion:"v1"},status:"APPROVED"};
}
export function queueMockSubmission({snapshot,approval,authorization,membership,currentPayload,idempotencyKey}){
 requirePermission(membership,"filing:submit",snapshot.orgId);
 if(!approval||approval.snapshotId!==snapshot.id||authorization?.snapshotId!==snapshot.id||authorization?.status!=="AUTHORIZED")throw new Error("SUBMISSION_BLOCKED");
 if(hashPayload(currentPayload)!==snapshot.hash)throw new Error("SNAPSHOT_CHANGED");
 if(typeof idempotencyKey!=="string"||idempotencyKey.length<12)throw new Error("INVALID_IDEMPOTENCY_KEY");
 return {attemptId:randomUUID(),snapshotId:snapshot.id,idempotencyKey,adapter:"MOCK_ONLY",status:"SUBMISSION_QUEUED"};
}
export function mockReceipt(attempt){
 if(attempt.adapter!=="MOCK_ONLY")throw new Error("INVALID_ADAPTER");
 return {attemptId:attempt.attemptId,status:"ACCEPTED",receiptRef:"MOCK-"+attempt.attemptId,official:false};
}
