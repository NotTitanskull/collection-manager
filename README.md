# MTG Collection Manager

A Vue 3 collection manager built with single-file components, Vite, Bootstrap, and Sass.

## Run
Run `npm install`, then `npm run dev` and open the local URL printed by Vite. Run `npm run build` to create a production build. Internet access is required for Scryfall searches and card images. Bootstrap CSS and JavaScript are bundled with the app.

## Styles
Shared SCSS lives in `src/assets/scss/` and is imported by `src/main.js`. Vite compiles it automatically when running `npm run dev` or `npm run build`; a separate Sass watcher is not needed for the Vue app. Component-specific SCSS can stay in its `.vue` file.

- `_variables.scss`: shared theme values; import with `@use` where needed. It emits no CSS.
- `_forms.scss`: shared modal sections and option controls, scoped under `.dialog-form` rather than a particular page.
- `_navigation.scss`: shared application layout and navigation.
- `_trade.scss`: active shared Trade page styles under `.trade-page`.
- `CollectionEntry.vue`, `CardSearch.vue`, and `AddCardModal.vue`: scoped styles for their own markup. Keep component selectors here instead of duplicating them in shared SCSS.


## Data and prices
Use the floating + button on Collection to add a card.

The migrated collection uses the `collection-manager:cards` localStorage key. Use the same browser and URL/port to access saved data; another browser or origin has separate data. Data is not synced to a server. Storage failures currently log a console error.

Purchase price is an optional USD cost per copy, recorded in Add Card or Manage Card. Leave it blank for cards from packs, gifts, or unknown costs; zero is a valid recorded cost. Existing saved estimates are preserved as legacy data and never reclassified as purchase costs. Market estimates are fetched from Scryfall separately, cached in memory for 15 minutes, and are not condition-adjusted. Manage Card shows a market estimate with Refresh price. Add Card supports separate condition/quantity/purchase-price groups sharing a selected printing and finish, including nonfoil, foil, and etched foil when available. Older saved cards retain their original foil/nonfoil behavior. The Trade view supports collection selection on the giving side and Scryfall printing/finish selection on the receiving side, editable quantities, removal, and estimated totals. Missing prices leave the comparison incomplete. It does not change collection data. The comparison draft resets when leaving the page.

## Organization
- `index.html`: Vite entry HTML and Vue mount element.
- `src/App.vue`: shared page layout and navigation.
- `src/views/`: routed pages.
- `src/components/`: shared controls (including `FloatingAddButton.vue`) and their scoped styles.
- `src/components/modals/`: modal forms and their shared `ModalWrapper.vue`.
- `src/stores/`: shared reactive state and persistence.
- `src/data/`: sample collection data.
- `src/assets/scss/`: shared and page-level styles.

## Binders
Custom binders are saved under `collection-manager:binders`. Use the floating + button on the Binders page to create a binder; rename, recolor, and delete binders through Edit Binder. Names must be unique (ignoring case and surrounding spaces); Favorites is reserved for the automatic binder driven by each card’s favorite flag.

Open a binder to search/sort its contents, edit its details, or use the floating + button to add existing collection entries. The card count includes quantities. Assignments apply to all copies in an entry; a card may belong to multiple binders. Add Card and Manage Card also provide binder selection. To remove an assignment, uncheck that binder in Manage Card and save. Deleting a binder removes only its assignments, preserving the cards and their other binders.

Trade comparisons fetch Scryfall USD market estimates on both sides and offer Refresh prices. Exact printings and nonfoil/foil/etched finishes are respected. Loading and failed lookups are shown; unavailable prices leave the comparison incomplete. Purchase costs do not affect trade totals. They do not assess condition or guarantee trade fairness.

## Deployment
Run `npm run build` and publish the generated `dist/` directory. The Vite base is relative, so assets work under a GitHub Pages repository path. Hash routing avoids server rewrite requirements. Uploading the source files alone does not deploy the Vite app.

## Understanding the code

See [the code guide](docs/code-guide.md) for Vue terminology, component responsibilities, data structures, and the save flow. Source comments explain the main functions and important state boundaries.

Dialogs in `src/components/modals/` share `ModalWrapper.vue`, a small Vue wrapper around Bootstrap’s `Modal` plugin. Bootstrap handles Escape, backdrop clicks, focus trapping, page scroll locking, sizing, and scrolling. Close and Cancel buttons use `data-bs-dismiss="modal"`; Bootstrap’s `hidden.bs.modal` event updates Vue visibility. Save actions still validate and update application data before closing. Modals omit the optional fade animation so cleanup finishes before Vue removes them. Bootstrap’s CSS and JavaScript plugins are imported in `src/main.js`, so other standard components can use Bootstrap’s data attributes.
