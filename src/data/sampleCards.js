import { CollectionEntry } from '../models/CollectionEntry.js';

/** @type {import('../models/CollectionEntry.js').CollectionEntryData[]} */
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
    }
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
    }
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
    }
  ),
];
