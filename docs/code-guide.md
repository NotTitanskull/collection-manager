# Reading the collection manager code

## Start here

`index.html` supplies the mount element. `src/main.js` imports Bootstrap CSS and JavaScript plugins, loads shared SCSS, registers the router, and mounts `App.vue`. `App.vue` supplies the navigation and footer; `RouterView` displays the current page from `src/views/`.

The router uses hash URLs so GitHub Pages can serve every route from the same HTML file. Vite compiles `.vue` files and SCSS; browsers do not read those source formats directly.

## Vue vocabulary used here

| Code | Meaning in this app |
| --- | --- |
| `ref(value)` | Reactive state. Use `.value` in JavaScript; Vue unwraps it in templates. |
| `computed(() => ...)` | A derived value, such as filtered cards or a total, recalculated when its reactive dependencies change. |
| `watch(source, callback)` | A side effect when state changes, such as writing browser storage. |
| `defineProps(...)` | Inputs supplied by the parent component, such as the card to display. |
| `defineEmits(...)` / `emit(...)` | Events sent to the parent, such as `manage`, `add`, or `close`. |
| `defineModel(...)` | The component’s two-way `v-model` connection to its parent. |
| `v-model` | Connects an input’s value to reactive state. |
| `v-if` | Creates or removes a component. Our modal drafts start fresh on each opening. |
| `v-for` | Renders one element or component per item. |
| `:key="card.entryId"` | Stable identity so Vue tracks the correct row when the list changes. |
| `:card="card"` | Passes the JavaScript card object as a prop; the colon means a bound expression. |
| `@manage="..."` | Handles an event. `@` is shorthand for `v-on`. |
| `@submit.prevent` | Handles a form submission without the browser reloading the page. |
| `onMounted` / `onBeforeUnmount` | Run setup after rendering or cleanup before removal. |
| `<slot />` | A place where a reusable component renders content supplied by its parent. |

A template ref such as `ref="modalElement"` is different from ordinary form state: Vue assigns the rendered element to that ref.

## Components and responsibilities

Components are grouped by purpose under `src/components/`: `cards/` contains card controls and dialogs, `binders/` contains binder controls and dialogs, and `trade/` contains trade dialogs. Shared UI (`ModalWrapper` and `FloatingAddButton`) lives in `ui/`. Each dialog stays beside the controls it works with.

- `FloatingAddButton`: accessible Add action shared by Collection and Binders, shown as a circle on smaller screens and a labeled pill at desktop widths (992px and up), positioned above mobile navigation.
- `CardSummary`: shared card image, printing, and finish summary in Manage Card and the binder quantity dialog.
- `CollectionEntry`: displays a card and emits `manage`; it does not save data.
- `CardSearch`: debounces Scryfall autocomplete and emits the chosen name.
- `BinderPicker`: shared binder selection and quantity controls used by card forms.
- `ModalWrapper`: Vue lifecycle wrapper around Bootstrap’s Modal plugin.
- `AddCardModal`: selects a printing and finish, collects condition/quantity rows, then creates owned entries.
- `ManageCardModal`: edits or deletes one owned entry by `entryId`.
- `BinderModal`: creates or edits a custom binder.
- `BinderOptions`: shared Bootstrap dropdown for editing and deleting custom binders.
- `DeleteBinderModal`: confirms binder deletion and releases its assignments without deleting cards.
- `BinderCardsModal`: adds selected numbers of unassigned copies to a binder.
- `BinderQuantityModal`: edits only the number assigned to one custom binder, without changing owned stock.
- `TradePickerModal`: chooses owned entries for the giving draft.
- `TradeReceiveModal`: looks up entries for the receiving draft.

Views coordinate these components. `CollectionView` owns search/sort and dialog visibility. `BindersView` owns binder navigation. `TradeView` owns the temporary comparison and totals.

## Where data lives

