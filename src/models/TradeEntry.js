import { Card } from './Card.js';

/** Incoming copies in a trade draft, separate from the owned collection. */
export class TradeEntry extends Card {
  /**
   * @param {Object} printing Selected Scryfall printing.
   * @param {Object} [options] Details and market estimate for incoming copies.
   */
  constructor(printing, options = {}) {
    super(printing);

    this.entryId = options.entryId ?? crypto.randomUUID();
    this.condition = options.condition ?? 'Near Mint';
    this.quantity = options.quantity ?? 1;
    this.finish = options.finish ?? 'nonfoil';
    this.finishLabel = options.finishLabel ?? 'Nonfoil';
    this.price = options.price ?? null;
  }
}
