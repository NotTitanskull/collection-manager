import { binderAssignments } from './binderQuantities.js';

// Legacy saved entries use isFoil instead of an explicit finish.
function finishOf(card) {
  return card.finish ?? (card.isFoil ? 'foil' : 'nonfoil');
}

// Keep distinct printings, treatments, conditions, and purchase costs separate.
export function addCollectionEntries(cards, entries) {
  for (const entry of entries) {
    const existing = cards.find(card =>
      card.scryfallId && card.scryfallId === entry.scryfallId &&
      finishOf(card) === finishOf(entry) &&
      card.condition === entry.condition &&
      (card.purchasePrice ?? null) === (entry.purchasePrice ?? null),
    );
    if (!existing) {
      cards.push(entry);
      continue;
    }

    // Read legacy allocations before increasing quantity: new copies are not
    // automatically assigned to every binder the existing entry belongs to.
    const assignments = binderAssignments(existing);
    for (const [binderId, quantity] of Object.entries(binderAssignments(entry))) {
      assignments[binderId] = (assignments[binderId] ?? 0) + quantity;
    }
    existing.quantity += entry.quantity;
    existing.binderQuantities = assignments;
    existing.binderIds = Object.keys(assignments);
    existing.favorite = existing.favorite || entry.favorite;
    existing.trade = existing.trade || entry.trade;
  }
}
