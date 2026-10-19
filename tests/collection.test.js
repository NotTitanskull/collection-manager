import test from 'node:test';
import assert from 'node:assert/strict';
import { addCollectionEntries } from '../src/utils/addCards.js';
import {
  binderAssignments,
  availableQuantity,
  saveAssignments,
  validAssignments,
} from '../src/utils/binderAssignments.js';

const entry = (changes = {}) => ({
  entryId: 'owned',
  scryfallId: 'printing',
  quantity: 2,
  condition: 'Near Mint',
  isFoil: false,
  purchasePrice: null,
  favorite: false,
  trade: false,
  binderQuantities: {},
  binderIds: [],
  ...changes,
});

test('merging copies preserves allocations, flags, and existing identity', () => {
  const existing = entry({ binderQuantities: { a: 1 }, binderIds: ['a'] });
  const cards = [existing];
  const incoming = entry({
    entryId: 'new',
    quantity: 3,
    favorite: true,
    trade: true,
    binderQuantities: { a: 1, b: 1 },
  });
  addCollectionEntries(cards, [incoming]);
  assert.equal(cards.length, 1);
  assert.equal(cards[0], existing);
  assert.equal(existing.quantity, 5);
  assert.deepEqual(existing.binderQuantities, { a: 2, b: 1 });
  assert.deepEqual(existing.binderIds, ['a', 'b']);
  assert.equal(existing.favorite, true);
  assert.equal(existing.trade, true);
  assert.equal(incoming.quantity, 3);
});

test('printing, finish, condition, and purchase cost keep entries separate', () => {
  for (const changes of [
    { scryfallId: 'other' },
    { finish: 'foil' },
    { finish: 'etched' },
    { condition: 'Damaged' },
    { purchasePrice: 0 },
  ]) {
    const cards = [entry()];
    addCollectionEntries(cards, [entry({ entryId: 'new', ...changes })]);
    assert.equal(cards.length, 2, JSON.stringify(changes));
  }
});

test('legacy memberships do not absorb newly added unassigned copies', () => {
  const legacy = entry({ binderQuantities: undefined, binderIds: ['a', 'b'] });
  addCollectionEntries([legacy], [entry({ quantity: 1, finish: 'nonfoil' })]);
  assert.equal(legacy.quantity, 3);
  assert.deepEqual(legacy.binderQuantities, { a: 2, b: 2 });
});

test('editing a binder can reuse its copies but cannot take another binder’s copies', () => {
  const card = entry({ quantity: 5, binderQuantities: { a: 2, b: 1 } });
  assert.equal(availableQuantity(card), 2);
  assert.equal(availableQuantity(card, 'a'), 4);
  assert.equal(saveAssignments(card, { a: 4, b: 1 }), true);
  assert.deepEqual(card.binderIds, ['a', 'b']);
  const before = structuredClone(card);
  assert.equal(saveAssignments(card, { a: 5, b: 1 }), false);
  assert.deepEqual(card, before);
});

test('allocation reads are copies; removing membership preserves owned quantity', () => {
  const card = entry({ binderQuantities: { a: 2 }, binderIds: ['a'] });
  const assignments = binderAssignments(card);
  delete assignments.a;
  assert.deepEqual(card.binderQuantities, { a: 2 });
  assert.equal(saveAssignments(card, assignments), true);
  assert.equal(card.quantity, 2);
  assert.deepEqual(card.binderIds, []);
});

test('new allocations reject fractional, zero, negative, or excessive counts', () => {
  for (const count of [0, -1, 1.5, 3, '1', NaN])
    assert.equal(validAssignments({ a: count }, 2), false);
  assert.equal(validAssignments({}, 2), true);
});
