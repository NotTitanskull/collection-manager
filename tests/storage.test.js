import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSavedArray, saveArray } from '../src/services/storage.js';
import { validateSavedCards, validateSavedBinders } from '../src/services/savedData.js';
import { sampleCards } from '../src/data/sampleCards.js';

function storage(t, initial = {}) {
  const values = new Map(Object.entries(initial));
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    },
  });
  t.after(() =>
    original
      ? Object.defineProperty(globalThis, 'localStorage', original)
      : delete globalThis.localStorage,
  );
  return values;
}
const card = (changes = {}) => ({
  entryId: 'a',
  name: 'Sol Ring',
  quantity: 2,
  condition: 'Near Mint',
  ...changes,
});

test('new collection defaults are cloned; saved empty data stays empty', (t) => {
  storage(t, { empty: '[]' });
  const defaults = [card({ binderIds: [] })];
  const loaded = loadSavedArray('new', defaults, validateSavedCards);
  loaded.data[0].binderIds.push('binder');
  assert.deepEqual(defaults[0].binderIds, []);
  assert.equal(loaded.error, null);
  assert.deepEqual(loadSavedArray('empty', defaults, validateSavedCards).data, []);
});

test('samples and older optional fields are valid; legacy overallocations stay reviewable', () => {
  assert.equal(validateSavedCards(sampleCards), null);
  const legacy = [
    card({ binderIds: ['a', 'b'] }),
    card({ entryId: 'b', binderQuantities: { a: 3 } }),
  ];
  const before = structuredClone(legacy);
  assert.equal(validateSavedCards(legacy), null);
  assert.deepEqual(legacy, before);
});

test('bad JSON, wrong shapes, bad fields, and duplicate IDs preserve exact original text', (t) => {
  const values = storage(t);
  const invalid = [
    '{broken',
    'null',
    '{}',
    '[null]',
    JSON.stringify([card({ name: 4 })]),
    JSON.stringify([card({ quantity: -1 })]),
    JSON.stringify([card(), card()]),
    JSON.stringify([card({ binderQuantities: [] })]),
    JSON.stringify([card({ binderIds: [5] })]),
    JSON.stringify([card({ finish: 'unknown' })]),
    JSON.stringify([card({ purchasePrice: '10' })]),
  ];
  for (const raw of invalid) {
    values.set('cards', raw);
    const result = loadSavedArray('cards', sampleCards, validateSavedCards);
    assert.ok(result.error, raw);
    assert.deepEqual(result.data, []);
    assert.equal(result.raw, raw);
    assert.equal(values.get('cards'), raw);
  }
});

test('binder records reject missing names, duplicate identities, and reserved names', () => {
  const binder = { id: 'b', name: 'Commander', description: '', color: 'blue' };
  assert.equal(validateSavedBinders([binder]), null);
  for (const data of [
    [null],
    [{ id: 'b' }],
    [binder, binder],
    [binder, { id: 'c', name: ' commander ' }],
    [{ id: 'b', name: 'Favorites' }],
    [{ ...binder, description: 5 }],
  ])
    assert.ok(validateSavedBinders(data));
});

test('valid records round-trip without changing unknown or legacy fields', (t) => {
  storage(t);
  const cards = [card({ price: 1.25, favorite: false, extra: 'keep me' })];
  assert.equal(saveArray('cards', cards), true);
  assert.deepEqual(loadSavedArray('cards', [], validateSavedCards).data, cards);
});

test('unavailable storage is reported; write failures return false', (t) => {
  storage(t);
  t.mock.method(localStorage, 'getItem', () => {
    throw new Error('Blocked');
  });
  t.mock.method(localStorage, 'setItem', () => {
    throw new Error('Full');
  });
  t.mock.method(console, 'error', () => {});
  assert.match(loadSavedArray('cards', sampleCards, validateSavedCards).error, /could not be read/);
  assert.equal(saveArray('cards', []), false);
});
