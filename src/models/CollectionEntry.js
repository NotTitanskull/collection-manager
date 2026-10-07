import { Card } from './Card.js';

/** A printing and the copies you own. Forms validate values before creation. */
export class CollectionEntry extends Card {
  /**
   * @param {Object} printing Selected Scryfall printing.
   * @param {Object} [options] Copy details; omitted values receive defaults below.
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

    // Each entry gets its own lists, so changing one cannot change another.
    this.binderIds = [...(options.binderIds ?? [])];
    this.binderQuantities = { ...(options.binderQuantities ?? {}) };
    this.purchasePrice = options.purchasePrice ?? null;

    // Preserve legacy sample estimates without treating them as purchase costs.
    if (options.price !== undefined) this.price = options.price;
    if (options.finish !== undefined) this.finish = options.finish;
  }
}
