<script setup>
import ConditionBadge from './ConditionBadge.vue';
// The overview owns navigation; the original editor still owns each entry's draft.
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';

import ModalWrapper from '../ui/ModalWrapper.vue';
import CardImagePreview from './CardImagePreview.vue';
import ManageCardModal from './ManageCardModal.vue';
import AddCardModal from './AddCardModal.vue';

import { collectionCards } from '../../stores/collection.js';
import {
  marketPrice,
  marketState,
  printingDetails,
  refreshMarketPrice,
} from '../../services/marketPrices.js';

const props = defineProps({ card: { type: Object, required: true } });
const emit = defineEmits(['close']);

// Keep the original name as the group identity, even when its preview changes.
const name = props.card.name.trim().toLowerCase();

// Reactive navigation state. Changing a ref tells Vue which view to render.
const selected = ref(props.card);
const editing = ref(null);
const adding = ref(false);
const fullImage = ref(false);

// Template refs hold rendered controls so we can restore keyboard focus.
const image = ref(null);
const backButton = ref(null);
const addButton = ref(null);

// Map entry IDs to their Edit buttons. This tracks DOM controls, not collection data.
const editButtons = new Map();
const opener = document.activeElement;

// Derived values update when the shared collection or market quotes change.
const entries = computed(() =>
  collectionCards.value.filter((entry) => entry.name.trim().toLowerCase() === name),
);

// Older entries have isFoil; newer entries have an explicit finish value.
const finish = (entry) => entry.finish ?? (entry.isFoil ? 'foil' : 'nonfoil');

const finishLabel = (entry) =>
  ({ nonfoil: 'Nonfoil', foil: 'Foil', etched: 'Etched foil' })[finish(entry)] ?? finish(entry);

const copies = computed(() => entries.value.reduce((sum, entry) => sum + entry.quantity, 0));

// Conditions are variants too; separate purchase-cost records retain their own Edit buttons.
// Set removes duplicate combinations; JSON.stringify makes each combination a string key.
const variants = computed(
  () =>
    new Set(
      entries.value.map((entry) =>
        JSON.stringify([entry.scryfallId, finish(entry), entry.condition]),
      ),
    ).size,
);

const loading = computed(() =>
  entries.value.some((entry) => marketState(entry).status === 'loading'),
);

// A missing price makes the total unknown rather than treating that card as free.
const total = computed(() =>
  entries.value.some((entry) => marketPrice(entry) == null)
    ? null
    : entries.value.reduce((sum, entry) => sum + marketPrice(entry) * entry.quantity, 0),
);

const details = computed(() => printingDetails(selected.value));

// Remove missing fields before joining them, avoiding empty commas in the caption.
const metadata = computed(() =>
  [
    details.value.setCode,
    details.value.collectorNumber ? '#' + details.value.collectorNumber : '',
    details.value.rarity,
  ]
    .filter(Boolean)
    .join(', '),
);

// Fetch quotes when the printing IDs change, including when the overview first opens.
// The price service handles request deduplication and its own cache.
watch(
  () => entries.value.map((entry) => entry.scryfallId).join('|'),
  () => entries.value.forEach((entry) => refreshMarketPrice(entry)),
  { immediate: true },
);

/** Return after Save, Cancel, or removal in the original entry editor. */
async function returnFromEdit() {
  const id = editing.value.entryId;
  editing.value = null;

  if (!entries.value.length) {
    emit('close');
    return;
  }

  if (!entries.value.some((entry) => entry.entryId === selected.value.entryId)) {
    selected.value = entries.value[0];
  }

  // Wait for Vue to render the overview before trying to focus its controls.
  await nextTick();
  (editButtons.get(id) ?? addButton.value)?.focus();
}

/** Add Card owns its draft; closing it reveals the updated overview. */
async function returnFromAdd() {
  adding.value = false;
  await nextTick();
  addButton.value?.focus();
}

async function showImage() {
  fullImage.value = true;
  await nextTick();
  backButton.value?.focus();
}

async function hideImage() {
  fullImage.value = false;
  await nextTick();
  image.value?.focus();
}

/** Change the preview only; this does not edit any saved card fields. */
async function previewPrinting(entry) {
  selected.value = entry;
  await nextTick();
  image.value?.focus();
}

// Return to the original collection trigger after the modal has been removed.
onBeforeUnmount(() =>
  nextTick(() => {
    if (opener?.isConnected) opener.focus();
  }),
);
</script>

