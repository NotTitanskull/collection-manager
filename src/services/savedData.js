import { conditions, finishLabels } from '../data/cardOptions.js';

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
const optional = (value, check) => value === undefined || check(value);
const isCost = (value) => value === null || (Number.isFinite(value) && value >= 0);

/** Validate shape and IDs without changing or discarding individual saved rows. */
function validateRows(rows, idField, validateRow) {
  if (!Array.isArray(rows)) return 'Saved data must be a list.';
  const ids = new Set();
  for (const [index, row] of rows.entries()) {
    if (!isObject(row) || !hasText(row[idField])) return `Entry ${index + 1} has no valid ID.`;
    if (ids.has(row[idField])) return `Entry ${index + 1} repeats an ID.`;
    ids.add(row[idField]);
    const error = validateRow(row);
    if (error) return `Entry ${index + 1}: ${error}`;
  }
  return null;
}

/**
 * Validate the fields used by collection screens, accepting older optional fields.
 * Legacy overallocated memberships remain valid to load so Manage Card can repair them.
 * @param {unknown} rows Parsed browser data.
 * @returns {string|null} First problem, or null for a usable collection.
 */
export function validateSavedCards(rows) {
  return validateRows(rows, 'entryId', (card) => {
    if (!hasText(card.name)) return 'Card name is missing.';
    if (!Number.isInteger(card.quantity) || card.quantity < 1)
      return 'Owned quantity must be a positive whole number.';
    if (!conditions.includes(card.condition)) return 'Card condition is not recognized.';
    const textFields = [
      'scryfallId',
      'setCode',
      'collectorNumber',
      'rarity',
      'type',
      'printing',
      'image',
    ];
    if (textFields.some((key) => !optional(card[key], (value) => typeof value === 'string'))) {
      return 'Card details contain an invalid text field.';
    }
    if (
      ['favorite', 'trade', 'isFoil'].some(
        (key) => !optional(card[key], (value) => typeof value === 'boolean')
      )
    ) {
      return 'Card flags must be true or false.';
    }
    if (
      !optional(
        card.finish,
        (value) => typeof value === 'string' && Object.hasOwn(finishLabels, value)
      )
    ) {
      return 'Card finish is not recognized.';
    }
    if (!optional(card.purchasePrice, isCost) || !optional(card.price, isCost))
      return 'Card price is invalid.';
    if (!optional(card.binderIds, (value) => Array.isArray(value) && value.every(hasText))) {
      return 'Binder IDs must be a list of IDs.';
    }
    if (
      !optional(
        card.binderQuantities,
        (value) =>
          isObject(value) &&
          Object.entries(value).every(
            ([id, count]) => hasText(id) && Number.isInteger(count) && count > 0
          )
      )
    ) {
      return 'Binder assignments must contain positive whole copy counts.';
    }
    return null;
  });
}

/**
 * Validate custom binder records without changing them.
 * @param {unknown} rows Parsed browser data.
 * @returns {string|null} First problem, or null.
 */
export function validateSavedBinders(rows) {
  const names = new Set();
  return validateRows(rows, 'id', (binder) => {
    if (binder.id === 'system-favorites') return 'The Favorites ID is reserved.';
    if (!hasText(binder.name)) return 'Binder name is missing.';
    const name = binder.name.trim().toLowerCase();
    if (name === 'favorites' || names.has(name)) return 'Binder name is reserved or repeated.';
    names.add(name);
    if (!optional(binder.description, (value) => typeof value === 'string'))
      return 'Description must be text.';
    if (!optional(binder.color, (value) => typeof value === 'string'))
      return 'Cover color must be text.';
    return null;
  });
}
