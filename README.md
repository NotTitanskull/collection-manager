# MTG Collection Manager

A Vue 3 collection manager built with single-file components, Vite, Bootstrap, and Sass.

## Run
Run `npm install`, then `npm run dev` and open the local URL printed by Vite. Run `npm run build` to create a production build. Internet access is required for Bootstrap, Scryfall searches, and card images.

## Styles
Shared SCSS lives in `src/assets/scss/` and is imported by `src/main.js`. Vite compiles it automatically when running `npm run dev` or `npm run build`; a separate Sass watcher is not needed for the Vue app. The obsolete standalone Sass scripts have been removed to avoid overwriting the reference CSS. Component-specific SCSS can stay in its `.vue` file.

- `_variables.scss`: shared theme values; import with `@use` where needed. It emits no CSS.
- `_forms.scss`: shared modal sections and option controls, scoped under `.dialog-form` rather than a particular page.
- `_navigation.scss`: shared application layout and navigation.
- `_trade.scss`: active shared Trade page styles under `.trade-page`.
- `_collection.scss` and `_binders.scss`: retained prototype reference styles; no longer included in the app bundle. Current collection and binder styling lives in the Vue components.
- `CollectionEntry.vue`, `CardSearch.vue`, and `AddCardModal.vue`: scoped styles for their own markup. Keep component selectors here instead of duplicating them in shared SCSS.

The old `prototype.html`, `js/`, and `css/main.css` are migration references. Their compiled CSS is preserved separately; compiling the current shared SCSS does not include Vue's scoped component styles or recreate the prototype's original CSS.

## Data and prices
The migrated collection uses the `collection-manager:cards` localStorage key. Use the same browser and URL/port to access saved data; another browser or origin has separate data. Data is not synced to a server. Storage failures currently log a console error.

Initial card prices are sample estimates. Newly looked-up prices come from Scryfall and are not condition-adjusted. Missing prices are stored as `null`. Add Card supports separate condition/quantity groups sharing a selected printing and finish, including nonfoil, foil, and etched foil when available. Older saved cards retain their original foil/nonfoil behavior. The Trade view supports collection selection on the giving side and Scryfall printing/finish selection on the receiving side, editable quantities, removal, and estimated totals. Missing prices leave the comparison incomplete. It does not change collection data. The comparison draft resets when leaving the page.

## Organization
- `index.html`: Vite entry HTML and Bootstrap CDN assets.
- `src/App.vue`: shared page layout and navigation.
- `src/views/`: routed pages.
- `src/components/`: reusable UI components and their scoped styles.
- `src/stores/`: shared reactive state and persistence.
- `src/data/`: sample collection data.
- `src/assets/scss/`: shared and page-level styles.

## Binders
Custom binders are saved under `collection-manager:binders`. Create, rename, recolor, and delete them on the Binders page. Names must be unique (ignoring case and surrounding spaces); Favorites is reserved for the automatic binder driven by each card’s favorite flag.

Open a binder to search/sort its contents, edit its details, or add existing collection entries. The card count includes quantities. Assignments apply to all copies in an entry; a card may belong to multiple binders. Add Card and Manage Card also provide binder selection. To remove an assignment, uncheck that binder in Manage Card and save. Deleting a binder removes only its assignments, preserving the cards and their other binders.

Trade comparisons use saved collection prices on the giving side and Scryfall USD prices on the receiving side. They do not assess condition or guarantee trade fairness.

## Deployment
Run `npm run build` and publish the generated `dist/` directory. The Vite base is relative, so assets work under a GitHub Pages repository path. Hash routing avoids server rewrite requirements. Uploading the source files alone does not deploy the Vite app.
