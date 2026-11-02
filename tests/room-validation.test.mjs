import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeInvitationCode, normalizeRoomCode } from '../src/room.ts';

test('remote invitations accept grouping and case without accepting invalid characters', () => {
  assert.equal(normalizeInvitationCode('abcd-efgh-jk23'), 'ABCDEFGHJK23');
  assert.equal(normalizeInvitationCode(' ABCD EFGH JK23 '), 'ABCDEFGHJK23');
  for (const code of ['', 'ABCDEF', 'ABCDEFGHIJKL', 'ABCDOFGHJK23', 'ABCD0FGHJK23', 'ABCD1FGHJK23', 'ABCDEFGHJK23EXTRA']) {
    assert.equal(normalizeInvitationCode(code), null);
  }
});
test('the original local room validation is preserved', () => {
  assert.equal(normalizeRoomCode(' abc234 '), 'ABC234');
  assert.equal(normalizeRoomCode('ABCDEFGHJK23'), null);
});
