<script setup>
import { computed, ref } from 'vue';
import CardSummary from '../cards/CardSummary.vue';
import ModalWrapper from '../ui/ModalWrapper.vue';
import { collectionCards } from '../../stores/collection.js';
import {
  assignedQuantity,
  availableQuantity,
  binderAssignments,
  validAssignments,
  saveAssignments,
} from '../../utils/binderQuantities.js';
const props = defineProps({
  card: { type: Object, required: true },
  binder: { type: Object, required: true },
});
const emit = defineEmits(['close']);
const quantity = ref(assignedQuantity(props.card, props.binder.id));
const confirmingRemoval = ref(false);
const maximum = computed(() => availableQuantity(props.card, props.binder.id));
const proposedAssignments = computed(() => {
  const assignments = binderAssignments(props.card);
  if (quantity.value) assignments[props.binder.id] = quantity.value;
  else delete assignments[props.binder.id];
  return assignments;
});
const valid = computed(
  () =>
    Number.isInteger(quantity.value) &&
    quantity.value >= 0 &&
    quantity.value <= maximum.value &&
    validAssignments(proposedAssignments.value, props.card.quantity),
);
function save() {
  if (!valid.value) return;
  const card = collectionCards.value.find((card) => card.entryId === props.card.entryId);
  if (!card) return;
  const assignments = binderAssignments(card);
  if (quantity.value) assignments[props.binder.id] = quantity.value;
  else delete assignments[props.binder.id];
  if (saveAssignments(card, assignments)) emit('close');
}
function requestSave() {
  if (confirmingRemoval.value || !valid.value) return;
  if (quantity.value === 0) confirmingRemoval.value = true;
  else save();
}
function removeFromBinder() {
  if (!confirmingRemoval.value) return;
  quantity.value = 0;
  save();
}
</script>

<template>
  <ModalWrapper aria-labelledby="binder-copy-title" @close="emit('close')">
    <form class="modal-content" @submit.prevent="requestSave">
      <div class="modal-header">
        <h2 id="binder-copy-title" class="modal-title fs-5">Copies in {{ binder.name }}</h2>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body dialog-form">
        <CardSummary :card="card" />
        <section class="form-section" aria-labelledby="binder-quantity-heading">
          <div class="section-heading">
            <div>
              <h3 id="binder-quantity-heading">Binder copies</h3>
              <p>Choose how many copies belong in {{ binder.name }}.</p>
            </div>
          </div>
          <label for="binder-copy-quantity" class="form-label">Copies in this binder</label>
          <input
            id="binder-copy-quantity"
            v-model.number="quantity"
            type="number"
            min="0"
            :max="maximum"
            step="1"
            class="form-control"
            :aria-invalid="!valid"
            :disabled="confirmingRemoval"
            aria-describedby="binder-copy-help"
          />
          <p id="binder-copy-help" class="form-text mb-0">Up to {{ maximum }} copies available.</p>
          <p v-if="!valid" class="text-danger small mt-2 mb-0" role="alert">
            Use a whole number between 0 and {{ maximum }}. Review other binder assignments in
            Manage Card if needed.
          </p>
          <div v-if="confirmingRemoval" class="alert alert-danger mt-3 mb-0" role="alert">
            <p>
              Remove <strong>{{ card.name }}</strong> from <strong>{{ binder.name }}</strong
              >? Your owned copies and other binder assignments stay unchanged.
            </p>
            <div class="d-flex flex-wrap gap-2">
              <button
                type="button"
                class="btn btn-outline-secondary"
                @click="confirmingRemoval = false"
              >
                Keep in binder
              </button>
              <button type="button" class="btn btn-danger" @click="removeFromBinder">
                Confirm removal
              </button>
            </div>
          </div>
          <button
            v-else
            type="button"
            class="btn btn-outline-danger d-inline-flex align-items-center justify-content-center gap-2 mt-3"
            @click="confirmingRemoval = true"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"
              />
              <path
                d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1 0-2H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1M4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11H2.5"
              />
            </svg>
            Remove from binder
          </button>
        </section>
      </div>
      <div class="modal-footer justify-content-between">
        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" :disabled="!valid || confirmingRemoval">
          Save binder quantity
        </button>
      </div>
    </form>
  </ModalWrapper>
</template>
