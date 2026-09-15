export const CONDITIONS = [
  'Near Mint',
  'Lightly Played',
  'Moderately Played',
  'Heavily Played',
  'Damaged',
] as const;
export type Condition = (typeof CONDITIONS)[number];
export type Finish = 'Nonfoil' | 'Foil';

export interface CardPrinting {
  id: string;
  name: string;
  type: string;
  setName: string;
  setCode: string;
  collectorNumber: string;
  imageUrl: string;
  finishes: Finish[];
  colors: string[];
}

export interface CollectionEntry {
  id: number;
  printing: CardPrinting;
  finish: Finish;
  condition: Condition;
  quantity: number;
  location: string;
  favorite: boolean;
  forTrade: boolean;
}

// Sample printings from the supplied Scryfall responses, used by the form preview.
export const CATALOG: CardPrinting[] = [
  {
    id: '86b45e3e-8460-4678-87d1-d74479936c83',
    name: 'Dogmeat, Ever Loyal',
    type: 'Legendary Creature — Dog',
    setName: 'Fallout',
    setCode: 'PIP',
    collectorNumber: '2',
    imageUrl:
      'https://cards.scryfall.io/small/front/8/6/86b45e3e-8460-4678-87d1-d74479936c83.jpg?1783912422',
    finishes: ['Foil'],
    colors: ['G', 'R', 'W'],
  },
  {
    id: 'f29ba16f-c8fb-42fe-aabf-87089cb214a7',
    name: 'Lightning Bolt',
    type: 'Instant',
    setName: 'Double Masters 2022',
    setCode: '2X2',
    collectorNumber: '117',
    imageUrl:
      'https://cards.scryfall.io/small/front/f/2/f29ba16f-c8fb-42fe-aabf-87089cb214a7.jpg?1783921885',
    finishes: ['Nonfoil', 'Foil'],
    colors: ['R'],
  },
  {
    id: '46ca0b66-a000-4483-b916-f5b89e710244',
    name: 'Sol Ring',
    type: 'Artifact',
    setName: 'Commander Masters',
    setCode: 'CMM',
    collectorNumber: '410',
    imageUrl:
      'https://cards.scryfall.io/small/front/4/6/46ca0b66-a000-4483-b916-f5b89e710244.jpg?1783915591',
    finishes: ['Nonfoil', 'Foil'],
    colors: [],
  },
];

// Static examples for the interface. Form controls do not update this data.
export const SAMPLE_CARDS: readonly CollectionEntry[] = [
  {
    id: 1,
    printing: CATALOG[0],
    finish: 'Foil',
    condition: 'Near Mint',
    quantity: 1,
    location: 'Trade Binder',
    favorite: true,
    forTrade: true,
  },
  {
    id: 2,
    printing: CATALOG[1],
    finish: 'Nonfoil',
    condition: 'Lightly Played',
    quantity: 4,
    location: 'Red Deck',
    favorite: false,
    forTrade: false,
  },
  {
    id: 3,
    printing: CATALOG[2],
    finish: 'Nonfoil',
    condition: 'Near Mint',
    quantity: 2,
    location: 'Commander Deck',
    favorite: true,
    forTrade: false,
  },
];
