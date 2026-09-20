const CardSearch = {
  props: {
    modelValue: { type: String, required: true },
    suggestions: { type: Array, required: true },
    loading: { type: Boolean, default: false },
    notice: { type: String, default: "" },
    error: { type: Boolean, default: false },
  },
  emits: ["update:modelValue", "select", "close"],
  data() {
    return {
      highlightedSuggestion: -1,
    };
  },
  computed: {
    hasSuggestions() {
      return this.loading || this.suggestions.length > 0;
    },
  },
  watch: {
    suggestions() {
      this.highlightedSuggestion = -1;
    },
  },
  methods: {
    updateValue(event) {
      this.$emit("update:modelValue", event.target.value);
    },
    moveSuggestion(direction) {
      if (!this.suggestions.length) return;
      const next = this.highlightedSuggestion + direction;
      this.highlightedSuggestion =
        next < 0 ? this.suggestions.length - 1 : next >= this.suggestions.length ? 0 : next;
    },
    selectHighlightedSuggestion() {
      const suggestion = this.suggestions[this.highlightedSuggestion] || this.suggestions[0];
      if (suggestion) this.$emit("select", suggestion);
    },
    selectSuggestion(suggestion) {
      this.highlightedSuggestion = -1;
      this.$emit("select", suggestion);
    },
    closeSuggestions() {
      this.highlightedSuggestion = -1;
      this.$emit("close");
    },
  },
  template: `
    <div>
      <label for="add-card-name" class="form-label">Card name</label>
      <input
        id="add-card-name"
        type="search"
        class="form-control"
        :class="{ 'has-suggestions': hasSuggestions }"
        placeholder="Search by card name…"
        :value="modelValue"
        autocomplete="off"
        role="combobox"
        :aria-expanded="suggestions.length > 0"
        aria-controls="card-suggestions" aria-autocomplete="list"
        :aria-activedescendant="highlightedSuggestion >= 0 ? 'card-option-' + highlightedSuggestion : undefined"
        @input="updateValue"
        @keydown.down.prevent="moveSuggestion(1)"
        @keydown.up.prevent="moveSuggestion(-1)"
        @keydown.enter.prevent="selectHighlightedSuggestion"
        @keydown.escape.stop="closeSuggestions" />
      <div v-if="hasSuggestions" class="card-suggestions">
        <p v-if="loading" class="card-suggestions-status">Searching Scryfall…</p>
        <ul v-else id="card-suggestions" class="list-unstyled mb-0" role="listbox">
          <li v-for="(suggestion, index) in suggestions" :key="suggestion">
            <button
              type="button"
              class="card-suggestion"
              :class="{ 'is-highlighted': index === highlightedSuggestion }"
              role="option" :id="'card-option-' + index" tabindex="-1"
              :aria-selected="index === highlightedSuggestion"
              @mousedown.prevent
              @click="selectSuggestion(suggestion)">
              {{ suggestion }}
            </button>
          </li>
        </ul>
      </div>
      <p v-if="notice" class="small mt-2 mb-0" :class="error ? 'text-danger' : 'text-secondary'">
        {{ notice }}
      </p>
    </div>
  `,
};
