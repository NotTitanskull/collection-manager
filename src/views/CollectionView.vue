<script setup>
// Collection page: derives the visible list and controls the add/manage dialogs.
import { computed, ref } from 'vue';
import FloatingAddButton from '../components/shared/FloatingAddButton.vue';
import CollectionCardRow from '../components/cards/CollectionCardRow.vue';
import AddCardModal from '../components/cards/AddCardModal.vue';
import CardDetailsModal from '../components/cards/CardDetailsModal.vue';

const props = defineProps({
  collectionCards: { type: Array, required: true },
  binders: { type: Array, required: true },
});

const emit = defineEmits(['add-cards', 'update-card', 'delete-card']);

const search = ref('');
const sortOrder = ref('name-asc');
const selectedCard = ref(null);
const addingCard = ref(false);

// Computed lists update when search, sort, or saved data changes. filter returns a new array.
const filteredCards = computed(() => {
  const query = search.value.trim().toLowerCase();

  const matches = props.collectionCards.filter((card) => card.name.toLowerCase().includes(query));

  return matches.sort((a, b) =>
    sortOrder.value === 'name-asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
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
          placeholder="Search cards..."
        />
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
      <CollectionCardRow
        v-for="entry in filteredCards"
        :key="entry.entryId"
        :card="entry"
        @manage="selectedCard = $event"
      />
    </ul>

    <p v-if="filteredCards.length === 0" class="text-secondary">No cards found.</p>

    <FloatingAddButton label="Add Card" @click="addingCard = true" />
    <AddCardModal
      :binders="binders"
      @add-cards="emit('add-cards', $event)"
      v-if="addingCard"
      @close="addingCard = false"
    />
    <CardDetailsModal
      :collection-cards="collectionCards"
      :binders="binders"
      @add-cards="emit('add-cards', $event)"
      @update-card="emit('update-card', $event)"
      @delete-card="emit('delete-card', $event)"
      v-if="selectedCard"
      :card="selectedCard"
      @close="selectedCard = null"
    />
  </section>
</template>
