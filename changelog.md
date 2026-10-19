# Changelog

This file summarizes the application improvements made during the refactoring and cleanup work.
Changes are grouped by area rather than by individual editing session.

## Unreleased

### Project structure and naming

- Reorganized the source into `views`, `components`, `models`, `services`, `utils`, `data`, and `styles` so each folder has a clearer responsibility.
- Grouped card, binder, and trade components with their related dialogs. Moved generic controls and the modal wrapper from `components/ui` to `components/shared`.
- Moved shared SCSS from `src/assets/scss` to `src/styles`. Kept component-specific styles with their Vue components and Trade styles with the Trade page.
- Simplified the router location from `src/router/index.js` to `src/router.js`.
- Renamed `CollectionEntry.vue` to `CollectionCardRow.vue` to distinguish the visual component from the `CollectionEntry` data model.
- Renamed `utils/collectionEntries.js` to `utils/addCards.js` and `utils/binderQuantities.js` to `utils/binderAssignments.js` to make their purposes easier to identify.
- Updated imports and documentation to follow the new locations and names.

### Shared state, props, and events

- Removed the collection and binder stores. `App.vue` now owns the saved collection and binder state.
- Passed shared data from `App.vue` to routed pages through props. Pages pass the relevant data to their child components.
- Routed named change events from dialogs through their pages to the handlers in `App.vue`.
- Kept dialog edits in local drafts until the user saves, so cancelling does not apply unfinished changes to shared data.
- Centralized persistence through root watchers and a dedicated storage service.

### Browser storage and recovery

- Added `services/storage.js` for loading and saving browser data and `services/savedData.js` for validating saved cards and binders.
- Preserved the existing `collection-manager:cards` and `collection-manager:binders` storage keys.
- Added checks for malformed records, duplicate IDs, invalid quantities, unsupported conditions and finishes, and invalid binder assignment values.
- Paused saving for both cards and binders if either saved list fails validation, preserving the original stored text instead of overwriting it.
- Added a warning and an original-data download for recovery. Changes made while saving is paused remain available only for the current session.
- Added visible warnings for storage write failures.
- Kept support for older saved entries and legacy binder memberships without silently redistributing their copies.

### Cards and binder assignments

- Clarified the distinction between card printing data, owned collection entries, and temporary trade entries through models and source comments.
- Documented that binders store their own details, while collection entries store assigned copy counts in `binderQuantities`, keyed by binder ID.
- Clarified that binder contents are derived from those assignments rather than stored as duplicate card lists inside each binder.
- Consolidated the rules for adding matching copies and calculating binder assignments in shared helpers.
- Preserved separate collection entries when their copy details differ, including condition, finish, or purchase cost.
- Made binder controls distinguish assigned copies from the total quantity owned and prevent new assignments from exceeding available copies.
- Kept legacy overlapping assignments visible for review rather than automatically changing them.
- Kept Favorites as an automatic view based on each card's favorite flag, without reserving copies.
- Kept cards in the collection when deleting a binder and removed only that binder's assignments.
- Changed binder options buttons from horizontal dots to vertical dots.

### Search and Scryfall requests

- Added `services/cardPrintings.js` to share printing lookup logic between Add Card and Trade Receive.
- Loaded all pages of printing results and supported cancellation when a request becomes obsolete or its dialog closes.
- Kept loading states, selected printings, and error messages local to each form.
- Improved card-name input handling for native text composition and Apple suggestions in Add Card and Trade Receive.
- Allowed native composition to finish before processing autocomplete keyboard shortcuts, including Safari's key-code compatibility behavior.
- Prevented Escape during composition from also dismissing the surrounding modal.
- Added `data/cardOptions.js` as the shared source for card conditions and finish labels.

### Trade page

- Clarified internal names for offered cards, received cards, totals, missing prices, and quantity validation.
- Kept trade entries as a temporary comparison draft that does not modify the saved collection and resets when leaving the page.
- Kept market estimates separate from purchase costs and marked comparisons incomplete when prices are unavailable.
- Fixed a broad text selector that stretched condition badges across the card details and overrode their colors.
- Kept the condition badge compact beside the per-copy price.
- Enlarged trade card thumbnails and aligned them with the top of the card details.
- Corrected the card-title style selector to match the actual heading markup.
- Stopped empty trade panels from stretching to the height of a populated neighboring panel.
- Preserved a single-column trade layout on smaller screens.

### Readability and documentation

- Added focused JSDoc, data-shape descriptions, and comments around state ownership, storage, card merging, binder assignments, and API requests.
- Organized component scripts more consistently and clarified variable and handler names.
- Moved the collection-entry data description alongside its model instead of leaving it in the sample data file.
- Updated the README, code guide, and card overview guide to match the implementation.
- Added a five-minute presentation walkthrough explaining the structure, data flow, and save process.
- Documented which stylesheets are loaded and how shared styles differ from component-specific styles.
- Clarified that saved data belongs to the browser and origin, is not synced to a server, and may differ when the browser or port changes.

### Development and verification

- Enabled ES modules in `package.json` and added an `npm test` command using Node's built-in test runner.
- Added tests for matching-card merges, binder copy limits, legacy memberships, storage validation and recovery, and printing pagination, errors, and cancellation.
- Added project-local Prettier formatting and formatting-check commands.
- Checked production builds and exercised affected browser flows, including card search, binder menus, storage recovery, and trade quantity changes and removal.
- Checked the revised trade layout at desktop and mobile widths in Chrome.

### Verification limits and troubleshooting notes

- Synthetic composition checks do not fully reproduce Apple's native suggestion popup. That behavior still needs direct verification in Safari.
- Missing-file errors involving moved Vue components disappeared after restarting the development server and refreshing. No permanent fix for every stale development request is claimed here.
- A later `BinderPicker.vue` error occurred in another project's development server. No reference to this project was found in that project's source or configuration; the origin of the request was not confirmed.
- The application remains self-contained in this repository. Temporary browser-test scripts are not runtime dependencies, and no shared global component directory was introduced.