`src/data/sampleCards.js` defines starting examples and documents the card shape with JSDoc. JSDoc comments help readers and editors; they do not perform runtime validation.

`src/stores/collection.js` and `binders.js` export shared refs. They are JavaScript module exports, not properties added to `window`. All importing components see the same reactive state.

Each store restores a JSON array from `localStorage`. If restoration fails, cards start from a deep copy of the sample data and binders start empty. An intentionally saved empty array stays empty. The current loader checks the outer array, not every field in every entry.

A deep watcher saves nested changes. Storage belongs to the browser and origin; changing ports or browsers gives separate storage. It is not an account or a server database. Storage failures are logged to the console.

### IDs and values

- `entryId` identifies an owned row. Two rows can represent the same printing in different conditions.
- `scryfallId` identifies the exact printing in Scryfall.
- A binder has `id`, `name`, `description`, and `color`. `binderQuantities` maps binder IDs to assigned copy counts. `binderIds` is kept in sync for compatibility. `src/utils/binderQuantities.js` handles legacy memberships and validates that total assigned cannot exceed owned quantity. Older overlapping memberships are preserved and flagged for user review; new assignments must respect the stock limit. Favorites is an automatic view, not an allocation.
- `purchasePrice` is the optional purchase cost per copy in USD. Blank inputs save as `null`; zero is a valid recorded cost. Legacy `price` estimates are preserved but never used as purchase prices or current market values.
- `src/services/marketPrices.js` caches market quotes by exact printing ID for 15 minutes. Finish determines which USD price is used. Forced refreshes fetch again; failed lookups do not fall back to purchase costs or legacy estimates.
- `finish` distinguishes nonfoil, foil, and etched. Older entries can still use `isFoil`.
- Favorites is computed from `favorite`, not stored as another collection of cards.

## Following a change

Clicking a collection row emits `manage(card)`. Its view puts that card in `selectedCard`, which mounts `ManageCardModal`. The modal copies editable values into local refs, including a separate binder quantity draft. Cancel discards these drafts. Save validates them and updates the store entry matching `entryId`. The watcher persists the update, and Vue refreshes the displayed row.

Adding a card follows a similar flow. Scryfall supplies available printings and finishes. Rows with the same condition and purchase price within one submission are combined with a `Map`; rows with different costs stay separate, and each group gets a new owned entry ID. This grouping does not merge earlier saved entries.

Deleting a binder removes its quantity assignment and compatibility ID from cards, preserving the owned quantities and other assignments. Trade edits affect only the draft and never transfer or delete collection entries. The draft resets when leaving Trade.

## How the dialogs work

Parents control visibility with Vue state and `v-if`. `ModalWrapper` creates a Bootstrap `Modal` instance and calls `show()` after mounting. Before Vue removes the component, it calls `hide()` and `dispose()` to clean up the backdrop, scroll lock, and event listeners. The optional `fade` class is omitted so this cleanup completes synchronously, including during route changes.

Bootstrap handles Escape, backdrop clicks, focus trapping, and page scroll locking. Its `modal-dialog-centered`, `modal-dialog-scrollable`, and `modal-lg` classes provide layout without custom modal CSS. Close and Cancel buttons use `data-bs-dismiss="modal"`. The wrapper listens for `hidden.bs.modal` to emit `close` to Vue and restores focus to the original trigger, since our triggers open modals through Vue state rather than Bootstrap’s toggle data API. Save handlers validate and update data before emitting `close` as before.

CardSearch consumes Escape while suggestions are open; otherwise Escape reaches Bootstrap’s modal. Bootstrap has no autocomplete component, so card search keeps its application-specific logic. `src/main.js` also loads the other Bootstrap plugins and data APIs for standard controls such as collapse and dropdown. Tooltips and popovers require explicit initialization when used.

## Requests and calculations

Scryfall requests use `fetch` directly. Autocomplete waits briefly after typing to avoid a request on every keystroke. `AbortController` cancels obsolete requests or work belonging to a closed modal. Printing searches use exact names, paper cards, and pagination.

