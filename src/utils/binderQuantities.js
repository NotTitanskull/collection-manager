// Older binder IDs meant every owned copy. Keep that meaning until the user reviews the split.
export function binderAssignments(card) {
  if (card.binderQuantities && typeof card.binderQuantities === 'object') {
    return { ...card.binderQuantities };
  }
  return Object.fromEntries((card.binderIds ?? []).map(id => [id, card.quantity]));
}

export function assignedQuantity(card, binderId) {
  const quantity = binderAssignments(card)[binderId];
  return Number.isInteger(quantity) && quantity > 0 ? quantity : 0;
}

export function totalAssigned(assignments) {
  return Object.values(assignments).reduce((sum, quantity) => sum + (Number.isInteger(quantity) && quantity > 0 ? quantity : 0), 0);
}

export function validAssignments(assignments, ownedQuantity) {
  return Number.isInteger(ownedQuantity) && ownedQuantity > 0 &&
    Object.values(assignments).every(quantity => Number.isInteger(quantity) && quantity > 0) &&
    totalAssigned(assignments) <= ownedQuantity;
}

export function availableQuantity(card, binderId) {
  const assignments = binderAssignments(card);
  delete assignments[binderId];
  return Math.max(0, card.quantity - totalAssigned(assignments));
}

export function saveAssignments(card, assignments) {
  if (!validAssignments(assignments, card.quantity)) return false;
  card.binderQuantities = { ...assignments };
  card.binderIds = Object.keys(assignments);
  return true;
}
