<script setup>
import { computed, ref } from "vue";
import { collectionCards } from "../stores/collection.js";
import CollectionEntry from "../components/CollectionEntry.vue";
import AddCardModal from "../components/AddCardModal.vue";
import ManageCardModal from "../components/ManageCardModal.vue";

const search = ref("");
const sortOrder = ref("name-asc");
const selectedCard = ref(null);

const filteredCards = computed(() => {
  const query = search.value.trim().toLowerCase();

  const matches = collectionCards.value.filter((card) => card.name.toLowerCase().includes(query));

  return matches.sort((a, b) =>
    sortOrder.value === "name-asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
  );
});
</script>

<template>
  <section class="collection-page">
    <div class="d-flex align-items-center justify-content-between gap-3">
      <h1>My Collection</h1>

      <button
        type="button"
        class="btn btn-primary"
        data-bs-toggle="modal"
        data-bs-target="#add-card-modal">
        + Add Card
      </button>
    </div>
    <p>Browse and manage every card in your collection.</p>

    <div class="row g-2 mt-4">
      <div class="col-12 col-md-8">
        <label for="collection-search" class="visually-hidden">Search your collection</label>
        <input
          id="collection-search"
          v-model="search"
          type="search"
          class="form-control"
          placeholder="Search cards..." />
      </div>

      <div class="col-12 col-md-4">
        <label for="collection-sort" class="visually-hidden">Sort your collection</label>
        <select id="collection-sort" v-model="sortOrder" class="form-select">
          <option value="name-asc">Name: A–Z</option>
          <option value="name-desc">Name: Z–A</option>
        </select>
      </div>
    </div>

    <ul class="list-unstyled mt-4">
      <CollectionEntry
        v-for="entry in filteredCards"
        :key="entry.entryId"
        :card="entry"
        @manage="selectedCard = $event" />
    </ul>

    <p v-if="filteredCards.length === 0" class="text-secondary">No cards found.</p>

    <AddCardModal />
    <ManageCardModal :card="selectedCard" />
  </section>
</template>
