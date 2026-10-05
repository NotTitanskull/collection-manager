<script setup>
// Edits a copy of the selected entry so Cancel leaves the saved collection unchanged.
import ModalWrapper from "./ModalWrapper.vue";
import { computed, ref, watch } from "vue";
import { collectionCards } from "../../stores/collection.js";
import { marketPrice, marketState, marketNote, refreshMarketPrice } from "../../services/marketPrices.js";
import BinderPicker from "../BinderPicker.vue";

const props = defineProps({
  card: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["close"]);
const condition = ref("");
const quantity = ref(1);
const purchasePrice = ref("");
const favorite = ref(false);
const trade = ref(false);
const confirmingRemoval = ref(false);
const binderIds = ref([]);

const conditions = [
  "Near Mint",
  "Lightly Played",
  "Moderately Played",
  "Heavily Played",
  "Damaged",
];

const canSave = computed(
  () =>
    props.card &&
    conditions.includes(condition.value) &&
    Number.isInteger(quantity.value) &&
    quantity.value > 0 &&
    (purchasePrice.value === "" || (Number.isFinite(purchasePrice.value) && purchasePrice.value >= 0)),
);

// Copy the prop into editable fields; copy binderIds so checkboxes do not mutate saved data.
function resetForm() {
  if (!props.card) return;

  condition.value = props.card.condition;
  quantity.value = props.card.quantity;
  purchasePrice.value = props.card.purchasePrice ?? "";
  favorite.value = Boolean(props.card.favorite);
  trade.value = Boolean(props.card.trade);
  confirmingRemoval.value = false;
  binderIds.value = [...(props.card.binderIds ?? [])];
}

// Find the owned entry by entryId and apply only the editable fields.
function saveChanges() {
  if (!canSave.value) return;

  const card = collectionCards.value.find((entry) => entry.entryId === props.card.entryId);

  if (!card) return;

  card.condition = condition.value;
  card.quantity = quantity.value;
  card.purchasePrice = purchasePrice.value === "" ? null : purchasePrice.value;
  card.favorite = favorite.value;
  card.trade = trade.value;
  card.binderIds = [...binderIds.value];

  emit("close");
}

// Delete the selected owned entry only after the confirmation step.
function removeCard() {
  if (!props.card || !confirmingRemoval.value) return;
  const index = collectionCards.value.findIndex((entry) => entry.entryId === props.card.entryId);
  if (index === -1) return;
  collectionCards.value.splice(index, 1);
  emit("close");
}

const currentMarketPrice = computed(() => marketPrice(props.card));
watch(() => props.card?.scryfallId, () => refreshMarketPrice(props.card), { immediate: true });
resetForm();
</script>

<template>
  <ModalWrapper aria-labelledby="manage-card-title" id="manage-card-modal" large @close="emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2 id="manage-card-title" class="modal-title fs-5">Manage Card</h2>

        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>

      <div v-if="card" class="modal-body dialog-form">
        <section class="form-section card-summary" aria-label="Selected card">
          <img v-if="card.image" :src="card.image" :alt="card.name" />
          <div>
            <h3 class="h5 mb-1">{{ card.name }}</h3>
            <p class="small text-secondary mb-1">{{ card.type }}</p>
            <p class="small text-secondary mb-2">{{ card.printing }}</p>
            <span class="badge text-bg-light">
              {{ card.finish === "etched" ? "Etched foil" : card.isFoil ? "Foil" : "Nonfoil" }}
            </span>
          </div>
        </section>

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
              <label for="manage-quantity" class="form-label">Quantity</label>
              <input
                id="manage-quantity"
                v-model.number="quantity"
                type="number"
                min="1"
                step="1"
                class="form-control" />
            </div>
          </div>
          <div class="mt-3">
            <BinderPicker v-model="binderIds" />
          </div>
          <div class="mt-3">
            <label for="manage-purchase-price" class="form-label">Purchase price per copy (USD, optional)</label>
            <div class="input-group">
              <span class="input-group-text">$</span>
              <input
                id="manage-purchase-price"
                v-model.number="purchasePrice"
                type="number"
                min="0"
                step="0.01"
                class="form-control"
                placeholder="Not recorded" aria-describedby="purchase-price-help" />
            </div>
            <p id="purchase-price-help" class="form-text mb-0">
              Leave blank for cards from packs, gifts, or when the cost is unknown.
            </p>
          </div>
          <div class="mt-3">
            <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
              <div>
                <strong class="d-block">Market estimate per copy</strong>
                <span>{{ currentMarketPrice == null ? 'Unavailable' : '$' + currentMarketPrice.toFixed(2) }}</span>
              </div>
              <button type="button" class="btn btn-outline-secondary btn-sm"
                :disabled="marketState(card).status === 'loading'"
                @click="refreshMarketPrice(card, { force: true })">Refresh price</button>
            </div>
            <p class="form-text mb-0" role="status">
              <span class="d-block">{{ marketNote(card) }}</span>
              Estimates do not account for condition.
            </p>
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
                class="form-check-input" />
            </label>
            <label class="option-control" for="manage-trade">
              <span>
                <strong>Available for trade</strong>
                <small>Mark these copies as available for trading.</small>
              </span>
              <input id="manage-trade" v-model="trade" type="checkbox" class="form-check-input" />
            </label>
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
              @click="confirmingRemoval = false">
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
          @click="confirmingRemoval = true">
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

<style scoped lang="scss">
// Keep the selected card preview and its identifying text together.
.card-summary {
  display: flex;
  align-items: center;
  gap: 1rem;

  img {
    width: 5rem;
    flex-shrink: 0;
    border-radius: 0.375rem;
  }

  > div {
    min-width: 0;
    overflow-wrap: anywhere;
  }
}
</style>
