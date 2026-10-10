import test from 'node:test';
import assert from 'node:assert/strict';
import { transitionFiling } from '../src/filing-workflow.js';
const base = {businessId:'business-a',actorBusinessId:'business-a',role:'owner'};
test('happy path remains simulated',()=>{
 let status='draft';
 for(const action of ['request_review','mark_ready','approve','simulate_submit']){
  const result=transitionFiling({...base,currentStatus:status,action,acknowledged:true});
  status=result.status;
  assert.equal(result.submittedToTaxAuthority,false);
  assert.equal(result.simulation,true);
 }
 assert.equal(status,'simulated_submitted');
});
test('cross-tenant attempt denied',()=>{
 assert.throws(()=>transitionFiling({...base,actorBusinessId:'business-b',currentStatus:'draft',action:'request_review'}),/tenant_access_denied/);
});
test('viewer cannot advance filing',()=>{
 assert.throws(()=>transitionFiling({...base,role:'viewer',currentStatus:'draft',action:'request_review'}),/permission_denied/);
});
test('approval requires explicit acknowledgement',()=>{
 assert.throws(()=>transitionFiling({...base,currentStatus:'ready_for_approval',action:'approve'}),/explicit_acknowledgement_required/);
});
test('skipping review is rejected',()=>{
 assert.throws(()=>transitionFiling({...base,currentStatus:'draft',action:'simulate_submit',acknowledged:true}),/invalid_transition/);
});
test('simulated submission is terminal',()=>{
 assert.throws(()=>transitionFiling({...base,currentStatus:'simulated_submitted',action:'revise'}),/invalid_transition/);
});
