import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  CATALOG,
  CONDITIONS,
  CollectionEntry,
  SAMPLE_CARDS,
  Condition,
  Finish,
} from '../../data/sample-cards';

const emptyFilters = () => ({
  condition: '',
  location: '',
  set: '',
  color: '',
  foil: false,
  favorite: false,
  trade: false,
});

@Component({
  selector: 'app-collection',
  imports: [FormsModule],
  templateUrl: './collection.html',
  styleUrl: './collection.scss',
})
export class Collection {
  private readonly route = inject(ActivatedRoute);
  readonly routeData = toSignal(this.route.data, { initialValue: this.route.snapshot.data });
  readonly conditions = CONDITIONS;
  readonly colors = [
    { value: 'W', label: 'White' },
    { value: 'U', label: 'Blue' },
    { value: 'B', label: 'Black' },
    { value: 'R', label: 'Red' },
    { value: 'G', label: 'Green' },
    { value: 'C', label: 'Colorless' },
  ];
  filterDraft = emptyFilters();
  cardSearch = '';
  selectedName = '';
  printingId = '';
  draft = this.newDraft();
  deleting = false;
  failedImages = new Set<string>();

  get view() {
    return this.routeData()['view'];
  }
  get title() {
    return this.view === 'favorites'
      ? 'Favorites'
      : this.view === 'trade'
        ? 'For Trade'
        : 'My Collection';
  }
  get description() {
    return this.view === 'favorites'
      ? 'Your favorite cards, all in one place.'
      : this.view === 'trade'
        ? 'Keep your next trade ready to go.'
        : 'Browse and manage every card in your collection.';
  }
  get locations() {
    return [...new Set(SAMPLE_CARDS.map((e) => e.location))].sort();
  }
  get sets() {
    return [...new Set(CATALOG.map((p) => p.setName))];
  }
  // Each route shows a fixed sample view, not a live collection.
  get cards() {
    return SAMPLE_CARDS.filter(
      (entry) =>
        (this.view !== 'favorites' || entry.favorite) && (this.view !== 'trade' || entry.forTrade),
    );
  }
  get copies() {
    return this.cards.reduce((sum, e) => sum + e.quantity, 0);
  }
  get matches() {
    return this.cardSearch.trim() && !this.selectedName
      ? CATALOG.filter((p) => p.name.toLowerCase().includes(this.cardSearch.trim().toLowerCase()))
      : [];
  }
  get printings() {
    return CATALOG.filter((p) => p.name === this.selectedName);
  }
  get printing() {
    return this.printings.find((p) => p.id === this.printingId);
  }
  newDraft() {
    return {
      id: 0,
      finish: 'Nonfoil' as Finish,
      condition: 'Near Mint' as Condition,
      quantity: 1,
      location: '',
      favorite: false,
      forTrade: false,
    };
  }
  begin(entry?: CollectionEntry) {
    this.draft = entry
      ? { ...entry }
      : {
          ...this.newDraft(),
          favorite: this.view === 'favorites',
          forTrade: this.view === 'trade',
        };
    this.selectedName = entry?.printing.name ?? '';
    this.cardSearch = this.selectedName;
    this.printingId = entry?.printing.id ?? '';
    this.deleting = false;
  }
  searchCard(value: string) {
    this.cardSearch = value;
    this.selectedName = '';
    this.printingId = '';
    this.draft.finish = 'Nonfoil';
  }
  selectCard(name: string) {
    this.selectedName = name;
    this.cardSearch = name;
    this.printingId = '';
  }
  selectPrinting(id: string) {
    this.printingId = id;
    this.draft.finish = this.printing?.finishes[0] ?? 'Nonfoil';
  }
  resetFilterForm() {
    this.filterDraft = emptyFilters();
  }
  conditionClass(condition: Condition) {
    return 'condition-' + CONDITIONS.indexOf(condition);
  }
  imageFailed(id: string) {
    this.failedImages = new Set([...this.failedImages, id]);
  }
}
