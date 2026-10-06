<script setup>
// Assigns existing collection entries to a binder without duplicating the cards.
import ModalWrapper from "../ui/ModalWrapper.vue";
import { computed, ref } from "vue";
import { assignedQuantity, availableQuantity, binderAssignments, saveAssignments } from "../../utils/binderQuantities.js";
import { collectionCards } from "../../stores/collection.js";

const props = defineProps({ binder: { type: Object, default: null } });
const emit = defineEmits(["close"]);
const search = ref("");
const selectedIds = ref([]);
const quantities = ref({});
const availableCards = computed(() =>
  collectionCards.value.filter((card) => availableQuantity(card) > 0),
);
const matchingCards = computed(() => {
  const query = search.value.trim().toLowerCase();
  return availableCards.value.filter((card) =>
    `${card.name} ${card.printing}`.toLowerCase().includes(query),
  );
});
const canAdd = computed(() => selectedIds.value.length > 0 && selectedIds.value.every(id => {
  const card = availableCards.value.find(card => card.entryId === id);
  const quantity = quantities.value[id] ?? 1;
  return card && Number.isInteger(quantity) && quantity > 0 && quantity <= availableQuantity(card);
}));
function addCards() {
  if (!props.binder || !canAdd.value) return;
  for (const card of availableCards.value) {
    if (!selectedIds.value.includes(card.entryId)) continue;
    const assignments = binderAssignments(card);
    assignments[props.binder.id] = assignedQuantity(card, props.binder.id) + (quantities.value[card.entryId] ?? 1);
    saveAssignments(card, assignments);
  }
  emit('close');
}
</script>

<template>
  <ModalWrapper
    aria-labelledby="binder-cards-title"
    id="binder-cards-modal"
    large
    @close="emit('close')">
    <form class="modal-content" @submit.prevent="addCards">
      <div class="modal-header">
        <h2 id="binder-cards-title" class="modal-title fs-5">Add existing cards</h2>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body dialog-form">
        <section class="form-section">
          <p>
            Add copies to
            <strong>{{ binder?.name }}</strong>. Their other binder assignments will stay unchanged.
          </p>
          <label for="binder-card-search" class="form-label">Search your collection</label>
          <input
            id="binder-card-search"
            v-model="search"
            type="search"
            class="form-control mb-3"
            placeholder="Card name or printing" />
          <div class="option-list">
            <div v-for="card in matchingCards" :key="card.entryId">
              <label class="option-control">
              <span>
                <strong>{{ card.name }}</strong>
                <small>
                  {{ card.printing }} ·
                  {{ card.finish === "etched" ? "Etched foil" : card.isFoil ? "Foil" : "Nonfoil" }}
                </small>
                <small>{{ card.condition }} · {{ card.quantity }} owned · {{ availableQuantity(card) }} unassigned</small>
              </span>
              <input
                v-model="selectedIds"
                :value="card.entryId"
                type="checkbox"
                class="form-check-input" />
              </label>
              <div v-if="selectedIds.includes(card.entryId)" class="mt-2 mb-3">
                <label :for="`binder-add-quantity-${card.entryId}`" class="form-label small">Copies of {{ card.name }} to add</label>
                <input :id="`binder-add-quantity-${card.entryId}`" :value="quantities[card.entryId] ?? 1"
                  type="number" min="1" :max="availableQuantity(card)" step="1" class="form-control"
                  :aria-invalid="!Number.isInteger(quantities[card.entryId] ?? 1) || (quantities[card.entryId] ?? 1) < 1 || (quantities[card.entryId] ?? 1) > availableQuantity(card)"
                  @input="quantities[card.entryId] = $event.target.value === '' ? '' : Number($event.target.value)" />
              </div>
            </div>
          </div>
          <p v-if="!matchingCards.length" class="text-secondary mb-0">
            {{
              availableCards.length
                ? "No matching cards."
                : "No unassigned copies are available. Adjust existing binder quantities to free copies."
            }}
          </p>
        </section>
      </div>
      <div class="modal-footer justify-content-between">
        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" :disabled="!canAdd">
          Add selected ({{ selectedIds.length }})
        </button>
      </div>
    </form>
  </ModalWrapper>
</template>
