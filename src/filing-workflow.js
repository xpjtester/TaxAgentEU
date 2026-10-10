// Pure simulation-only state machine. No real Belastingdienst submission paths.
export const TRANSITIONS = Object.freeze({
  draft: Object.freeze({ request_review: 'needs_review' }),
  needs_review: Object.freeze({ mark_ready: 'ready_for_approval', revise: 'draft' }),
  ready_for_approval: Object.freeze({ approve: 'approved', revise: 'draft' }),
  approved: Object.freeze({ simulate_submit: 'simulated_submitted', revise: 'draft' }),
  simulated_submitted: Object.freeze({})
});
const VALID_ROLES = Object.freeze({
  request_review: ['owner','admin','accountant'],
  mark_ready: ['owner','admin','accountant'],
  revise: ['owner','admin','accountant'],
  approve: ['owner','admin'],
  simulate_submit: ['owner','admin']
});
export function transitionFiling({ currentStatus, action, role, businessId, actorBusinessId, acknowledged = false }) {
  if (!businessId || !actorBusinessId || businessId !== actorBusinessId) throw new Error('tenant_access_denied');
  if (!VALID_ROLES[action]?.includes(role)) throw new Error('permission_denied');
  const nextStatus = TRANSITIONS[currentStatus]?.[action];
  if (!nextStatus) throw new Error('invalid_transition');
  if ((action === 'approve' || action === 'simulate_submit') && acknowledged !== true) {
    throw new Error('explicit_acknowledgement_required');
  }
  return Object.freeze({ status: nextStatus, simulation: true, submittedToTaxAuthority: false });
}
