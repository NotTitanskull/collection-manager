import { Card } from './Card.js';

/** Incoming copies in a trade draft, separate from the owned collection. */
export class TradeEntry extends Card {
  /**
   * @param {import('./Card.js').ScryfallPrinting} printing Selected Scryfall printing.
   * @param {Object} [options] Details and market estimate for incoming copies.
   * @param {string} [options.entryId] Draft row ID; generated when omitted.
   * @param {string} [options.condition='Near Mint'] Condition of the incoming copies.
   * @param {number} [options.quantity=1] Number of incoming copies.
   * @param {'nonfoil'|'foil'|'etched'} [options.finish='nonfoil'] Selected finish.
   * @param {string} [options.finishLabel='Nonfoil'] Display label for that finish.
   * @param {number|null} [options.price=null] Market estimate per copy in USD, not purchase cost.
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
