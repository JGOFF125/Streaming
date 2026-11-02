import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isRoomApprovalRequired, roomErrorMessage } from '../src/roomErrors.ts';

test('missing account approval is distinguished from database permission misconfiguration', () => {
  const denied = { code: '42501', message: 'Orbit access has not been granted to this account' };
  assert.equal(isRoomApprovalRequired(denied), true);
  assert.match(roomErrorMessage(denied), /not approved/);
  const grants = { code: '42501', message: 'permission denied for function orbit_create_room' };
  assert.equal(isRoomApprovalRequired(grants), false);
  assert.match(roomErrorMessage(grants), /permissions need attention/);
});
test('missing database objects and RPCs explain backend setup without exposing names', () => {
  for (const code of ['PGRST202', 'PGRST205', '42P01', '42883', '3F000']) {
    const text = roomErrorMessage({ code, message: 'secret_table private-value', details: 'sensitive' });
    assert.match(text, /setup is incomplete/);
    assert.doesNotMatch(text, /secret_table|private-value|sensitive/);
  }
});
test('expired or invalid sessions ask for a fresh sign-in', () => {
  for (const code of ['PGRST301', 'PGRST302', 'PGRST303', '28000']) {
    assert.match(roomErrorMessage({ code }), /Sign out and sign in again/);
  }
});
test('busy and unknown responses retain actionable safe messages', () => {
  assert.match(roomErrorMessage({ code: 'PGRST003' }), /server is busy/);
  for (const value of [null, undefined, 'secret', { code: 'unknown', message: 'secret' }, new Error('https://example.test?token=secret')]) {
    const text = roomErrorMessage(value);
    assert.match(text, /connection/);
    assert.doesNotMatch(text, /token=|secret/);
    assert.equal(isRoomApprovalRequired(value), false);
  }
});
