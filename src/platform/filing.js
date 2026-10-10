import { createHash } from "node:crypto";
import { assertAccess, ACTIONS } from "./permissions.js";
import { jurisdiction } from "./jurisdictions.js";
const serialize = value => JSON.stringify(value);
const hash = value => createHash("sha256").update(serialize(value)).digest("hex");
function validMoney(value) { return Number.isSafeInteger(value); }
export function createDraft({companyId,country,taxType,period,totals,ruleVersion,evidenceIds=[]}) {
  if (!companyId || !taxType || !/^\d{4}-(0[1-9]|1[0-2])$/.test(period) ||
      !ruleVersion || !validMoney(totals?.payableMinor) ||
      !Array.isArray(evidenceIds) || evidenceIds.some(x=>typeof x!=="string")) throw new Error("INVALID_DRAFT");
  jurisdiction(country);
  const snapshot={companyId,country,taxType,period,totals:{payableMinor:totals.payableMinor},
    ruleVersion,evidenceIds:[...evidenceIds].sort()};
  return Object.freeze({status:"DRAFT",snapshot:Object.freeze(snapshot),snapshotHash:hash(snapshot)});
}
export function requestApproval(filing, context) {
  assertAccess({...context,companyId:filing.snapshot.companyId,action:ACTIONS.PREPARE});
  if (filing.status!=="DRAFT") throw new Error("INVALID_TRANSITION");
  return {...filing,status:"AWAITING_APPROVAL"};
}
export function approve(filing,context) {
  assertAccess({...context,companyId:filing.snapshot.companyId,action:ACTIONS.APPROVE});
  if (filing.status!=="AWAITING_APPROVAL") throw new Error("INVALID_TRANSITION");
  if (filing.snapshotHash!==hash(filing.snapshot)) throw new Error("SNAPSHOT_CHANGED");
  return {...filing,status:"APPROVED",approval:{actorId:context.actorId,
    snapshotHash:filing.snapshotHash, approvedAt:new Date(context.now||Date.now()).toISOString()}};
}
export function simulate(filing, context) {
  assertAccess({...context,companyId:filing.snapshot.companyId,action:ACTIONS.SIMULATE});
  if(filing.status!=="APPROVED" || filing.approval?.snapshotHash!==filing.snapshotHash ||
    hash(filing.snapshot)!==filing.snapshotHash) throw new Error("APPROVAL_REQUIRED");
  return {...filing,status:"SIMULATED_SUBMITTED",
    receipt:{type:"SIMULATION_ONLY",governmentAccepted:false,
      reference:"SIM-"+filing.snapshotHash.slice(0,16)}};
}
export function invalidate(filing,newDraft) {
  if(filing.snapshot.companyId!==newDraft.snapshot.companyId) throw new Error("COMPANY_MISMATCH");
  return newDraft; // A changed snapshot always needs a new approval.
}
