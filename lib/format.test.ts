// Uruchom: node lib/format.test.ts
import assert from 'node:assert/strict';
import { instagramUrl } from './format.ts';

// Właściciel wpisuje w panelu nazwę konta albo cały link — oba dają link do profilu.
assert.equal(instagramUrl('bejbi_na_rozdrozu'), 'https://www.instagram.com/bejbi_na_rozdrozu/');
assert.equal(instagramUrl(' @bistro.pokazowe '), 'https://www.instagram.com/bistro.pokazowe/');
assert.equal(instagramUrl('https://www.instagram.com/bejbi_na_rozdrozu/'), 'https://www.instagram.com/bejbi_na_rozdrozu/');
assert.equal(instagramUrl('instagram.com/bejbi_na_rozdrozu?igsh=abc'), 'https://www.instagram.com/bejbi_na_rozdrozu/');
assert.equal(instagramUrl(''), null);
assert.equal(instagramUrl(null), null);
assert.equal(instagramUrl('javascript:alert(1)'), null);
assert.equal(instagramUrl('nie mam'), null);

console.log('format: ok');
