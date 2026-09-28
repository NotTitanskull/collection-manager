<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import { collectionCards } from "../stores/collection.js";
import BinderPicker from "./BinderPicker.vue";

const props = defineProps({
  card: {
    type: Object,
    default: null,
  },
});

const modalElement = ref(null);
const condition = ref("");
const quantity = ref(1);
const price = ref("");
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
    (price.value === "" || (Number.isFinite(price.value) && price.value >= 0)),
);

function resetForm() {
  if (!props.card) return;

  condition.value = props.card.condition;
  quantity.value = props.card.quantity;
  price.value = props.card.price ?? "";
  favorite.value = Boolean(props.card.favorite);
  trade.value = Boolean(props.card.trade);
  confirmingRemoval.value = false;
  binderIds.value = [...(props.card.binderIds ?? [])];
}

function saveChanges() {
  if (!canSave.value) return;

  const card = collectionCards.value.find((entry) => entry.entryId === props.card.entryId);

  if (!card) return;

  card.condition = condition.value;
  card.quantity = quantity.value;
  card.price = price.value === "" ? null : price.value;
  card.favorite = favorite.value;
  card.trade = trade.value;
  card.binderIds = [...binderIds.value];

  window.bootstrap.Modal.getInstance(modalElement.value)?.hide();
}

function removeCard() {
  if (!props.card || !confirmingRemoval.value) return;
  const index = collectionCards.value.findIndex((entry) => entry.entryId === props.card.entryId);
  if (index === -1) return;
  collectionCards.value.splice(index, 1);
  window.bootstrap.Modal.getInstance(modalElement.value)?.hide();
}

onMounted(() => {
  modalElement.value.addEventListener("shown.bs.modal", resetForm);
});

onBeforeUnmount(() => {
  modalElement.value.removeEventListener("shown.bs.modal", resetForm);
});
</script>

<template>
  <div
    id="manage-card-modal"
    ref="modalElement"
    class="modal fade"
    tabindex="-1"
    aria-labelledby="manage-card-title"
    aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h2 id="manage-card-title" class="modal-title fs-5">Manage Card</h2>

          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"></button>
        </div>

        <div v-if="card" class="modal-body dialog-form">
          <section class="form-section card-summary" aria-label="Selected card">
            <img v-if="card.image" :src="card.image" :alt="card.name" />
            <div>
              <h3 class="h5 mb-1">{{ card.name }}</h3>
              <p class="small text-secondary mb-1">{{ card.type }}</p>
              <p class="small text-secondary mb-2">{{ card.printing }}</p>
              <span class="badge text-bg-light">{{ card.finish === "etched" ? "Etched foil" : card.isFoil ? "Foil" : "Nonfoil" }}</span>
            </div>
          </section>

          <section class="form-section" aria-labelledby="manage-copy-heading">
            <div class="section-heading">
              <span class="section-number">1</span>
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
              <label for="manage-price" class="form-label">Estimated value per copy (USD)</label>
              <div class="input-group">
                <span class="input-group-text">$</span>
                <input
                  id="manage-price"
                  v-model.number="price"
                  type="number"
                  min="0"
                  step="0.01"
                  class="form-control"
                  placeholder="Not set" />
              </div>
            </div>
          </section>

          <section class="form-section" aria-labelledby="manage-options-heading">
            <div class="section-heading">
              <span class="section-number">2</span>
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
    </div>
  </div>
</template>

<style scoped lang="scss">
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
