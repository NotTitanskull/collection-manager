<script setup>
// App.vue owns the live data. Pages receive props and emit requests to change it.
// Browser localStorage keeps the two arrays under separate keys across page reloads.
import { ref, watch } from 'vue';
import { sampleCards } from './data/sampleCards.js';
import { addCollectionEntries } from './utils/addCards.js';
import { binderAssignments } from './utils/binderAssignments.js';
import { loadSavedArray, saveArray } from './services/storage.js';
import { validateSavedCards, validateSavedBinders } from './services/savedData.js';

const cardsKey = 'collection-manager:cards';
const bindersKey = 'collection-manager:binders';
const savedCards = loadSavedArray(cardsKey, sampleCards, validateSavedCards);
const savedBinders = loadSavedArray(bindersKey, [], validateSavedBinders);
const storageIssues = [
  savedCards.error && `Collection: ${savedCards.error}`,
  savedBinders.error && `Binders: ${savedBinders.error}`,
].filter(Boolean);
const saveFailed = ref(false);

// Card entries contain owned quantities and binder assignments (binder ID -> copy count).

/** @type {import('vue').Ref<import('./models/CollectionEntry.js').CollectionEntryData[]>} */
const collectionCards = ref(savedCards.data);

// Binders contain only { id, name, description, color }; they have no cards array.

/** @type {import('vue').Ref<import('./utils/binderAssignments.js').Binder[]>} */
const binders = ref(savedBinders.data);

/**
 * Merge new entries into the live collection; its watcher persists the result.
 * @param {import('./models/CollectionEntry.js').CollectionEntryData[]} entries Validated entries.
 */
function addCards(entries) {
  addCollectionEntries(collectionCards.value, entries);
}

/**
 * Apply a form's edited copy to the existing entry with the same ID.
 * @param {import('./models/CollectionEntry.js').CollectionEntryData} updated Edited card copy.
 */
function updateCard(updated) {
  const card = collectionCards.value.find((card) => card.entryId === updated.entryId);
  // Preserve object identity so an open overview follows edits to the same entry.
  if (card) Object.assign(card, updated);
}

/**
 * Remove an owned entry and all of its binder assignments.
 * @param {string} entryId Owned row to remove.
 */
function deleteCard(entryId) {
  const index = collectionCards.value.findIndex((card) => card.entryId === entryId);
  if (index !== -1) collectionCards.value.splice(index, 1);
}

/**
 * Create or update binder details; the binder watcher handles persistence.
 * @param {import('./utils/binderAssignments.js').Binder} updated Validated binder details.
 */
function saveBinder(updated) {
  const binder = binders.value.find((binder) => binder.id === updated.id);
  if (binder) Object.assign(binder, updated);
  else binders.value.push(updated);
}

/**
 * Delete a binder and release its assignments while keeping every owned copy.
 * @param {string} id Binder ID to remove.
 */
function deleteBinder(id) {
  if (!binders.value.some((binder) => binder.id === id)) return;
  // Assignments live on cards, so remove this binder ID from each card first.
  // Owned quantities stay unchanged; those copies become unassigned.
  for (const card of collectionCards.value) {
    const assignments = binderAssignments(card);
    delete assignments[id];
    card.binderQuantities = assignments;
    card.binderIds = Object.keys(assignments);
  }
  binders.value = binders.value.filter((binder) => binder.id !== id);
}

/** Export the exact original strings, including malformed JSON, for recovery. */
function downloadSavedData() {
  const backup = JSON.stringify(
    { [cardsKey]: savedCards.raw, [bindersKey]: savedBinders.raw },
    null,
    2
  );
  const url = URL.createObjectURL(new Blob([backup], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'collection-recovery.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// If either list is damaged, pause both saves: cards and binder IDs are related.
// deep includes nested edits; an intentionally saved empty array remains empty.
watch(
  [collectionCards, binders],
  ([cards, binderList]) => {
    if (storageIssues.length) return;
    const cardsSaved = saveArray(cardsKey, cards);
    const bindersSaved = saveArray(bindersKey, binderList);
    saveFailed.value = !cardsSaved || !bindersSaved;
  },
  { deep: true, immediate: true }
);
</script>

<template>
  <div class="app-layout">
    <header class="site-header border-bottom bg-white">
      <div class="container-lg px-3 px-sm-4 header-content">
        <RouterLink class="site-brand" to="/collection">MTG Collection</RouterLink>

        <nav class="desktop-nav d-none d-md-flex" aria-label="Main navigation">
          <RouterLink class="site-nav-link" to="/collection">Collection</RouterLink>
          <RouterLink class="site-nav-link" to="/trade">Trade</RouterLink>
          <RouterLink class="site-nav-link" to="/binders">Binders</RouterLink>
        </nav>
      </div>
    </header>

    <main class="container-lg px-3 px-sm-4 py-3 py-lg-4">
      <div v-if="storageIssues.length" class="alert alert-warning" role="alert">
        <p class="fw-semibold mb-2">Some saved data could not be loaded. Saving is paused.</p>
        <ul class="mb-2">
          <li v-for="issue in storageIssues" :key="issue">{{ issue }}</li>
        </ul>
        <p>
          Original saved data has been kept. Changes in this session will not be saved. Download the
          original data before repairing browser storage and reloading.
        </p>
        <button
          v-if="savedCards.raw !== null || savedBinders.raw !== null"
          type="button"
          class="btn btn-outline-dark"
          @click="downloadSavedData"
        >
          Download original saved data
        </button>
      </div>
      <p v-else-if="saveFailed" class="alert alert-warning" role="alert">
        Changes could not be saved to this browser. Keep this page open until browser storage is
        available.
      </p>
      <!-- The matched page renders here; navigation and footer remain shared. -->
      <RouterView v-slot="{ Component }">
        <component
          :is="Component"
          :collection-cards="collectionCards"
          :binders="binders"
          @add-cards="addCards"
          @update-card="updateCard"
          @delete-card="deleteCard"
          @save-binder="saveBinder"
          @delete-binder="deleteBinder"
        />
      </RouterView>
    </main>

    <footer class="container-lg px-3 px-sm-4 py-3 border-top">
      <small>MTG Collection Manager</small>
    </footer>

    <nav class="mobile-nav d-md-none" aria-label="Main navigation">
      <RouterLink class="site-nav-link" to="/collection">Collection</RouterLink>
      <RouterLink class="site-nav-link" to="/trade">Trade</RouterLink>
      <RouterLink class="site-nav-link" to="/binders">Binders</RouterLink>
    </nav>
  </div>
</template>
