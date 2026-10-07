import { CollectionEntry } from '../models/CollectionEntry.js';

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

/** @type {CollectionEntryData[]} */
// Each constructor call receives printing information followed by owned-copy details.
// Prices remain legacy sample estimates, not purchase costs or live market quotes.
export const sampleCards = [
  new CollectionEntry(
    {
      id: '86b45e3e-8460-4678-87d1-d74479936c83',
      name: 'Dogmeat, Ever Loyal',
      type_line: 'Legendary Creature — Dog',
      set: 'pip',
      set_name: 'Fallout',
      collector_number: '2',
      image_uris: {
        normal:
          'https://cards.scryfall.io/normal/front/8/6/86b45e3e-8460-4678-87d1-d74479936c83.jpg?1783912422',
      },
    },
    {
      entryId: 'sample-1',
      condition: 'Near Mint',
      quantity: 1,
      isFoil: true,
      favorite: true,
      trade: true,
      binderIds: [],
      price: 18,
    },
  ),
  new CollectionEntry(
    {
      id: 'f29ba16f-c8fb-42fe-aabf-87089cb214a7',
      name: 'Lightning Bolt',
      type_line: 'Instant',
      set: '2x2',
      set_name: 'Double Masters 2022',
      collector_number: '117',
      image_uris: {
        normal:
          'https://cards.scryfall.io/normal/front/f/2/f29ba16f-c8fb-42fe-aabf-87089cb214a7.jpg?1783921885',
      },
    },
    {
      entryId: 'sample-2',
      condition: 'Lightly Played',
      quantity: 4,
      isFoil: false,
      favorite: false,
      trade: false,
      binderIds: [],
      price: 6.5,
    },
  ),
  new CollectionEntry(
    {
      id: '46ca0b66-a000-4483-b916-f5b89e710244',
      name: 'Sol Ring',
      type_line: 'Artifact',
      set: 'cmm',
      set_name: 'Commander Masters',
      collector_number: '410',
      image_uris: {
        normal:
          'https://cards.scryfall.io/normal/front/4/6/46ca0b66-a000-4483-b916-f5b89e710244.jpg?1783915591',
      },
    },
    {
      entryId: 'sample-3',
      condition: 'Near Mint',
      quantity: 2,
      isFoil: false,
      favorite: true,
      trade: false,
      binderIds: [],
      price: 11.5,
    },
  ),
];
