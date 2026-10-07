<script setup>
// Binder page: combines saved custom binders with the automatic Favorites view.
import { computed, ref, watch } from "vue";
import { binders } from "../stores/binders.js";
import { collectionCards } from "../stores/collection.js";
import FloatingAddButton from "../components/ui/FloatingAddButton.vue";
import CollectionEntry from "../components/cards/CollectionEntry.vue";
import BinderQuantityModal from "../components/binders/BinderQuantityModal.vue";
import { assignedQuantity, binderAssignments, totalAssigned } from "../utils/binderQuantities.js";
import CardDetailsModal from "../components/cards/CardDetailsModal.vue";
import BinderModal from "../components/binders/BinderModal.vue";
import BinderOptions from "../components/binders/BinderOptions.vue";
import DeleteBinderModal from "../components/binders/DeleteBinderModal.vue";
import BinderCardsModal from "../components/binders/BinderCardsModal.vue";

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
const deletingBinder = ref(null);
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
  return binder.automatic ? card.favorite : assignedQuantity(card, binder.id) > 0;
}
const binderCounts = computed(() =>
  Object.fromEntries(
    displayedBinders.value.map((binder) => [
      binder.id,
      collectionCards.value
        .filter((card) => containsCard(binder, card))
        .reduce((sum, card) => sum + (binder.automatic ? card.quantity : assignedQuantity(card, binder.id)), 0),
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
      <div class="d-flex align-items-start justify-content-between gap-2 mb-2">
        <div class="binder-title-group d-flex flex-wrap align-items-baseline gap-2">
          <h1 class="binder-heading mb-0">{{ openBinder.name }}</h1>
          <span class="small text-secondary text-nowrap">
            {{ binderCounts[openBinder.id] }}
            {{ binderCounts[openBinder.id] === 1 ? "card" : "cards" }}
          </span>
        </div>
      </div>
      <p v-if="openBinder.description" class="text-secondary mb-3">
        {{ openBinder.description }}
      </p>
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <button
          type="button"
          class="btn btn-outline-secondary binder-back-button"
          @click="openBinderId = null">
          ← Back to binders
        </button>
        <BinderOptions v-if="!openBinder.automatic" class="flex-shrink-0 ms-auto" :binder-name="openBinder.name" settings
          @edit="selectedBinder = openBinder; editingBinder = true"
          @delete="deletingBinder = openBinder" />
      </div>
      <div class="row g-2 mb-3">
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
      <p v-if="!openBinder.automatic && binderCards.some(card => totalAssigned(binderAssignments(card)) > card.quantity)"
        class="alert alert-warning" role="alert">Some older entries counted all copies in multiple binders. Review their binder quantities in Manage Card on the Collection page to split the copies you own.</p>
      <ul v-if="visibleCards.length" class="list-unstyled">
        <CollectionEntry
          v-for="card in visibleCards"
          :key="card.entryId"
          :card="card"
          :displayed-quantity="openBinder.automatic ? null : assignedQuantity(card, openBinder.id)"
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
            : "Open a card to change how many copies are in this binder. Set the binder quantity to 0 to remove it; your owned quantity stays unchanged."
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
              <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
                <h2 class="h5 mb-0 binder-tile-title">
                  <button type="button" class="btn btn-link stretched-link text-reset text-decoration-none p-0 binder-open-button"
                    :aria-label="`Open binder ${binder.name}`" @click="openBinderId = binder.id">
                    {{ binder.name }}
                  </button>
                </h2>
                <span v-if="binder.automatic" class="badge text-bg-light">Automatic</span>
                <BinderOptions v-else class="flex-shrink-0 binder-tile-options" :binder-name="binder.name" icon-only
                  @edit="selectedBinder = binder; editingBinder = true"
                  @delete="deletingBinder = binder" />
              </div>
              <p class="small text-secondary mb-2">
                {{ binderCounts[binder.id] }}
                {{ binderCounts[binder.id] === 1 ? "card" : "cards" }}
              </p>
              <p v-if="binder.description" class="text-secondary mb-0">
                {{ binder.description }}
              </p>
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
    <DeleteBinderModal v-if="deletingBinder" :binder="deletingBinder"
      @close="deletingBinder = null"
      @deleted="id => { if (openBinderId === id) openBinderId = null; deletingBinder = null; }" />
    <BinderQuantityModal v-if="selectedCard && openBinder && !openBinder.automatic"
      :card="selectedCard" :binder="openBinder" @close="selectedCard = null" />
    <CardDetailsModal v-if="selectedCard && openBinder?.automatic" :card="selectedCard" @close="selectedCard = null" />
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
  &:hover {
    box-shadow: var(--bs-box-shadow-sm);
  }
  &.binder-color-purple {
    --binder-color: #7553a1;
  }
  &.binder-color-green {
    --binder-color: #367d70;
  }
}
.binder-tile-title {
  flex: 1;
  min-width: 0;
}
.binder-title-group {
  min-width: 0;
}
.binder-open-button {
  font: inherit;
  text-align: left;
  border: 0;
  &:focus-visible {
    box-shadow: none;
    &::after {
      outline: 2px solid var(--bs-primary);
      outline-offset: 2px;
      border-radius: var(--bs-border-radius);
    }
  }
}
.binder-tile-options {
  position: relative;
  z-index: 2;
}
</style>
