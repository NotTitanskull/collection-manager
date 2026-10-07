/**
 * Shared printing information for a collection entry or an incoming trade entry.
 * Forms validate condition, quantity, finish, and cost before creating an entry.
 * This class has no instance methods: restored JSON objects can use the same fields.
 */
export class Card {
  /**
   * @param {Object} printing A selected Scryfall printing, not a saved collection entry.
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
