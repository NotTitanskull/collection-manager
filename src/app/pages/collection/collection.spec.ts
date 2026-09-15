import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Collection } from './collection';
import { CATALOG, SAMPLE_CARDS } from '../../data/sample-cards';

describe('Collection prototype', () => {
  let component: Collection;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Collection],
      providers: [provideRouter([])],
    }).compileComponents();
    component = TestBed.createComponent(Collection).componentInstance;
  });
  it('keeps form previews separate from the static sample cards', () => {
    component.begin(SAMPLE_CARDS[0]);
    component.draft.quantity = 9;
    component.draft.favorite = false;
    expect(SAMPLE_CARDS[0].quantity).toBe(1);
    expect(SAMPLE_CARDS[0].favorite).toBe(true);
    component.begin(SAMPLE_CARDS[0]);
    expect(component.draft.quantity).toBe(1);
  });
  it('locks foil availability to a selected printing', () => {
    component.selectCard(CATALOG[0].name);
    expect(component.printing).toBeUndefined();
    component.selectPrinting(CATALOG[0].id);
    expect(component.draft.finish).toBe('Foil');
    expect(component.printing?.finishes).toEqual(['Foil']);
    component.searchCard('Lightning');
    expect(component.printing).toBeUndefined();
    component.selectCard(CATALOG[1].name);
    component.selectPrinting(CATALOG[1].id);
    expect(component.draft.finish).toBe('Nonfoil');
  });
});
