<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { collectionCards } from "../stores/collection.js";

const props = defineProps({ binder: { type: Object, default: null } });
const modalElement = ref(null);
const search = ref("");
const selectedIds = ref([]);
const availableCards = computed(() => collectionCards.value.filter((card) =>
  !card.binderIds?.includes(props.binder?.id),
));
const matchingCards = computed(() => {
  const query = search.value.trim().toLowerCase();
  return availableCards.value.filter((card) =>
    `${card.name} ${card.printing}`.toLowerCase().includes(query),
  );
});
async function resetForm() {
  await nextTick();
  search.value = "";
  selectedIds.value = [];
}
function addCards() {
  if (!props.binder || !selectedIds.value.length) return;
  for (const card of availableCards.value) {
    if (selectedIds.value.includes(card.entryId)) {
      card.binderIds = [...(card.binderIds ?? []), props.binder.id];
    }
  }
  window.bootstrap.Modal.getInstance(modalElement.value)?.hide();
}
onMounted(() => modalElement.value.addEventListener("show.bs.modal", resetForm));
onBeforeUnmount(() => modalElement.value.removeEventListener("show.bs.modal", resetForm));
</script>

<template>
  <div id="binder-cards-modal" ref="modalElement" class="modal fade" tabindex="-1"
    aria-labelledby="binder-cards-title" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
      <form class="modal-content" @submit.prevent="addCards">
        <div class="modal-header">
          <h2 id="binder-cards-title" class="modal-title fs-5">Add existing cards</h2>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body dialog-form">
          <section class="form-section">
            <p>Add copies to <strong>{{ binder?.name }}</strong>. Their other binder assignments will stay unchanged.</p>
            <label for="binder-card-search" class="form-label">Search your collection</label>
            <input id="binder-card-search" v-model="search" type="search" class="form-control mb-3" placeholder="Card name or printing" />
            <div class="option-list">
              <label v-for="card in matchingCards" :key="card.entryId" class="option-control">
                <span>
                  <strong>{{ card.name }}</strong>
                  <small>{{ card.printing }} · {{ card.finish === "etched" ? "Etched foil" : card.isFoil ? "Foil" : "Nonfoil" }}</small>
                  <small>{{ card.condition }} · ×{{ card.quantity }}</small>
                </span>
                <input v-model="selectedIds" :value="card.entryId" type="checkbox" class="form-check-input" />
              </label>
            </div>
            <p v-if="!matchingCards.length" class="text-secondary mb-0">
              {{ availableCards.length ? "No matching cards." : "All collection entries are already in this binder, or your collection is empty." }}
            </p>
          </section>
        </div>
        <div class="modal-footer justify-content-between">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="!selectedIds.length">Add selected ({{ selectedIds.length }})</button>
        </div>
      </form>
    </div>
  </div>
</template>
