<script setup>
// Builds a temporary draft, looks up a printing, then saves owned entries to the collection.
import ModalWrapper from './ModalWrapper.vue';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import CardSearch from '../CardSearch.vue';
import BinderPicker from '../BinderPicker.vue';
import { rememberMarketPrinting } from '../../services/marketPrices.js';
import { collectionCards } from '../../stores/collection.js';

const conditions = [
  'Near Mint',
  'Lightly Played',
  'Moderately Played',
  'Heavily Played',
  'Damaged',
];

/** Create a stable row ID so Vue can track inputs when another row is removed. */
function createCopyRow() {
  return {
    id: crypto.randomUUID(),
    condition: 'Near Mint',
    quantity: 1,
    purchasePrice: '',
  };
}

/** Append another condition/quantity group to the unsaved form. */
function addCopyRow() {
  draft.value.copies.push(createCopyRow());
}

/** Remove the requested draft row, keeping at least one group available. */
function removeCopyRow(id) {
  if (draft.value.copies.length <= 1) return;

  draft.value.copies = draft.value.copies.filter((copy) => copy.id !== id);
}

// Local form state is separate from saved cards until Add Card is submitted.
const draft = ref({
  binderIds: [],
  name: '',
  printingId: '',
  copies: [createCopyRow()],
  finish: '',
  favorite: false,
  trade: false,
});

const printings = ref([]);
const loadingPrintings = ref(false);
const printingError = ref('');

let printingRequest;

/** Cancel an obsolete request and clear choices that belong to the previous card. */
function clearPrintings() {
  printingRequest?.abort();
  printings.value = [];
  draft.value.printingId = '';
  draft.value.finish = '';
  loadingPrintings.value = false;
  printingError.value = '';
}

