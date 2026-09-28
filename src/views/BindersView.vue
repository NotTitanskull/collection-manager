<script setup>
import { computed, ref, watch } from "vue";
import { binders } from "../stores/binders.js";
import { collectionCards } from "../stores/collection.js";
import CollectionEntry from "../components/CollectionEntry.vue";
import ManageCardModal from "../components/ManageCardModal.vue";
import BinderModal from "../components/BinderModal.vue";
import BinderCardsModal from "../components/BinderCardsModal.vue";

const favoritesBinder = {
  id: "system-favorites", name: "Favorites", color: "purple",
  description: "Cards you have marked as favorites.", automatic: true,
};
const displayedBinders = computed(() => [favoritesBinder, ...binders.value]);
const selectedBinder = ref(null);
const openBinderId = ref(null);
const openBinder = computed(() => displayedBinders.value.find((binder) => binder.id === openBinderId.value));
const selectedCard = ref(null);
const search = ref("");
const sortOrder = ref("name-asc");
watch(openBinderId, () => { search.value = ""; sortOrder.value = "name-asc"; });

function containsCard(binder, card) {
  return binder.automatic ? card.favorite : card.binderIds?.includes(binder.id);
}
const binderCounts = computed(() => Object.fromEntries(displayedBinders.value.map((binder) => [
  binder.id,
  collectionCards.value.filter((card) => containsCard(binder, card)).reduce((sum, card) => sum + card.quantity, 0),
])));
const binderCards = computed(() => openBinder.value
  ? collectionCards.value.filter((card) => containsCard(openBinder.value, card)) : []);
const visibleCards = computed(() => {
  const query = search.value.trim().toLowerCase();
  return binderCards.value.filter((card) => `${card.name} ${card.printing}`.toLowerCase().includes(query))
    .sort((a, b) => sortOrder.value === "name-asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
});
</script>

<template>
  <section>
    <div v-if="openBinder">
      <button type="button" class="btn btn-link px-0 mb-3" @click="openBinderId = null">← Back to binders</button>
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <div class="binder-heading">
          <h1>{{ openBinder.name }}</h1>
          <p v-if="openBinder.description" class="text-secondary mb-1">{{ openBinder.description }}</p>
          <p class="small text-secondary mb-0">{{ binderCounts[openBinder.id] }} {{ binderCounts[openBinder.id] === 1 ? "card" : "cards" }}</p>
        </div>
        <div v-if="!openBinder.automatic" class="d-flex flex-wrap gap-2">
          <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#binder-cards-modal">Add existing cards</button>
          <button type="button" class="btn btn-outline-secondary" data-bs-toggle="modal"
            data-bs-target="#binder-modal" @click="selectedBinder = openBinder">Edit Binder</button>
        </div>
      </div>
      <div v-if="binderCards.length" class="row g-2 mb-3">
        <div class="col-12 col-sm-8">
          <label for="binder-search" class="visually-hidden">Search this binder</label>
          <input id="binder-search" v-model="search" type="search" class="form-control" placeholder="Search this binder..." />
        </div>
        <div class="col-12 col-sm-4">
          <label for="binder-sort" class="visually-hidden">Sort cards</label>
          <select id="binder-sort" v-model="sortOrder" class="form-select">
            <option value="name-asc">Name: A–Z</option><option value="name-desc">Name: Z–A</option>
          </select>
        </div>
      </div>
      <ul v-if="visibleCards.length" class="list-unstyled">
        <CollectionEntry v-for="card in visibleCards" :key="card.entryId" :card="card" @manage="selectedCard = $event" />
      </ul>
      <p v-else class="text-secondary border rounded p-4">
        {{ binderCards.length ? "No matching cards." : openBinder.automatic
          ? "No favorites yet. Mark a card as a favorite in Add Card or Manage Card."
          : "No cards in this binder yet. Use Add existing cards, or assign cards using Add Card or Manage Card." }}
      </p>
      <p v-if="binderCards.length" class="small text-secondary">
        {{ openBinder.automatic ? "To remove a favorite, open the card and uncheck Favorite."
          : "To remove a card from this binder, open it and uncheck this binder, then save. The card stays in your collection." }}
      </p>
    </div>
    <div v-else>
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <h1>My Binders</h1>
        <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#binder-modal"
          @click="selectedBinder = null">+ Create Binder</button>
      </div>
      <p class="text-secondary">Organize your collection into binders.</p>
      <div class="row g-3 mt-3">
        <div v-for="binder in displayedBinders" :key="binder.id" class="col-12 col-md-6 col-lg-4">
          <article class="card h-100 binder-card" :class="`binder-color-${binder.color}`">
            <div class="card-body d-flex flex-column">
              <div class="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-2">
                <h2 class="h5 mb-0">{{ binder.name }}</h2>
                <span v-if="binder.automatic" class="badge text-bg-light">Automatic</span>
              </div>
              <p class="small text-secondary mb-2">{{ binderCounts[binder.id] }} {{ binderCounts[binder.id] === 1 ? "card" : "cards" }}</p>
              <p v-if="binder.description" class="text-secondary mb-0">{{ binder.description }}</p>
              <div class="d-flex flex-wrap gap-2 mt-auto pt-3">
                <button type="button" class="btn btn-primary btn-sm" :aria-label="`Open binder ${binder.name}`"
                  @click="openBinderId = binder.id">Open Binder <span aria-hidden="true">→</span></button>
                <button v-if="!binder.automatic" type="button" class="btn btn-outline-secondary btn-sm"
                  :aria-label="`Edit binder ${binder.name}`" data-bs-toggle="modal" data-bs-target="#binder-modal"
                  @click="selectedBinder = binder">Edit Binder</button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
    <BinderModal :binder="selectedBinder" />
    <ManageCardModal :card="selectedCard" />
    <BinderCardsModal :binder="openBinder" />
  </section>
</template>

<style scoped lang="scss">
.binder-heading, .binder-card { overflow-wrap: anywhere; }
.binder-card {
  --binder-color: #2b59a2;
  border-top: 0.4rem solid var(--binder-color);
  &.binder-color-purple { --binder-color: #7553a1; }
  &.binder-color-green { --binder-color: #367d70; }
}
</style>
