import { Card } from './Card.js';

/**
 * One owned collection entry, which can represent several identical copies.
 * @typedef {Object} CollectionEntryData
 * @property {string} entryId Unique owned row ID, used for edits and Vue list keys.
 * @property {string} scryfallId Scryfall printing ID; several owned rows may share it.
 * @property {string} [setCode] Uppercase set code saved on newer entries.
 * @property {string} [collectorNumber] Collector number saved on newer entries.
 * @property {string} [rarity] Printing rarity saved on newer entries.
 * @property {string} name Card name.
 * @property {string} type Card type line.
 * @property {string} printing Human-readable set and collector number.
 * @property {string} image Card image URL.
 * @property {string} condition Condition shared by the copies in this entry.
 * @property {number} quantity Positive whole number of copies.
 * @property {'nonfoil'|'foil'|'etched'} [finish] Explicit finish on newer entries.
 * @property {boolean} isFoil Legacy finish flag retained for older saved entries.
 * @property {boolean} favorite Membership in the automatic Favorites binder.
 * @property {boolean} trade Whether the entry is marked available for trade.
 * @property {string[]} binderIds Compatibility list of assigned binder IDs.
 * @property {Object<string, number>} [binderQuantities] Copies assigned to each custom binder; total cannot exceed owned quantity.
 * @property {number|null} [purchasePrice] Optional purchase cost per copy in USD; null means not recorded.
 * @property {number|null} [price] Legacy saved estimate; not used as a purchase cost or current market price.
 */

/** A printing and the copies you own. Forms validate values before creation. */
export class CollectionEntry extends Card {
  /**
   * @param {import('./Card.js').ScryfallPrinting} printing Selected Scryfall printing.
   * @param {Partial<CollectionEntryData>} [options] Copy details; omitted values receive defaults below.
   */
  constructor(printing, options = {}) {
    // Run Card's constructor first to populate the shared printing fields.
    super(printing);

    this.entryId = options.entryId ?? crypto.randomUUID();
    this.condition = options.condition ?? 'Near Mint';
    this.quantity = options.quantity ?? 1;
    this.isFoil = options.isFoil ?? false;
    this.favorite = options.favorite ?? false;
    this.trade = options.trade ?? false;

    // Each card entry records where its copies belong using binder IDs, not binder objects.
    // Example: quantity = 4 and binderQuantities = { "binder-1": 2, "binder-2": 1 }
    // means two copies in binder-1, one in binder-2, and one unassigned.
    // binderIds is a compatibility list; binderQuantities holds the actual copy counts.
    // Copy both structures so separate entries do not share mutable assignments.
    this.binderIds = [...(options.binderIds ?? [])];
    this.binderQuantities = { ...(options.binderQuantities ?? {}) };
    this.purchasePrice = options.purchasePrice ?? null;

    // Preserve legacy sample estimates without treating them as purchase costs.
    if (options.price !== undefined) this.price = options.price;
    if (options.finish !== undefined) this.finish = options.finish;
  }
}