<template>
  <!-- One dialog at a time: entry editor, Add Card, or the overview. -->
  <ManageCardModal v-if="editing" :card="editing" @close="returnFromEdit" />
  <AddCardModal v-else-if="adding" :initial-card="selected" @close="returnFromAdd" />
  <ModalWrapper
    v-else
    class="card-details-modal"
    :large="fullImage"
    aria-labelledby="card-details-title"
    @close="emit('close')"
  >
    <div class="modal-content">
      <div class="modal-header">
        <h2 id="card-details-title" class="modal-title fs-5">
          {{ fullImage ? selected.name : 'Card details' }}
        </h2>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>

      <div class="modal-body p-0">
        <CardImagePreview ref="image" :card="selected" :full="fullImage" @preview="showImage" />
        <section v-if="!fullImage" class="details-content" aria-labelledby="selected-card-name">
          <h3 id="selected-card-name" class="h4 fw-bold mb-1">{{ selected.name }}</h3>
          <p class="text-secondary text-capitalize mb-4">{{ metadata || selected.printing }}</p>

          <div class="collection-summary">
            <div>
              <p class="mb-1 fw-semibold">
                Total value:
                <span role="status" :class="{ 'text-success': total != null && !loading }">{{
                  loading ? 'Loading…' : total == null ? 'Unavailable' : '$' + total.toFixed(2)
                }}</span>
              </p>
              <p class="small mb-0">
                <strong>{{ variants }} {{ variants === 1 ? 'variant' : 'variants' }}</strong> ·
                {{ copies }} {{ copies === 1 ? 'copy' : 'copies' }}
              </p>
            </div>
            <button
              ref="addButton"
              type="button"
              class="btn btn-primary rounded-pill d-inline-flex align-items-center gap-2"
              @click="adding = true"
            >
              Add another
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                aria-hidden="true"
              >
                <path d="M9 3v12M3 9h12" />
              </svg>
            </button>
          </div>

          <!-- Stable entry IDs keep each Edit button tied to the correct saved record. -->
          <ul class="list-unstyled mb-0" aria-label="Owned variants">
            <li v-for="(entry, index) in entries" :key="entry.entryId" class="variant-row">
              <strong class="variant-quantity">{{ entry.quantity }}×</strong>
              <div class="variant-description">
                <p class="small mb-1">
                  <span :class="{ 'text-primary': finish(entry) !== 'nonfoil' }">{{
                    finishLabel(entry)
                  }}</span>
                  · <ConditionBadge :condition="entry.condition" />
                </p>
                <p v-if="entry.scryfallId !== selected.scryfallId" class="small mb-1">
                  <button
                    type="button"
                    class="printing-link"
                    :aria-label="`Preview ${entry.printing}, row ${index + 1}`"
                    @click="previewPrinting(entry)"
                  >
                    {{ entry.printing }}
                  </button>
                </p>
                <p class="small mb-0">
                  <strong>Market price:</strong>
                  <span :class="{ 'text-success': marketPrice(entry) != null }">{{
                    marketState(entry).status === 'loading'
                      ? 'Loading…'
                      : marketPrice(entry) == null
                        ? 'Unavailable'
                        : '$' + marketPrice(entry).toFixed(2) + ' ea.'
                  }}</span>
                </p>
              </div>
              <button
                :ref="
                  (el) =>
                    el ? editButtons.set(entry.entryId, el) : editButtons.delete(entry.entryId)
                "
                type="button"
                class="btn btn-outline-secondary rounded-pill variant-edit"
                :aria-label="`Edit ${finishLabel(entry)}, ${entry.condition}, row ${index + 1}`"
                @click="editing = entry"
              >
                Edit
              </button>
            </li>
          </ul>

          <p class="small text-secondary mb-0 mt-3">
            USD market estimates. Prices do not account for condition.
          </p>
        </section>
      </div>

      <div class="modal-footer">
        <button
          v-if="fullImage"
          ref="backButton"
          type="button"
          class="btn btn-outline-secondary"
          @click="hideImage"
        >
          Back to card
        </button>
        <button v-else type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
          Close
        </button>
      </div>
    </div>
  </ModalWrapper>
</template>

<style scoped>
/* Keep the overview narrow; the full-image view can use Bootstrap's larger dialog. */
.card-details-modal :deep(.modal-dialog:not(.modal-lg)) {
  max-width: 36rem;
}

.details-content {
  padding: 1.5rem;
}

/* Totals and Add another share a row; variants use a quantity / details / Edit row. */
.collection-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--bs-border-color);
}

.collection-summary > button {
  flex-shrink: 0;
}

.variant-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.125rem 0;
  border-bottom: 1px solid var(--bs-border-color);
}

.variant-quantity {
  min-width: 2rem;
}

.variant-description {
  flex: 1;
  min-width: 0;
  border-left: 1px solid var(--bs-border-color);
  padding-left: 0.75rem;
  overflow-wrap: anywhere;
}

.variant-edit {
  flex-shrink: 0;
  min-height: 2.75rem;
  padding-inline: 1rem;
}

.printing-link {
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--bs-secondary-color);
  text-align: left;
  text-decoration: underline;
}

/* Reduce spacing on phones, then stack the summary only on very narrow screens. */
@media (max-width: 575.98px) {
  .details-content {
    padding: 1.25rem 1rem;
  }
  .collection-summary {
    gap: 0.5rem;
  }
  .collection-summary > button {
    font-size: 0.875rem;
    padding-inline: 0.875rem;
  }
}

@media (max-width: 359.98px) {
  .collection-summary {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.875rem;
  }
  .variant-row {
    gap: 0.5rem;
  }
  .variant-edit {
    padding-inline: 0.75rem;
  }
}
</style>