Trade fetches market estimates for both sides, shows lookup status and checked times, and offers Refresh prices. Manage Card also displays a refreshed market estimate alongside its editable purchase cost. Trade totals calculate in cents before formatting as dollars. Missing prices prevent a complete comparison. The estimates do not account for condition or establish whether a trade is fair.

## Styles

Shared theme, navigation, form, and trade styles live in `src/assets/scss/`. Component-specific styles stay in `<style scoped lang="scss">` blocks. `scoped` limits selectors to that component’s markup; it is not Shadow DOM. `:deep(...)` intentionally reaches child content, such as the form inside ModalWrapper’s slot.

Bootstrap utilities such as `d-flex`, `gap-2`, and `btn` come from Bootstrap. Classes such as `app-layout` and `dialog-form` belong to this project. Vite compiles SCSS automatically; no separate file watcher is required.

## Configuration and generated files

JSON does not allow comments, so configuration fields are explained here instead of inserting invalid syntax into those files.

| File | What its settings do |
| --- | --- |
| `package.json` | Names the app, lists its dependencies, and defines npm commands. `private: true` prevents accidental npm publication; it does not control GitHub visibility. |
| `package-lock.json` | npm’s generated record of resolved dependency versions. Commit it for reproducible installations; let npm update it. |
| `vite.config.mjs` | Enables Vue single-file component compilation. `base: "./"` produces relative asset paths for deployment beneath a repository URL. |
| `.prettierrc.json` | `printWidth: 100` is the formatter’s preferred line length, not a hard limit. `bracketSameLine: true` keeps the closing opening-tag bracket on the last attribute line. `htmlWhitespaceSensitivity: "ignore"` lets Prettier format HTML without preserving layout based on inline whitespace. Check explicitly spaced inline text after formatting. |
| `.gitignore` | Excludes installed dependencies, generated builds, macOS metadata, and local IDE preferences from new Git tracking. It does not untrack files already committed. |
| `index.html` | Supplies the page language, encoding, mobile viewport, title, Vue mount element, and module entry point. |

### npm commands and dependencies

- `npm run dev`: starts Vite’s development server with hot updates.
- `npm run build`: compiles the app into `dist/` for deployment.
- `npm run preview`: serves an existing production build locally for inspection; build first.
- `bootstrap`: bundled CSS and JavaScript UI plugins.
- `vue`: reactive state and component rendering.
- `vue-router`: page navigation and route matching.
- `vite` and `@vitejs/plugin-vue`: development and build tooling.
- `sass`: compiles SCSS while Vite processes styles.

Dependencies marked with `^` allow compatible updates within their declared major version when resolving versions; the lockfile records the exact installed resolution. Sass currently has an exact version specified.

`node_modules/`, `dist/`, and IDE-generated files are not hand-documented source. Edit the source and configuration rather than generated outputs.

### Shared SCSS files

- `_variables.scss`: reusable Sass values; importing this file alone emits no CSS.
- `_navigation.scss`: the full-height page layout, active links, desktop navigation, and fixed mobile navigation. Bottom padding keeps content clear of the mobile bar.
- `_forms.scss`: consistent dialog sections, numbered headings, and checkbox labels. Nesting under `.dialog-form` limits where these rules apply.
- `_trade.scss`: comparison columns, card rows, and mobile stacking. Local rules in `TradeView.vue` add direction and status accents.
- `main.scss`: includes shared styles once, reserves bottom space on pages with floating Add actions, and defines the `v-cloak` hiding rule.

The leading underscore marks a Sass partial intended for inclusion by another stylesheet. `@use "variables" as theme` makes values available as `theme.$accent-color`. In nested SCSS, `&` refers to the surrounding selector: `.site-nav-link { &.is-active { ... } }` targets an element carrying both classes.
