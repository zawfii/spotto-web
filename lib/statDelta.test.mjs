// Uruchom: node --test lib/statDelta.test.mjs — te same przypadki co utils/__tests__/statDelta.test.ts w apce.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statDelta } from './statDelta.ts';

const L = 'od poprzednich 30 dni';

test('both ≥ 20 → rounded percent', () => {
  assert.deepEqual(statDelta(30, 25, L), { text: '+20% od poprzednich 30 dni', up: true });
  assert.deepEqual(statDelta(20, 40, L), { text: '−50% od poprzednich 30 dni', up: false });
});

test('small numbers → absolute increase', () => {
  assert.deepEqual(statDelta(5, 2, L), { text: '+3 od poprzednich 30 dni', up: true });
  assert.deepEqual(statDelta(25, 0, L), { text: '+25 od poprzednich 30 dni', up: true });
});

test('small decline, no change, nothing → null', () => {
  assert.equal(statDelta(2, 4, L), null);
  assert.equal(statDelta(30, 30, L), null);
  assert.equal(statDelta(0, 0, L), null);
  assert.equal(statDelta(200, 201, L), null); // rounds to 0%
  assert.equal(statDelta(10, 30, L), null); // current < 20, decline
});
