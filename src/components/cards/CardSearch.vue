<script setup>
// Reusable Scryfall autocomplete. v-model holds typed text; select emits a chosen name.
import { onBeforeUnmount, ref } from 'vue';

const name = defineModel({ type: String, required: true });
const emit = defineEmits(['select']);

const suggestions = ref([]);
const loading = ref(false);
const notice = ref('');
const highlighted = ref(-1);
let timer;
let controller;

/** Cancel pending work so an outdated response cannot reopen the suggestions. */
function closeSuggestions() {
  clearTimeout(timer);
  controller?.abort();
  suggestions.value = [];
  loading.value = false;
  highlighted.value = -1;
}

/** Search committed text only; v-model handles native text composition. */
function updateSearch(event) {
  if (event.isComposing || event.target.composing) return;

  closeSuggestions();
  notice.value = '';

  const query = event.target.value.trim();

  if (query.length < 2) return;

  timer = setTimeout(() => fetchSuggestions(query), 300);
}

/** Request matching names; AbortController lets a newer search cancel this one. */
async function fetchSuggestions(query) {
  const request = new AbortController();
  controller = request;
  loading.value = true;

  try {
    const response = await fetch(
      `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(query)}`,
      { signal: request.signal }
    );

    if (!response.ok) {
      throw new Error('Card search failed.');
    }

    const result = await response.json();

    if (request.signal.aborted) return;

    suggestions.value = result.data.slice(0, 8);

    if (!suggestions.value.length) {
      notice.value = 'No matching cards found.';
    }
  } catch (error) {
    if (!request.signal.aborted) {
      notice.value = 'Could not search for cards. Please try again.';
    }
  } finally {
    if (!request.signal.aborted) {
      loading.value = false;
    }
  }
}

/** Commit a suggestion and notify the parent to load that card’s printings. */
function selectCard(suggestion) {
  closeSuggestions();
  notice.value = '';
  name.value = suggestion;
  emit('select', suggestion);
}

/** Consume Escape only for an open suggestion list; otherwise the dialog can close. */
function dismissSuggestions(event) {
  if (loading.value || suggestions.value.length) {
    event.stopPropagation();
    closeSuggestions();
  }
}

/** Move the keyboard highlight, wrapping at either end of the suggestion list. */
function moveSuggestion(direction) {
  const count = suggestions.value.length;
  if (!count) return;

  highlighted.value = (highlighted.value + direction + count) % count;
}

/** Select the highlighted suggestion, or the first result if none is highlighted. */
function selectHighlighted() {
  const suggestion = suggestions.value[highlighted.value] ?? suggestions.value[0];

  if (suggestion) selectCard(suggestion);
}

/** Let native text suggestions finish before handling the card list's shortcuts. */
function handleKeydown(event) {
  // Older Safari versions can report isComposing=false for the confirming key.
  // keyCode 229 is a compatibility fallback for that native composition event.
  if (event.isComposing || event.target.composing || event.keyCode === 229) {
    // Keep Escape from dismissing the Bootstrap modal while native input owns it.
    // Do not preventDefault: the browser still needs to accept or dismiss its suggestion.
    event.stopPropagation();
    return;
  }

  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    if (!suggestions.value.length) return;
    event.preventDefault();
    moveSuggestion(event.key === 'ArrowDown' ? 1 : -1);
  } else if (event.key === 'Enter') {
    event.preventDefault();
    selectHighlighted();
  } else if (event.key === 'Escape') {
    dismissSuggestions(event);
  }
}

onBeforeUnmount(closeSuggestions);
</script>

<template>
  <div>
    <label for="add-card-name" class="form-label">Card name</label>

    <input
      id="add-card-name"
      v-model="name"
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
      @compositionstart="closeSuggestions"
      @input="updateSearch"
      @blur="closeSuggestions"
      @keydown="handleKeydown"
    />

    <div v-if="loading || suggestions.length" class="card-suggestions">
      <p v-if="loading" class="card-suggestions-status" role="status">Searching Scryfall…</p>

      <ul
        id="card-suggestions"
        class="list-unstyled mb-0"
        role="listbox"
        aria-label="Matching cards"
      >
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
            @click="selectCard(suggestion)"
          >
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

<style scoped lang="scss">
// Position the autocomplete list above nearby content and show the keyboard highlight.
@use '../../styles/variables' as theme;

.card-suggestions {
  position: relative;
  z-index: 2;
  margin-top: -0.35rem;
  overflow: hidden;
  background: theme.$surface-color;
  border: 1px solid theme.$suggestion-border;
  border-top: 0;
  border-radius: 0 0 0.5rem 0.5rem;
  box-shadow: 0 0.4rem 0.8rem rgba(35, 54, 89, 0.08);
}
.has-suggestions {
  border-bottom-right-radius: 0;
  border-bottom-left-radius: 0;
}
.card-suggestions-status {
  margin: 0;
  padding: 0.7rem 1rem;
  color: theme.$text-muted;
  font-size: 0.8rem;
}
.card-suggestion {
  display: block;
  width: 100%;
  padding: 0.7rem 1rem;
  border: 0;
  border-top: 1px solid theme.$subtle-border;
  background: theme.$surface-color;
  color: theme.$text-color;
  font-size: 0.9rem;
  text-align: left;
  transition:
    background-color 120ms ease,
    color 120ms ease;
}
.card-suggestion:hover,
.card-suggestion.is-highlighted {
  background: theme.$accent-background;
  color: theme.$accent-color;
}
.card-suggestion:focus-visible {
  position: relative;
  z-index: 1;
  outline: 2px solid theme.$accent-color;
  outline-offset: -2px;
}
</style>
