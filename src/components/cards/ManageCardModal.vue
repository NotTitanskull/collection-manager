<script setup>
// Edits a copy of the selected entry so Cancel leaves the saved collection unchanged.
import ModalWrapper from '../ui/ModalWrapper.vue';
import { computed, ref, watch } from 'vue';
import { collectionCards } from '../../stores/collection.js';
import {
  marketPrice,
  marketState,
  marketNote,
  refreshMarketPrice,
} from '../../services/marketPrices.js';
import {
  binderAssignments,
  validAssignments,
  saveAssignments,
} from '../../utils/binderQuantities.js';
import CardSummary from './CardSummary.vue';
import BinderPicker from '../binders/BinderPicker.vue';

const props = defineProps({
  card: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['close']);
const condition = ref('');
const quantity = ref(1);
const purchasePrice = ref('');
const favorite = ref(false);
const trade = ref(false);
const confirmingRemoval = ref(false);
const binderQuantities = ref({});

const conditions = [
  'Near Mint',
  'Lightly Played',
  'Moderately Played',
  'Heavily Played',
  'Damaged',
];

const canSave = computed(
  () =>
    props.card &&
    conditions.includes(condition.value) &&
    Number.isInteger(quantity.value) &&
    quantity.value > 0 &&
    (purchasePrice.value === '' ||
      (Number.isFinite(purchasePrice.value) && purchasePrice.value >= 0)) &&
    validAssignments(binderQuantities.value, quantity.value),
);

// Copy the prop into editable fields; copy binder assignments so controls do not mutate saved data.
function resetForm() {
  if (!props.card) return;

  condition.value = props.card.condition;
  quantity.value = props.card.quantity;
  purchasePrice.value = props.card.purchasePrice ?? '';
  favorite.value = Boolean(props.card.favorite);
  trade.value = Boolean(props.card.trade);
  confirmingRemoval.value = false;
  binderQuantities.value = binderAssignments(props.card);
}

// Find the owned entry by entryId and apply only the editable fields.
function saveChanges() {
  if (!canSave.value) return;

  const card = collectionCards.value.find((entry) => entry.entryId === props.card.entryId);

  if (!card) return;

  card.condition = condition.value;
  card.quantity = quantity.value;
  card.purchasePrice = purchasePrice.value === '' ? null : purchasePrice.value;
  card.favorite = favorite.value;
  card.trade = trade.value;
  saveAssignments(card, binderQuantities.value);

  emit('close');
}

// Delete the selected owned entry only after the confirmation step.
function removeCard() {
  if (!props.card || !confirmingRemoval.value) return;
  const index = collectionCards.value.findIndex((entry) => entry.entryId === props.card.entryId);
  if (index === -1) return;
  collectionCards.value.splice(index, 1);
  emit('close');
}

const currentMarketPrice = computed(() => marketPrice(props.card));
watch(
  () => props.card?.scryfallId,
  () => refreshMarketPrice(props.card),
  { immediate: true },
);
resetForm();
</script>

<template>
  <ModalWrapper
    aria-labelledby="manage-card-title"
    id="manage-card-modal"
    large
    @close="emit('close')"
  >
    <div class="modal-content">
      <div class="modal-header">
        <h2 id="manage-card-title" class="modal-title fs-5">Manage Card</h2>

        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>

      <div v-if="card" class="modal-body dialog-form">
        <CardSummary :card="card" />

        <section class="form-section" aria-labelledby="manage-copy-heading">
          <div class="section-heading">
            <div>
              <h3 id="manage-copy-heading">Copy details</h3>
              <p>Update the copies represented by this entry.</p>
            </div>
          </div>
          <div class="copy-details">
            <div>
              <label for="manage-condition" class="form-label">Condition</label>
              <select id="manage-condition" v-model="condition" class="form-select">
                <option v-for="option in conditions" :key="option" :value="option">
                  {{ option }}
                </option>
              </select>
            </div>
            <div>
              <label for="manage-quantity" class="form-label">Copies owned</label>
              <input
                id="manage-quantity"
                v-model.number="quantity"
                type="number"
                min="1"
                step="1"
                class="form-control"
              />
            </div>
          </div>
        </section>

        <section class="form-section" aria-labelledby="manage-pricing-heading">
          <div class="section-heading">
            <div>
              <h3 id="manage-pricing-heading">Pricing</h3>
              <p>Your purchase cost and the current market estimate, per copy.</p>
            </div>
          </div>
          <div class="row g-3">
            <div class="col-12 col-md-6">
              <label for="manage-purchase-price" class="form-label"
                >Purchase price <span class="text-secondary small">(optional)</span></label
              >
              <div class="input-group">
                <span class="input-group-text">$</span>
                <input
                  id="manage-purchase-price"
                  v-model.number="purchasePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  class="form-control"
                  placeholder="Not recorded"
                  aria-describedby="purchase-price-help"
                />
              </div>
              <p id="purchase-price-help" class="form-text mb-0">
                USD per copy. Leave blank for packs, gifts, or unknown costs.
              </p>
            </div>
            <div class="col-12 col-md-6">
              <div class="bg-light rounded p-3 h-100">
                <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
                  <span class="text-secondary">Market estimate</span>
                  <button
                    type="button"
                    class="btn btn-outline-secondary btn-sm"
                    :disabled="marketState(card).status === 'loading'"
                    @click="refreshMarketPrice(card, { force: true })"
                  >
                    Refresh price
                  </button>
                </div>
                <strong class="d-block fs-5 mt-2">{{
                  currentMarketPrice == null ? 'Unavailable' : '$' + currentMarketPrice.toFixed(2)
                }}</strong>
                <p class="form-text mb-0" role="status">
                  <span class="d-block">{{ marketNote(card) }}</span>
                  Estimates do not account for condition.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section class="form-section" aria-labelledby="manage-options-heading">
          <div class="section-heading">
            <div>
              <h3 id="manage-options-heading">Collection options</h3>
              <p>Choose how you organize this entry.</p>
            </div>
          </div>
          <div class="option-list">
            <label class="option-control" for="manage-favorite">
              <span>
                <strong>Favorite</strong>
                <small>Mark this card as a favorite.</small>
              </span>
              <input
                id="manage-favorite"
                v-model="favorite"
                type="checkbox"
                class="form-check-input"
              />
            </label>
            <label class="option-control" for="manage-trade">
              <span>
                <strong>Available for trade</strong>
                <small>Mark these copies as available for trading.</small>
              </span>
              <input id="manage-trade" v-model="trade" type="checkbox" class="form-check-input" />
            </label>
          </div>
          <div class="border-top pt-3 mt-3">
            <BinderPicker v-model="binderQuantities" :owned-quantity="quantity" />
          </div>
        </section>

        <div v-if="confirmingRemoval" class="alert alert-danger mb-0" role="alert">
          <p>
            Remove all {{ card.quantity }} copies in this entry of
            <strong>{{ card.name }}</strong>
            ?
          </p>
          <div class="d-flex flex-wrap gap-2">
            <button
              type="button"
              class="btn btn-outline-secondary"
              @click="confirmingRemoval = false"
            >
              Keep card
            </button>
            <button type="button" class="btn btn-danger" @click="removeCard">
              Confirm removal
            </button>
          </div>
        </div>
        <button
          v-else
          type="button"
          class="btn btn-outline-danger"
          @click="confirmingRemoval = true"
        >
          Remove from collection
        </button>
      </div>

      <div class="modal-footer justify-content-between">
        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
          Cancel
        </button>
        <button type="button" class="btn btn-primary" :disabled="!canSave" @click="saveChanges">
          Save Changes
        </button>
      </div>
    </div>
  </ModalWrapper>
</template>
