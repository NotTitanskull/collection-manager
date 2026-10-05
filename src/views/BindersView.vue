<script setup>
// Binder page: combines saved custom binders with the automatic Favorites view.
import { computed, ref, watch } from "vue";
import { binders } from "../stores/binders.js";
import { collectionCards } from "../stores/collection.js";
import FloatingAddButton from "../components/FloatingAddButton.vue";
import CollectionEntry from "../components/CollectionEntry.vue";
import ManageCardModal from "../components/modals/ManageCardModal.vue";
import BinderModal from "../components/modals/BinderModal.vue";
import BinderCardsModal from "../components/modals/BinderCardsModal.vue";

// Favorites is derived from card.favorite; it is not a separate saved copy of cards.
const favoritesBinder = {
  id: "system-favorites",
  name: "Favorites",
  color: "purple",
  description: "Cards you have marked as favorites.",
  automatic: true,
};
const displayedBinders = computed(() => [favoritesBinder, ...binders.value]);
const selectedBinder = ref(null);
const editingBinder = ref(false);
const choosingCards = ref(false);
const openBinderId = ref(null);
const openBinder = computed(() =>
  displayedBinders.value.find((binder) => binder.id === openBinderId.value),
);
const selectedCard = ref(null);
const search = ref("");
const sortOrder = ref("name-asc");
watch(openBinderId, () => {
  search.value = "";
  sortOrder.value = "name-asc";
});

// Automatic Favorites uses a flag; custom binders use membership IDs.
function containsCard(binder, card) {
  return binder.automatic ? card.favorite : card.binderIds?.includes(binder.id);
}
const binderCounts = computed(() =>
  Object.fromEntries(
    displayedBinders.value.map((binder) => [
      binder.id,
      collectionCards.value
        .filter((card) => containsCard(binder, card))
        .reduce((sum, card) => sum + card.quantity, 0),
    ]),
  ),
);
const binderCards = computed(() =>
  openBinder.value
    ? collectionCards.value.filter((card) => containsCard(openBinder.value, card))
    : [],
);
const visibleCards = computed(() => {
  const query = search.value.trim().toLowerCase();
  return binderCards.value
    .filter((card) => `${card.name} ${card.printing}`.toLowerCase().includes(query))
    .sort((a, b) =>
      sortOrder.value === "name-asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
    );
});
// The same floating action creates a binder or adds cards to the open binder.
function openAddDialog() {
  if (openBinder.value) {
    choosingCards.value = true;
  } else {
    selectedBinder.value = null;
    editingBinder.value = true;
  }
}
</script>

<template>
  <section class="binder-page page-with-add-action">
    <div v-if="openBinder">
      <div class="d-flex flex-wrap align-items-baseline gap-2 mb-2">
        <h1 class="binder-heading mb-0">{{ openBinder.name }}</h1>
        <span class="small text-secondary text-nowrap">
          {{ binderCounts[openBinder.id] }}
          {{ binderCounts[openBinder.id] === 1 ? "card" : "cards" }}
        </span>
      </div>
      <p v-if="openBinder.description" class="text-secondary mb-3">
        {{ openBinder.description }}
      </p>
      <div class="d-flex align-items-center justify-content-between gap-2 mb-3">
        <button
          type="button"
          class="btn btn-outline-secondary binder-back-button"
          @click="openBinderId = null">
          ← Back to binders
        </button>
        <button
          v-if="!openBinder.automatic"
          type="button"
          class="btn btn-outline-secondary"
          @click="
            selectedBinder = openBinder;
            editingBinder = true;
          ">
          Edit Binder
        </button>
      </div>
      <div v-if="binderCards.length" class="row g-2 mb-3">
        <div class="col-6 col-sm-8">
          <label for="binder-search" class="visually-hidden">Search this binder</label>
          <input
            id="binder-search"
            v-model="search"
            type="search"
            class="form-control"
            placeholder="Search cards..." />
        </div>
        <div class="col-6 col-sm-4">
          <label for="binder-sort" class="visually-hidden">Sort cards</label>
          <select id="binder-sort" v-model="sortOrder" class="form-select">
            <option value="name-asc">Name: A–Z</option>
            <option value="name-desc">Name: Z–A</option>
          </select>
        </div>
      </div>
      <ul v-if="visibleCards.length" class="list-unstyled">
        <CollectionEntry
          v-for="card in visibleCards"
          :key="card.entryId"
          :card="card"
          @manage="selectedCard = $event" />
      </ul>
      <p v-else class="text-secondary border rounded p-4">
        {{
          binderCards.length
            ? "No matching cards."
            : openBinder.automatic
              ? "No favorites yet. Mark a card as a favorite in Add Card or Manage Card."
              : "No cards in this binder yet. Use the + button to add existing cards, or assign cards using Add Card or Manage Card."
        }}
      </p>
      <p v-if="binderCards.length" class="small text-secondary">
        {{
          openBinder.automatic
            ? "To remove a favorite, open the card and uncheck Favorite."
            : "To remove a card from this binder, open it and uncheck this binder, then save. The card stays in your collection."
        }}
      </p>
    </div>
    <div v-else>
      <h1 class="binder-heading mb-3">My Binders</h1>
      <p class="text-secondary">Organize your collection into binders.</p>
      <div class="row g-3 mt-3">
        <div v-for="binder in displayedBinders" :key="binder.id" class="col-12 col-md-6 col-lg-4">
          <article class="card h-100 binder-card" :class="`binder-color-${binder.color}`">
            <div class="card-body d-flex flex-column">
              <div class="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-2">
                <h2 class="h5 mb-0">{{ binder.name }}</h2>
                <span v-if="binder.automatic" class="badge text-bg-light">Automatic</span>
              </div>
              <p class="small text-secondary mb-2">
                {{ binderCounts[binder.id] }}
                {{ binderCounts[binder.id] === 1 ? "card" : "cards" }}
              </p>
              <p v-if="binder.description" class="text-secondary mb-0">
                {{ binder.description }}
              </p>
              <div class="d-flex flex-wrap gap-2 mt-auto pt-3">
                <button
                  type="button"
                  class="btn btn-primary btn-sm"
                  :aria-label="`Open binder ${binder.name}`"
                  @click="openBinderId = binder.id">
                  Open Binder
                  <span aria-hidden="true">→</span>
                </button>
                <button
                  v-if="!binder.automatic"
                  type="button"
                  class="btn btn-outline-secondary btn-sm"
                  :aria-label="`Edit binder ${binder.name}`"
                  @click="
                    selectedBinder = binder;
                    editingBinder = true;
                  ">
                  Edit Binder
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
    <FloatingAddButton
      v-if="!openBinder?.automatic"
      :label="openBinder ? 'Add existing cards' : 'Create Binder'"
      @click="openAddDialog" />
    <BinderModal
      v-if="editingBinder"
      :binder="selectedBinder"
      @close="
        editingBinder = false;
        selectedBinder = null;
      " />
    <ManageCardModal v-if="selectedCard" :card="selectedCard" @close="selectedCard = null" />
    <BinderCardsModal v-if="choosingCards" :binder="openBinder" @close="choosingCards = false" />
  </section>
</template>

<style scoped lang="scss">
// Binder tiles show click feedback and cover colors without affecting other cards.
.binder-heading,
.binder-card {
  overflow-wrap: anywhere;
}
.binder-card {
  --binder-color: #2b59a2;
  border-top: 0.4rem solid var(--binder-color);
  &.binder-color-purple {
    --binder-color: #7553a1;
  }
  &.binder-color-green {
    --binder-color: #367d70;
  }
}
</style>
