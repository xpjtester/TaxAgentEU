// Pure policy decisions. Server must load memberships and engagements from storage.
export const ACTIONS = Object.freeze({
  READ:"company:read", IMPORT:"data:import", PREPARE:"filing:prepare",
  REVIEW:"filing:review", APPROVE:"filing:approve", SIMULATE:"filing:simulate"
});
const business = {
  BUSINESS_OWNER:Object.values(ACTIONS),
  BUSINESS_FINANCE:[ACTIONS.READ,ACTIONS.IMPORT,ACTIONS.PREPARE,ACTIONS.REVIEW],
  BUSINESS_VIEWER:[ACTIONS.READ]
};
const firm = {
  FIRM_OWNER:[ACTIONS.READ,ACTIONS.IMPORT,ACTIONS.PREPARE,ACTIONS.REVIEW],
  ACCOUNTANT:[ACTIONS.READ,ACTIONS.IMPORT,ACTIONS.PREPARE],
  FIRM_REVIEWER:[ACTIONS.READ,ACTIONS.REVIEW],
  AUDITOR:[ACTIONS.READ]
};
export function canAccess({actorId, companyId, action, memberships=[], engagements=[], now=Date.now()}) {
  if (!actorId || !companyId || !Object.values(ACTIONS).includes(action)) return false;
  if (memberships.some(m=>m.userId===actorId && m.companyId===companyId &&
      m.status==="ACTIVE" && (business[m.role]||[]).includes(action))) return true;
  // Firms can never approve in lieu of client merely by being engaged.
  if (action===ACTIONS.APPROVE || action===ACTIONS.SIMULATE) return false;
  return engagements.some(e=>e.userId===actorId && e.companyId===companyId &&
    e.status==="ACTIVE" && e.clientConsent===true &&
    Number.isFinite(e.expiresAt) && e.expiresAt>now &&
    (firm[e.role]||[]).includes(action) &&
    Array.isArray(e.scopes) && e.scopes.includes(action));
}
export function assertAccess(context) {
  if (!canAccess(context)) throw new Error("ACCESS_DENIED");
}