/** Fetch paper printings for the exact selected name, including paginated results. */
async function loadPrintings(name) {
  clearPrintings();

  const request = new AbortController();
  printingRequest = request;
  loadingPrintings.value = true;

  const query = `!"${name}" game:paper`;
  let url =
    `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}` +
    '&unique=prints&order=released';

  const results = [];

  try {
    while (url) {
      if (request.signal.aborted) return;

      const response = await fetch(url, {
        signal: request.signal,
      });

      if (!response.ok) {
        throw new Error('Could not load printings.');
      }

      const result = await response.json();

      if (request.signal.aborted) return;

      results.push(...result.data);
      url = result.has_more ? result.next_page : null;

      if (url) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    if (!request.signal.aborted) {
      printings.value = results;
    }
  } catch (error) {
    if (!request.signal.aborted) {
      printingError.value = 'Could not load printings. Select the card again to retry.';
    }
  } finally {
    if (!request.signal.aborted) {
      loadingPrintings.value = false;
    }
  }
}

const selectedPrinting = computed(() =>
  printings.value.find((printing) => printing.id === draft.value.printingId),
);

const finishLabels = {
  nonfoil: 'Nonfoil',
  foil: 'Foil',
  etched: 'Etched foil',
};
const finishes = computed(() =>
  (selectedPrinting.value?.finishes ?? []).filter((finish) => finish in finishLabels),
);

// A different printing may support different finishes; choose an allowed default.
watch(selectedPrinting, () => {
  draft.value.finish = finishes.value[0] ?? '';
});

const emit = defineEmits(['close']);

const canAddCard = computed(() => {
  const printing = selectedPrinting.value;
  const finish = draft.value.finish;

  return (
    !loadingPrintings.value &&
    Boolean(printing?.finishes?.includes(finish)) &&
    draft.value.copies.length > 0 &&
    draft.value.copies.every(
      (copy) =>
        conditions.includes(copy.condition) && Number.isInteger(copy.quantity) && copy.quantity > 0 &&
        (copy.purchasePrice === '' || (Number.isFinite(copy.purchasePrice) && copy.purchasePrice >= 0)),
    )
  );
});

// Validate again, then combine matching condition and purchase-price groups.
function addCard() {
  if (!canAddCard.value) return;

  const printing = selectedPrinting.value;
  rememberMarketPrinting(printing);
  // Different purchase costs represent separate groups, even in the same condition.
  const groups = new Map();
  for (const copy of draft.value.copies) {
    const purchasePrice = copy.purchasePrice === '' ? null : copy.purchasePrice;
    const key = JSON.stringify([copy.condition, purchasePrice]);
    const group = groups.get(key) ?? { condition: copy.condition, purchasePrice, quantity: 0 };
    group.quantity += copy.quantity;
    groups.set(key, group);
  }

  const entries = Array.from(groups.values(), ({ condition, quantity, purchasePrice }) => ({
    entryId: crypto.randomUUID(),
    scryfallId: printing.id,
    name: printing.name,
    type: printing.type_line,
    printing:
      `${printing.set_name} — ${printing.set.toUpperCase()}` + ` #${printing.collector_number}`,
    image: printing.image_uris?.normal ?? printing.card_faces?.[0]?.image_uris?.normal ?? '',
    condition,
    quantity,
    finish: draft.value.finish,
    isFoil: draft.value.finish !== 'nonfoil',
    favorite: draft.value.favorite,
    trade: draft.value.trade,
    binderIds: [...draft.value.binderIds],
    purchasePrice,
  }));

  collectionCards.value.push(...entries);

  emit('close');
}

onBeforeUnmount(clearPrintings);
</script>
<template>
  <ModalWrapper aria-labelledby="add-card-title" id="add-card-modal" large @close="emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2 id="add-card-title" class="modal-title fs-5">Add Card</h2>

        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>

      <div class="modal-body dialog-form">
        <section class="form-section">
          <div class="section-heading">
            <div>
              <h3>Choose a card</h3>
              <p>Find the card and select its exact printing.</p>
            </div>
          </div>

          <CardSearch
            v-model="draft.name"
            class="mb-3"
            @update:model-value="clearPrintings"
            @select="loadPrintings"
          />

          <div>
            <label for="add-card-printing" class="form-label">Printing</label>

            <select
              id="add-card-printing"
              v-model="draft.printingId"
              class="form-select"
              :disabled="loadingPrintings || printings.length === 0"
            >
              <option value="">
                {{
                  loadingPrintings
                    ? 'Loading printings...'
                    : printings.length
                      ? 'Select a printing'
                      : 'Select a card first'
                }}
              </option>

              <option v-for="printing in printings" :key="printing.id" :value="printing.id">
                {{ printing.set_name }} — {{ printing.set.toUpperCase() }} #{{
                  printing.collector_number
                }}
              </option>
            </select>

            <p v-if="printingError" class="small text-danger mt-2" role="alert">
              {{ printingError }}
            </p>
          </div>
        </section>
        <section class="form-section">
          <div class="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-3">
            <div class="section-heading mb-0">
              <div>
                <h3>Copy details</h3>
                <p>Group copies by condition and purchase price.</p>
              </div>
            </div>

            <button type="button" class="btn btn-outline-primary btn-sm" @click="addCopyRow">
              + Add condition
            </button>
          </div>

          <p id="add-purchase-help" class="small text-secondary">Leave purchase price blank for cards from packs, gifts, or when the cost is unknown.</p>
          <div class="d-grid gap-3">
            <div v-for="(copy, index) in draft.copies" :key="copy.id" class="copy-fields">
              <div>
                <label :for="`copy-condition-${copy.id}`" class="form-label">Condition</label>
                <select
                  :id="`copy-condition-${copy.id}`"
                  v-model="copy.condition"
                  class="form-select"
                >
                  <option v-for="condition in conditions" :key="condition" :value="condition">
                    {{ condition }}
                  </option>
                </select>
              </div>

              <div>
                <label :for="`copy-quantity-${copy.id}`" class="form-label">Quantity</label>
                <input
                  :id="`copy-quantity-${copy.id}`"
                  v-model.number="copy.quantity"
                  type="number"
                  class="form-control"
                  min="1"
                  step="1"
                />
              </div>

              <div class="copy-purchase-price">
                <label :for="`copy-purchase-${copy.id}`" class="form-label">Purchase price per copy (USD, optional)</label>
                <input :id="`copy-purchase-${copy.id}`" v-model.number="copy.purchasePrice"
                  type="number" min="0" step="0.01" class="form-control"
                  placeholder="Not recorded" aria-describedby="add-purchase-help" />
              </div>
              <button
                type="button"
                class="btn btn-outline-secondary copy-remove"
                :disabled="draft.copies.length === 1"
                :aria-label="`Remove condition row ${index + 1}`"
                title="Remove condition row"
                @click="removeCopyRow(copy.id)"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
          </div>
        </section>
        <section class="form-section">
          <div class="section-heading">
            <div>
              <h3>Collection options</h3>
              <p>Add any special properties for this entry.</p>
            </div>
          </div>

          <div class="mb-3">
            <BinderPicker v-model="draft.binderIds" />
          </div>

          <div class="option-list">
            <div>
              <label for="add-card-finish" class="form-label">Finish</label>
              <select
                id="add-card-finish"
                v-model="draft.finish"
                class="form-select"
                :disabled="finishes.length < 2"
              >
                <option v-if="!finishes.length" value="">Select a printing first</option>
                <option v-for="finish in finishes" :key="finish" :value="finish">
                  {{ finishLabels[finish] }}
                </option>
              </select>
            </div>

            <label class="option-control" for="add-card-favorite">
              <span>
                <strong>Favorite</strong>
                <small>Show this card in the Favorites binder.</small>
              </span>
              <input
                id="add-card-favorite"
                v-model="draft.favorite"
                type="checkbox"
                class="form-check-input"
              />
            </label>

            <label class="option-control" for="add-card-trade">
              <span>
                <strong>Available for trade</strong>
                <small>Include this card on the Trade page.</small>
              </span>
              <input
                id="add-card-trade"
                v-model="draft.trade"
                type="checkbox"
                class="form-check-input"
              />
            </label>
          </div>
        </section>
      </div>

      <div class="modal-footer justify-content-between">
        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
          Cancel
        </button>

        <button type="button" class="btn btn-primary" :disabled="!canAddCard" @click="addCard">
          Add Card
        </button>
      </div>
    </div>
  </ModalWrapper>
</template>

<style scoped lang="scss">
// Arrange condition, quantity, and removal controls within each repeated draft row.
.copy-fields {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(5rem, 7rem) 2.75rem;
  align-items: end;
  gap: 0.75rem;

  > div {
    min-width: 0;
  }

  .copy-purchase-price {
    grid-column: 1 / -1;
    grid-row: 2;
  }

  .copy-remove {
    grid-column: 3;
    grid-row: 1;
    display: grid;
    place-items: center;
    min-height: 2.75rem;
    padding: 0;
    font-size: 1.4rem;
    line-height: 1;
  }
}
</style>
