// Uruchom: node lib/menu-lang.test.ts
import assert from 'node:assert/strict';
import { allergenLabelsEn, pickMenuLang } from './menu-lang.ts';

// Polski tylko, gdy przeglądarka stawia go na pierwszym miejscu; boty bez nagłówka dostają polski.
assert.equal(pickMenuLang('en-US,pl;q=0.9'), 'en');
assert.equal(pickMenuLang('pl-PL,en;q=0.8'), 'pl');
assert.equal(pickMenuLang('PL'), 'pl');
assert.equal(pickMenuLang('de-DE,de;q=0.9'), 'en');
assert.equal(pickMenuLang(null), 'pl');
assert.equal(pickMenuLang(''), 'pl');
assert.equal(pickMenuLang('*'), 'pl');

// Kolejność jak w ALLERGENS (lib/owner.ts), nie jak w danych.
assert.equal(allergenLabelsEn(['mleko', 'gluten']), 'gluten, milk');
assert.equal(allergenLabelsEn(['orzeszki_ziemne', 'siarczyny']), 'peanuts, sulphites');
assert.equal(allergenLabelsEn(['nieznany']), '');

console.log('menu-lang: ok');
