/**
 * One owned collection entry, which can represent several identical copies.
 * @typedef {Object} CollectionCard
 * @property {string} entryId Unique owned row ID, used for edits and Vue list keys.
 * @property {string} scryfallId Scryfall printing ID; several owned rows may share it.
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
 * @property {string[]} binderIds Custom binder memberships.
 * @property {number|null} [purchasePrice] Optional purchase cost per copy in USD; null means not recorded.
 * @property {number|null} [price] Legacy saved estimate; not used as a purchase cost or current market price.
 */

/** @type {CollectionCard[]} */
// Initial collection entries. Prices are sample estimates.
export const sampleCards = [
  {
    entryId: "sample-1",
    scryfallId: "86b45e3e-8460-4678-87d1-d74479936c83",
    name: "Dogmeat, Ever Loyal",
    type: "Legendary Creature — Dog",
    printing: "Fallout — PIP #2",
    image:
      "https://cards.scryfall.io/normal/front/8/6/86b45e3e-8460-4678-87d1-d74479936c83.jpg?1783912422",
    condition: "Near Mint",
    quantity: 1,
    isFoil: true,
    favorite: true,
    trade: true,
    binderIds: [],
    price: 18,
  },
  {
    entryId: "sample-2",
    scryfallId: "f29ba16f-c8fb-42fe-aabf-87089cb214a7",
    name: "Lightning Bolt",
    type: "Instant",
    printing: "Double Masters 2022 — 2X2 #117",
    image:
      "https://cards.scryfall.io/normal/front/f/2/f29ba16f-c8fb-42fe-aabf-87089cb214a7.jpg?1783921885",
    condition: "Lightly Played",
    quantity: 4,
    isFoil: false,
    favorite: false,
    trade: false,
    binderIds: [],
    price: 6.5,
  },
  {
    entryId: "sample-3",
    scryfallId: "46ca0b66-a000-4483-b916-f5b89e710244",
    name: "Sol Ring",
    type: "Artifact",
    printing: "Commander Masters — CMM #410",
    image:
      "https://cards.scryfall.io/normal/front/4/6/46ca0b66-a000-4483-b916-f5b89e710244.jpg?1783915591",
    condition: "Near Mint",
    quantity: 2,
    isFoil: false,
    favorite: true,
    trade: false,
    binderIds: [],
    price: 11.5,
  },
];
