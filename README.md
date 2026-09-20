# MTG Collection Manager

A Vue 3 CDN app for managing cards and binders and comparing trade values.

## Run
Open `index.html` through WebStorm's **Open in Browser**. No Vue CLI or Vite is required. Internet access is required for Vue, Bootstrap, Scryfall searches, and card images.

## Styles
Compiled CSS is included. After changing SCSS, run `npm install` once and `npm run styles`, or leave `npm run styles:watch` running while editing. These commands compile Sass only.

## Data and prices
Collection cards, binders, and wanted trade cards are saved in this browser's local storage. Use the same browser and URL/port to access them; another browser or origin has separate data. Data is not synced to a server. A failed save displays a warning and a Retry saving button.

Initial card prices are sample estimates. Newly looked-up prices come from Scryfall and are not condition-adjusted. An unavailable price is not treated as zero, and blocks a complete trade comparison until an estimate is entered. Changing finish clears a managed card's old estimate. Older saved cards without finish metadata retain their existing finish; newly added cards use Scryfall's available finishes.

## Organization
- `index.html`: Vue templates and Bootstrap modals.
- `js/app.js`: app state, computed lists, methods, API requests, and storage.
- `js/components/`: card search and binder picker components.
- `scss/`: source styles; `css/`: compiled output.

Presentation improvements include separate collection/trade/binder workflows, automatic Favorites, searchable binder selection, and two-sided trade estimates. Multiple condition groups in one submission are future work.
