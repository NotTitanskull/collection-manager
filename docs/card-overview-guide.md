# Reading the card overview components

Start with [CardImagePreview.vue](../src/components/cards/CardImagePreview.vue), then read
[CardDetailsModal.vue](../src/components/cards/CardDetailsModal.vue). The first component
handles the image. The second handles the overview and navigation to the existing forms.

The blank lines in these files separate related pieces of code. Indentation shows which
statements belong inside a function, condition, HTML element, or CSS rule. This source
spacing is different from CSS `padding`, which adds space inside an element on screen.

## The three Vue tools

```js
import { computed, ref, watch } from 'vue';
```

This imports three functions from the installed Vue package. Importing them does not
create any state by itself; calling them does.

### `ref`: a value Vue can track

```js
const fallback = ref(false);

fallback.value = true;
```

`false` is the starting value inside the ref. The ref is a container, not a reference to
some other variable named `false`. `const` keeps the container from being reassigned;
the value inside it can still change.

Vue tracks reads and writes to `.value`. An ordinary `let fallback = false` would store
the same Boolean, but changing it would not notify Vue to update the interface.

In JavaScript we use `fallback.value`. In a Vue template, Vue unwraps this top-level ref
for us, so we can write `fallback` directly.

Not every variable needs a ref. For example, the overview's normalized `name` is fixed
for that opening of the modal, so it is an ordinary constant.

### `computed`: a calculated value

```js
const quantity = ref(2);
const price = ref(5);
const total = computed(() => quantity.value * price.value);

console.log(total.value); // 10

quantity.value = 3;
console.log(total.value); // 15
```

Vue tracks the reactive values read by the computation. When one changes, the cached
result becomes outdated. Vue calculates a fresh result when it is next needed. If the
dependencies have not changed, Vue can reuse the cached result.

In the image component, `source` calculates which URL to use from the card image and
the fallback state. In the overview, computed values supply the matching entries,
copy count, variant count, total value, and printing caption.

Computed getters should calculate and return values. Fetching data or changing state
belongs elsewhere.

### `watch`: do something when a value changes

```js
watch(
  () => props.card.image,
  () => {
    fallback.value = false;
    unavailable.value = false;
  },
);
```

The first function tells Vue what to watch. The second function tells Vue what to do
when that value changes. This watcher clears the previous image's error state when
another image is selected. It does not run immediately by default.

The overview's market watcher includes `{ immediate: true }`, so its callback runs
once on setup as well as when the watched printing IDs change. That callback requests
quotes; the market service handles caching and duplicate requests.

## Reading `CardImagePreview.vue`

Read its JavaScript in this order:

1. **Inputs and event:** the parent passes `card` and `full`; the image emits `preview`.
2. **Image state:** `fallback` chooses the saved URL; `unavailable` shows the missing-image
   message if loading fails. Both start at `false`.
3. **Button reference:** `trigger` starts at `null`. Vue assigns the rendered image button
   through `ref="trigger"`. This is a DOM reference, not a Boolean state value.
4. **Computed URL:** use a larger rendition for Scryfall URLs, while preserving other
   providers and falling back to the saved URL if necessary.
5. **Error handler:** try the saved URL once; if that fails too, display the message.
6. **Watcher:** clear the error state when the selected image URL changes.
7. **Exposed focus method:** allow the parent to focus the preview button when returning
   from the full-image view. `?.` skips the call if the button is not rendered.

The template has three mutually exclusive branches: a missing-image message, the full
image with an original-image link, or the clickable preview. The preview reports a click;
the parent decides how to navigate.

The CSS separates normal preview sizing from full-image sizing:

| Rule | Purpose |
| --- | --- |
| `width: min(100%, 16rem)` | Limit the preview button to its container width or 16 root-font units, whichever is smaller. |
| `max-height: 36dvh` | Limit the preview image to 36% of the dynamic viewport height. |
| `margin-inline: auto` | Center the preview image horizontally in the button. |
| `:focus-visible` | Show an outline when the button needs a visible focus indicator. |
| `calc(100dvh - 12rem)` | Give the full image a larger height allowance while reserving room for modal controls. |
| `object-fit: contain` | Fit the complete image without cropping it. |
| `@media (max-height: 700px)` | Reduce ordinary preview size and padding in short windows. |

`rem` depends on the root font size, commonly 16px. `dvh` depends on the current viewport
height. These are maximum dimensions, not a command to stretch every image to that size.

## Reading `CardDetailsModal.vue`

The component owns navigation state: `selected` is the card being previewed, `editing`
is the entry in the original editor, `adding` chooses Add Card, and `fullImage` chooses
the reading view. The original editor still owns its own unsaved form values.

The `entries` computation groups saved entries by their trimmed, lowercase card name.
It reads the shared collection without making another saved collection.

The copy count adds each entry's quantity. The variant count creates a unique key from
printing ID, finish, and condition. `Set` counts each combination once. Entries with
different purchase prices can remain separate editable rows even if their variant key
is the same.

The market total adds price per copy multiplied by quantity. If any price is unavailable,
the total is unavailable too; missing prices are not counted as zero-dollar cards.

The template's `v-if` / `v-else-if` / `v-else` chain mounts only one dialog at a time.
Closing Add Card or Manage Card returns to the overview. Removing the last matching
entry closes the overview because there is no remaining card to show.

The navigation functions use `await nextTick()` before focusing a control. Vue batches
render updates, so a newly displayed button may not exist immediately after changing
a ref. `nextTick()` waits for that render update.

The Edit buttons are stored in a `Map` by `entryId`, allowing focus to return to the
specific edited row. The map tracks buttons, not copy quantities or saved cards.

## Following an image click

1. The preview button emits `preview`.
2. The parent handles it with `showImage()`.
3. `showImage()` sets `fullImage.value` to `true`.
4. Vue passes `full` to the image component and hides the variant section.
5. After the render update, focus moves to Back to card.
6. Clicking Back clears `fullImage` and restores focus to the preview button.

The existing Bootstrap modal wrapper continues to handle the backdrop, Escape,
focus trapping, and page scroll locking.

## The card constructors

[Card.js](../src/models/Card.js) supplies shared printing information.
[CollectionEntry.js](../src/models/CollectionEntry.js) adds the copies you own, while
[TradeEntry.js](../src/models/TradeEntry.js) adds incoming trade details.

```js
const sample = new CollectionEntry(printing, {
  entryId: 'sample-1',
  condition: 'Near Mint',
  quantity: 1,
  isFoil: true,
});
```

`new` creates a separate object. `extends Card` shares the printing setup, and
`super(printing)` runs the base constructor before the subclass assigns its fields.
`this` refers to that same new object throughout both constructors.

The second argument supplies optional copy details. For example,
`this.quantity = options.quantity ?? 1` uses the supplied quantity, defaulting to 1
only when it is null or undefined. Fixed sample IDs are preserved; normal entries
receive generated IDs. Binder arrays and quantity maps are copied for each owned card.

Constructors do not make objects reactive or save them. Vue tracks them when they
enter reactive state. JSON loading returns plain objects, which remain supported
because the app uses their fields rather than class identity or methods. The store
clones samples before using them so edits cannot modify the starting examples.
