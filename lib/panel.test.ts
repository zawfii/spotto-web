// Uruchom: node lib/panel.test.ts
import assert from 'node:assert/strict';
import { pickVenueId } from './panel.ts';

assert.equal(pickVenueId(['a', 'b'], 'b'), 'b');        // wybrany należy do konta
assert.equal(pickVenueId(['a', 'b'], 'obcy'), 'a');     // ciasteczko z cudzym/starym lokalem
assert.equal(pickVenueId(['a', 'b'], undefined), 'a');  // brak ciasteczka
assert.equal(pickVenueId([], 'a'), null);               // konto bez lokalu
console.log('ok');
