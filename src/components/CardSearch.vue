<script setup>
import { onBeforeUnmount, ref } from "vue";

const name = defineModel({ type: String, required: true });
const emit = defineEmits(["select"]);

const suggestions = ref([]);
const loading = ref(false);
const notice = ref("");
const highlighted = ref(-1);

let timer;
let controller;

function closeSuggestions() {
  clearTimeout(timer);
  controller?.abort();
  suggestions.value = [];
  loading.value = false;
  highlighted.value = -1;
}

function updateSearch(event) {
  closeSuggestions();
  notice.value = "";
  name.value = event.target.value;

  const query = name.value.trim();

  if (query.length < 2) return;

  timer = setTimeout(() => fetchSuggestions(query), 300);
}

async function fetchSuggestions(query) {
  const request = new AbortController();
  controller = request;
  loading.value = true;

  try {
    const response = await fetch(
      `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(query)}`,
      { signal: request.signal },
    );

    if (!response.ok) {
      throw new Error("Card search failed.");
    }

    const result = await response.json();

    if (request.signal.aborted) return;

    suggestions.value = result.data.slice(0, 8);

    if (!suggestions.value.length) {
      notice.value = "No matching cards found.";
    }
  } catch (error) {
    if (!request.signal.aborted) {
      notice.value = "Could not search for cards. Please try again.";
    }
  } finally {
    if (!request.signal.aborted) {
      loading.value = false;
    }
  }
}

function selectCard(suggestion) {
  closeSuggestions();
  notice.value = "";
  name.value = suggestion;
  emit("select", suggestion);
}

function moveSuggestion(direction) {
  const count = suggestions.value.length;
  if (!count) return;

  highlighted.value = (highlighted.value + direction + count) % count;
}

function selectHighlighted() {
  const suggestion = suggestions.value[highlighted.value] ?? suggestions.value[0];

  if (suggestion) selectCard(suggestion);
}

onBeforeUnmount(closeSuggestions);
</script>

<template>
  <div>
    <label for="add-card-name" class="form-label">Card name</label>

    <input
      id="add-card-name"
      :value="name"
      type="search"
      class="form-control"
      :class="{ 'has-suggestions': loading || suggestions.length > 0 }"
      placeholder="Search by card name..."
      autocomplete="off"
      role="combobox"
      aria-autocomplete="list"
      aria-controls="card-suggestions"
      :aria-expanded="suggestions.length > 0"
      :aria-activedescendant="highlighted >= 0 ? `card-option-${highlighted}` : undefined"
      @input="updateSearch"
      @blur="closeSuggestions"
      @keydown.down.prevent="moveSuggestion(1)"
      @keydown.up.prevent="moveSuggestion(-1)"
      @keydown.enter.prevent="selectHighlighted"
      @keydown.escape.stop="closeSuggestions" />

    <div v-if="loading || suggestions.length" class="card-suggestions">
      <p v-if="loading" class="card-suggestions-status" role="status">Searching Scryfall…</p>

      <ul
        id="card-suggestions"
        class="list-unstyled mb-0"
        role="listbox"
        aria-label="Matching cards">
        <li v-for="(suggestion, index) in suggestions" :key="suggestion">
          <button
            :id="`card-option-${index}`"
            type="button"
            class="card-suggestion"
            :class="{ 'is-highlighted': index === highlighted }"
            role="option"
            :aria-selected="index === highlighted"
            tabindex="-1"
            @mousedown.prevent
            @click="selectCard(suggestion)">
            {{ suggestion }}
          </button>
        </li>
      </ul>
    </div>

    <p v-if="notice" class="small text-secondary mt-2 mb-0" role="status">
      {{ notice }}
    </p>
  </div>
</template>

<style scoped></style>
