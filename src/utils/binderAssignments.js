/**
 * @typedef {Object} Binder
 * @property {string} id Stable ID referenced by owned card entries.
 * @property {string} name Display name.
 * @property {string} description Optional description, stored as an empty string when blank.
 * @property {string} color Cover color name.
 */

/** @typedef {Object<string, number>} BinderAssignments Binder ID mapped to assigned copy count. */
/** @typedef {import('../models/CollectionEntry.js').CollectionEntryData} CollectionEntryData */

/**
 * Read a copy of the assignments without changing the card.
 * Legacy binderIds assign all owned copies to each listed binder until reviewed.
 * @param {CollectionEntryData} card Owned entry, including legacy saved entries.
 * @returns {BinderAssignments} A new map that callers may safely edit.
 */
export function binderAssignments(card) {
  if (card.binderQuantities && typeof card.binderQuantities === 'object') {
    return { ...card.binderQuantities };
  }
  return Object.fromEntries((card.binderIds ?? []).map((id) => [id, card.quantity]));
}

/**
 * Read how many copies of an entry belong to one binder.
 * @param {CollectionEntryData} card Owned entry.
 * @param {string} binderId Binder to inspect.
 * @returns {number} Assigned copies, or zero for a missing or invalid count.
 */
export function assignedQuantity(card, binderId) {
  const quantity = binderAssignments(card)[binderId];
  return Number.isInteger(quantity) && quantity > 0 ? quantity : 0;
}

/**
 * Sum positive whole copy counts, ignoring invalid values.
 * @param {BinderAssignments} assignments Binder IDs and copy counts.
 * @returns {number} Total assigned copies; use validAssignments to detect invalid data.
 */
export function totalAssigned(assignments) {
  return Object.values(assignments).reduce(
    (sum, quantity) => sum + (Number.isInteger(quantity) && quantity > 0 ? quantity : 0),
    0
  );
}

/**
 * Check that positive whole assignments fit within a positive whole owned quantity.
 * An empty assignment map is valid; zero-count memberships must be removed.
 * @param {BinderAssignments} assignments Proposed assignments.
 * @param {number} ownedQuantity Total copies owned in this entry.
 * @returns {boolean} Whether the proposed allocation is valid.
 */
export function validAssignments(assignments, ownedQuantity) {
  return (
    Number.isInteger(ownedQuantity) &&
    ownedQuantity > 0 &&
    Object.values(assignments).every((quantity) => Number.isInteger(quantity) && quantity > 0) &&
    totalAssigned(assignments) <= ownedQuantity
  );
}

/**
 * Calculate copies available for assignment without changing the card.
 * @param {CollectionEntryData} card Owned entry.
 * @param {string} [binderId] Exclude this binder's allocation when editing its count.
 * @returns {number} Unassigned copies, plus this binder's copies when an ID is supplied.
 */
export function availableQuantity(card, binderId) {
  const assignments = binderAssignments(card);
  delete assignments[binderId];
  return Math.max(0, card.quantity - totalAssigned(assignments));
}

/**
 * Apply valid assignments to the supplied card or draft and synchronize binderIds.
 * Mutates the card, but never writes to localStorage; App.vue handles persistence.
 * @param {CollectionEntryData} card Entry or editable copy to update.
 * @param {BinderAssignments} assignments Proposed binder copy counts; copied before assignment.
 * @returns {boolean} True when applied; false leaves the card unchanged.
 */
export function saveAssignments(card, assignments) {
  if (!validAssignments(assignments, card.quantity)) return false;
  card.binderQuantities = { ...assignments };
  card.binderIds = Object.keys(assignments);
  return true;
}
