import { Routes } from '@angular/router';
import { Collection } from './pages/collection/collection';

export const routes: Routes = [
  {
    path: '',
    component: Collection,
    data: { view: 'collection' },
    title: 'My Collection · MTG Collection',
  },
  {
    path: 'favorites',
    component: Collection,
    data: { view: 'favorites' },
    title: 'Favorites · MTG Collection',
  },
  {
    path: 'trade',
    component: Collection,
    data: { view: 'trade' },
    title: 'For Trade · MTG Collection',
  },
  { path: '**', redirectTo: '' },
];
