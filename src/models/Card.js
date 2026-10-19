/**
 * The Scryfall printing fields used by this app; this describes data, not validation.
 * @typedef {Object} ScryfallPrinting
 * @property {string} id Exact printing ID.
 * @property {string} name Card name.
 * @property {string} set Set code.
 * @property {string} set_name Set display name.
 * @property {string} collector_number Number within the set.
 * @property {string} [type_line] Card type text.
 * @property {string} [rarity] Printing rarity.
 * @property {{normal?: string}} [image_uris] Image for a single-faced card.
 * @property {Array<{image_uris?: {normal?: string}}>} [card_faces] Images for multiple faces.
 * @property {string[]} [finishes] Available finishes such as nonfoil, foil, and etched.
 * @property {Object<string, string|null>} [prices] Market prices supplied as strings or null.
 */

/**
 * Shared printing information for a collection entry or an incoming trade entry.
 * Forms validate condition, quantity, finish, and cost before creating an entry.
 * This class has no instance methods: restored JSON objects can use the same fields.
 */
export class Card {
  /**
   * @param {ScryfallPrinting} printing A selected Scryfall printing, not a saved collection entry.
   */
  constructor(printing) {
    this.scryfallId = printing.id;

    // Normalize printing information once for both card-creation flows.
    this.name = printing.name;
    this.type = printing.type_line ?? '';
    this.setCode = printing.set.toUpperCase();
    this.collectorNumber = printing.collector_number;
    this.rarity = printing.rarity ?? '';
    this.printing = `${printing.set_name} — ${this.setCode} #${this.collectorNumber}`;

    // Double-faced cards can supply their image on the first face instead.
    this.image = printing.image_uris?.normal ?? printing.card_faces?.[0]?.image_uris?.normal ?? '';
  }
}
