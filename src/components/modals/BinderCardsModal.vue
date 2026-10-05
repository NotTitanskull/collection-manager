<script setup>
// Assigns existing collection entries to a binder without duplicating the cards.
import ModalWrapper from "./ModalWrapper.vue";
import { computed, ref } from "vue";
import { collectionCards } from "../../stores/collection.js";

const props = defineProps({ binder: { type: Object, default: null } });
const emit = defineEmits(["close"]);
const search = ref("");
const selectedIds = ref([]);
const availableCards = computed(() =>
  collectionCards.value.filter((card) => !card.binderIds?.includes(props.binder?.id)),
);
const matchingCards = computed(() => {
  const query = search.value.trim().toLowerCase();
  return availableCards.value.filter((card) =>
    `${card.name} ${card.printing}`.toLowerCase().includes(query),
  );
});
// Append this binder’s ID to selected entries while preserving other memberships.
function addCards() {
  if (!props.binder || !selectedIds.value.length) return;
  for (const card of availableCards.value) {
    if (selectedIds.value.includes(card.entryId)) {
      card.binderIds = [...(card.binderIds ?? []), props.binder.id];
    }
  }
  emit("close");
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
            <label v-for="card in matchingCards" :key="card.entryId" class="option-control">
              <span>
                <strong>{{ card.name }}</strong>
                <small>
                  {{ card.printing }} ·
                  {{ card.finish === "etched" ? "Etched foil" : card.isFoil ? "Foil" : "Nonfoil" }}
                </small>
                <small>{{ card.condition }} · ×{{ card.quantity }}</small>
              </span>
              <input
                v-model="selectedIds"
                :value="card.entryId"
                type="checkbox"
                class="form-check-input" />
            </label>
          </div>
          <p v-if="!matchingCards.length" class="text-secondary mb-0">
            {{
              availableCards.length
                ? "No matching cards."
                : "All collection entries are already in this binder, or your collection is empty."
            }}
          </p>
        </section>
      </div>
      <div class="modal-footer justify-content-between">
        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" :disabled="!selectedIds.length">
          Add selected ({{ selectedIds.length }})
        </button>
      </div>
    </form>
  </ModalWrapper>
</template>
