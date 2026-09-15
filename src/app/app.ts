import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  readonly navigation = [
    { path: '/', label: 'Collection', icon: '▤' },
    { path: '/favorites', label: 'Favorites', icon: '♡' },
    { path: '/trade', label: 'Trade', icon: '⇄' },
  ];
}
