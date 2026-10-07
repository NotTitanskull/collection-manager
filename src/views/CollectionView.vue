<script setup>
// Collection page: derives the visible list and controls the add/manage dialogs.
import { computed, ref } from "vue";
import { collectionCards } from "../stores/collection.js";
import FloatingAddButton from "../components/ui/FloatingAddButton.vue";
import CollectionEntry from "../components/cards/CollectionEntry.vue";
import AddCardModal from "../components/cards/AddCardModal.vue";
import CardDetailsModal from "../components/cards/CardDetailsModal.vue";

const search = ref("");
const sortOrder = ref("name-asc");
const selectedCard = ref(null);
const addingCard = ref(false);

// Computed lists update when search, sort, or saved data changes. filter returns a new array.
const filteredCards = computed(() => {
  const query = search.value.trim().toLowerCase();

  const matches = collectionCards.value.filter((card) => card.name.toLowerCase().includes(query));

  return matches.sort((a, b) =>
    sortOrder.value === "name-asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
  );
});
</script>

<template>
  <section class="collection-page page-with-add-action">
    <h1>My Collection</h1>
    <p>Browse and manage every card in your collection.</p>

    <div class="row g-2 mt-3">
      <div class="col-6 col-sm-8">
        <label for="collection-search" class="visually-hidden">Search your collection</label>
        <input
          id="collection-search"
          v-model="search"
          type="search"
          class="form-control"
          placeholder="Search cards..." />
      </div>

      <div class="col-6 col-sm-4">
        <label for="collection-sort" class="visually-hidden">Sort your collection</label>
        <select id="collection-sort" v-model="sortOrder" class="form-select">
          <option value="name-asc">Name: A–Z</option>
          <option value="name-desc">Name: Z–A</option>
        </select>
      </div>
    </div>

    <ul class="list-unstyled mt-3">
      <CollectionEntry
        v-for="entry in filteredCards"
        :key="entry.entryId"
        :card="entry"
        @manage="selectedCard = $event" />
    </ul>

    <p v-if="filteredCards.length === 0" class="text-secondary">No cards found.</p>

    <FloatingAddButton label="Add Card" @click="addingCard = true" />
    <AddCardModal v-if="addingCard" @close="addingCard = false" />
    <CardDetailsModal v-if="selectedCard" :card="selectedCard" @close="selectedCard = null" />
  </section>
</template>
