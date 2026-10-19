# MTG Collection Manager

A Vue 3 collection manager built with single-file components, Vite, Bootstrap, and Sass.

## Run

Run `npm install`, then `npm run dev` and open the local URL printed by Vite. Run `npm run build` to create a production build. Internet access is required for Scryfall searches and card images. Bootstrap CSS and JavaScript are bundled with the app.

## Styles

Shared SCSS lives in `src/styles/` and is imported by `src/main.js`. Vite compiles it automatically when running `npm run dev` or `npm run build`; a separate Sass watcher is not needed for the Vue app. Component-specific SCSS can stay in its `.vue` file.

- `_variables.scss`: shared theme values; import with `@use` where needed. It emits no CSS.
- `_forms.scss`: shared modal sections and option controls, scoped under `.dialog-form` rather than a particular page.
- `_navigation.scss`: shared application layout and navigation.
- `src/styles/_trade.scss`: Trade page styles, imported by `TradeView.vue`.
- `CollectionCardRow.vue`, `CardSearch.vue`, and `AddCardModal.vue`: scoped styles for their own markup. Keep component selectors here instead of duplicating them in shared SCSS.

## Data and prices

Use the floating + button on Collection to add a card.

The migrated collection uses the `collection-manager:cards` localStorage key. Use the same browser and URL/port to access saved data; another browser or origin has separate data. Data is not synced to a server. Write failures show a warning and log a console error. If saved cards or binders are malformed, saving pauses for both lists and the original stored text remains untouched. The warning offers an original-data download; edits made while saving is paused last only for the current session.

Purchase price is an optional USD cost per copy, recorded in Add Card or Manage Card. Leave it blank for cards from packs, gifts, or unknown costs; zero is a valid recorded cost. Existing saved estimates are preserved as legacy data and never reclassified as purchase costs. Market estimates are fetched from Scryfall separately, cached in memory for 15 minutes, and are not condition-adjusted. Opening a collection card shows a large image and brings together its owned conditions and printings. Add another preselects the shown printing and finish; Edit opens the original Manage Card form for that entry and returns to the overview. Manage Card shows a market estimate with Refresh price. Add Card supports separate condition/quantity/purchase-price groups sharing a selected printing and finish, including nonfoil, foil, and etched foil when available. Older saved cards retain their original foil/nonfoil behavior. The Trade view supports collection selection on the giving side and Scryfall printing/finish selection on the receiving side, editable quantities, removal, and estimated totals. Missing prices leave the comparison incomplete. It does not change collection data. The comparison draft resets when leaving the page.

## Organization

- `src/App.vue`: shared layout, ownership of saved cards and binders, and change handlers.
- `src/router.js`: maps URLs to pages.
- `src/views/`: the three routed pages.
- `src/components/`: card, binder, and trade controls and dialogs; generic UI in `shared/`.
- `src/models/`: card and entry classes.
- `src/services/`: browser storage, saved-data validation, Scryfall printings, and market prices.
- `src/utils/`: shared collection-merging and binder-allocation rules.
- `src/data/`: starter collection examples and shared condition/finish options.
- `src/styles/`: theme, navigation, forms, and trade styles.

App.vue passes saved data to pages as props. Dialogs edit local drafts and emit named
change events through their pages back to App.vue. Root watchers persist changes.
See [the code guide](docs/code-guide.md) for the architecture evaluation and a
five-minute presentation walkthrough.

## Binders

Custom binders are saved under `collection-manager:binders`. Use the floating + button on the Binders page to create a binder; use Binder options to edit or delete a binder. Deletion opens a separate confirmation and keeps your cards in the collection. Names must be unique (ignoring case and surrounding spaces); Favorites is reserved for the automatic binder driven by each card’s favorite flag.

Open a binder to search/sort its contents, edit its details, or use the floating + button to add existing collection entries. Binder counts and rows show assigned copies, separately from the total owned. Choose how many unassigned copies to add; opening a card in a custom binder edits only that binder’s count, and 0 removes the assignment. Copies are split across binders: total assigned cannot exceed the owned quantity. Add Card and Manage Card also provide per-binder quantity controls. Reducing owned quantity requires adjusting binder assignments first. Add Card allocates binder counts across new copy groups in their listed order. Existing single-binder memberships retain their full count; overlapping legacy memberships are flagged for review in Manage Card rather than automatically redistributed. Favorites remains an automatic view of all favorite copies, without reserving copies. Deleting a binder frees its assignments and preserves the cards and other binder quantities.

Trade comparisons fetch Scryfall USD market estimates on both sides and offer Refresh prices. Exact printings and nonfoil/foil/etched finishes are respected. Loading and failed lookups are shown; unavailable prices leave the comparison incomplete. Purchase costs do not affect trade totals. They do not assess condition or guarantee trade fairness.

## Deployment

Run `npm run build` and publish the generated `dist/` directory. The Vite base is relative, so assets work under a GitHub Pages repository path. Hash routing avoids server rewrite requirements. Uploading the source files alone does not deploy the Vite app.

## Understanding the code

See [the code guide](docs/code-guide.md) for Vue terminology, component responsibilities, data structures, and the save flow. Source comments explain the main functions and important state boundaries.

Dialogs live alongside their related controls under `src/components/cards/`, `src/components/binders/`, and `src/components/trade/`. They share `src/components/shared/ModalWrapper.vue`, a small Vue wrapper around Bootstrap’s `Modal` plugin. Bootstrap handles Escape, backdrop clicks, focus trapping, page scroll locking, sizing, and scrolling. Close and Cancel buttons use `data-bs-dismiss="modal"`; Bootstrap’s `hidden.bs.modal` event updates Vue visibility. Save actions still validate and update application data before closing. Modals omit the optional fade animation so cleanup finishes before Vue removes them. Bootstrap’s CSS and JavaScript plugins are imported in `src/main.js`, so other standard components can use Bootstrap’s data attributes.

## Tests

Run `npm test` for the Node test suite. No browser, live API calls, or additional test
packages are required. Tests cover card merging, binder copy limits and legacy
memberships, storage restoration and malformed data, and printing pagination,
errors, and cancellation. Run `npm run build` to check the Vue production bundle.
The JavaScript source uses ES modules (`"type": "module"` in package.json).

For UI checks, exercise Add Card and Trade Receive, including cancelling or changing
a search while printings load. Check native Apple text suggestions directly in Safari;
simulated composition events cannot fully reproduce the operating-system popup.
