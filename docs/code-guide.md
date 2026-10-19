# Reading and presenting the collection manager

## What changed and why

The main source of confusion was hidden data ownership: dialogs imported mutable
store arrays directly, so their inputs and effects were hard to see from their parents.
App.vue now owns saved cards and binders, pages receive props, and forms emit changes.

The folders separate routed pages, UI components, data models, and supporting code.
Only components have subject subfolders. This gives each kind of file a predictable
home while keeping related dialogs and controls together.

Stores are legitimate: Vue documents both lifting state into a common parent and
using a shared store. For this three-page application, explicit props and events make
the relationships easier to learn and present. If forwarding them becomes cumbersome
as the app grows, a store with named actions is worth reconsidering.

References: [Vue state management](https://vuejs.org/guide/scaling-up/state-management.html)
and [one-way props](https://vuejs.org/guide/components/props.html#one-way-data-flow).

## Folder map

```text
src/
  main.js                 Mount Vue, Bootstrap, styles, and router
  App.vue                 Shared layout, saved data, and mutation handlers
  router.js               Map URLs to the three pages
  views/                  CollectionView, BindersView, and TradeView
  components/
    cards/                Card display, search, and dialogs
    binders/              Binder dialogs, options, and quantity picker
    trade/                Trade selection dialogs
    shared/               ModalWrapper and FloatingAddButton
  models/                 Card, CollectionEntry, and TradeEntry classes
  services/               Storage, saved-data validation, and Scryfall requests
  utils/                  Collection merging and binder allocation rules
  data/                   Starter examples and shared condition/finish choices
  styles/                 Theme, navigation, forms, and trade styles
```

Start at a page in `views/` to find its components. Reusable UI lives under
`components/`, grouped by the subject it displays. Generic UI belongs in `shared/`.
Models describe data, services handle storage or external data access, and utilities
contain shared rules. Avoid adding more subfolders until a real grouping is needed.

`CollectionCardRow.vue` renders a row. `CollectionEntry.js` describes owned card data.
Their names distinguish the UI from the model. `Card.js` supplies shared printing
fields; `CollectionEntry` and `TradeEntry` extend it with owned or incoming-copy fields.
Constructors do not fetch or save. JSON restores plain objects; the UI reads their
fields and does not require class methods or `instanceof` checks.

## The data flow

```text
App.vue: collectionCards and binders refs
    | props
    v
CollectionView / BindersView / TradeView
    | props
    v
Dialogs: local editable drafts
    | named events, forwarded by their parent
    v
App.vue: apply changes -> watchers -> services/storage.js -> localStorage
```

Only `App.vue` changes the saved collection and binder arrays. Pages own navigation,
search, sorting, and dialog visibility. Forms validate local drafts, then emit changes.
Cancel discards a draft. A prop containing an object is still a shared reference,
so forms must copy editable fields rather than mutate the prop's nested properties.

| Event           | Payload                                    | Root action                                   |
| --------------- | ------------------------------------------ | --------------------------------------------- |
| `add-cards`     | Array of new owned entries                 | Merge compatible entries or append new ones   |
| `update-card`   | Edited card copy with `entryId`            | Update the existing owned entry               |
| `delete-card`   | `entryId`                                  | Remove that owned entry                       |
| `save-binder`   | Binder with `id`, name, description, color | Create or edit the binder                     |
| `delete-binder` | Binder ID                                  | Remove the binder and release its allocations |

Vue component events do not automatically bubble. The forwarding handlers in pages
and `CardDetailsModal` deliberately pass each event to the next parent. `RouterView`'s
slot exposes the matched page component; `App.vue` supplies that component's props
and listens to its events.

Trade's giving/receiving lists stay inside `TradeView`. They are temporary proposals;
editing their quantities never changes owned cards. Leaving the page resets the draft.
The price service keeps a shared, temporary request cache so several card displays
can reuse a quote. It does not own or persist the user's collection.

## A five-minute presentation

1. Open `main.js`, then `router.js`: explain mounting and the three hash routes.
2. Open `App.vue`: point to the two refs, page props, event handlers, and watchers.
3. Open `views/CollectionView.vue`: explain filtering, row props, and opening an overview.
4. Follow `CardDetailsModal.vue` to `ManageCardModal.vue`: show local draft fields,
   validation, `emit('update-card', card)`, and event forwarding back to `App.vue`.
5. Save an edit, navigate to Binders, and reload: the same owned data survives routing
   and is restored from browser storage. Show `services/storage.js` last.

For adding, follow `AddCardModal` -> `add-cards` -> `App.addCards` ->
`utils/addCards.js`. Merging respects printing, finish, condition,
and purchase cost while preserving binder allocations.

For binder quantities, follow `BinderQuantityModal` -> `update-card` -> `App.updateCard`.
`utils/binderAssignments.js` contains the allocation rules shared by the forms.
Favorites is calculated from each card's flag; it does not reserve copies.

## Vue vocabulary

| Syntax                    | Purpose                                                             |
| ------------------------- | ------------------------------------------------------------------- |
| `ref(value)`              | Reactive local state; JavaScript uses `.value`, templates unwrap it |
| `computed(() => ...)`     | A value derived from reactive inputs                                |
| `watch(source, callback)` | A side effect such as saving changed data                           |
| `defineProps(...)`        | Declare inputs from the parent                                      |
| `defineEmits(...)`        | Declare events sent to the parent                                   |
| `:card="entry"`           | Pass the actual entry object as a prop                              |
| `@update-card="handler"`  | Handle a child's event                                              |
| `v-model` / `defineModel` | Bind form input or a child control to a local draft                 |
| `v-if`                    | Mount or remove a component; reopening forms creates fresh drafts   |
| `nextTick()`              | Wait for Vue to finish updating the rendered components             |

See the [card overview guide](card-overview-guide.md) for image and overview details.

## Persistence and boundaries

The storage keys remain `collection-manager:cards` and `collection-manager:binders`.
No migration is needed. Missing keys start with sample cards or no binders; a saved
empty array stays empty. `services/savedData.js` validates entry IDs, names, quantities,
conditions, optional fields, and assignment shapes without modifying saved records.
Older optional fields and overlapping legacy memberships remain supported.

`loadSavedArray` returns `{ data, error, raw }`. Invalid JSON, bad records, and storage
read failures return an empty list plus an error. If either list has an error, App.vue
pauses both saves and shows a warning. The original strings stay in browser storage.
The download contains those exact strings under the two storage keys, including
malformed JSON, so it can be inspected and repaired. It is a recovery copy, not an
import format; the app does not currently provide a restore/import screen. Reload
after repairing storage. Edits made during the paused session are not saved.

Write failures show a warning. A later data change retries saving; the two storage
keys are separate writes, not a database transaction.

`entryId` identifies an owned row; `scryfallId` identifies an exact printing.
`binderQuantities` maps binder IDs to copy counts. The compatibility `binderIds` field
is kept in sync. Legacy overlapping memberships remain visible for manual review.
Purchase cost is optional and separate from Scryfall market estimates; zero is a
valid cost and missing cost is `null`.

Do not add another folder just to hold one helper. Extract a component for a meaningful
UI responsibility or reuse; extract a helper for shared domain rules. If persistent
state grows substantially, reconsider a store with explicit actions rather than
continuing to expand the root indefinitely.

## Reading conventions

Component scripts put imports and props/emits first, followed by local state,
derived values, event handlers, and watchers/lifecycle setup. Blank lines separate
related pieces without creating a new file for every calculation.

Shared models and helpers use JSDoc for data shapes, parameters, return values,
and mutation behavior. `CollectionEntryData` lives in `models/CollectionEntry.js`;
sample data imports that type. These comments help the editor and reader, but do
not validate stored data at runtime.

On the Trade page, `offeredEntries` joins the giving draft to owned cards,
`offeredTotal` is its known market subtotal, and `receivedTotal` is the incoming
subtotal. Missing-price counts and quantity-validation names identify their side.

## Shared requests and tests

`data/cardOptions.js` defines the condition choices and finish labels used by forms.
`services/cardPrintings.js` handles the exact-name request, pagination, and cancellation
for Add Card and Trade Receive. Each form retains its own AbortController, loading/error
state, and selected printing. The service returns a complete list or throws; callers
ignore cancelled results so older searches cannot replace newer choices.

Run `npm test` for the committed tests in `tests/`. They use Node's test runner and
mock storage/network access, so they cannot alter your browser collection. They cover
allocation and merging rules, malformed and legacy saved data, and printing requests.
