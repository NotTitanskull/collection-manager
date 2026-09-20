const BinderPicker = {
  props: {
    modelValue: { type: Array, default: () => [] },
    binders: { type: Array, required: true },
    pickerId: { type: String, required: true },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      query: "",
      selected: [...this.modelValue],
      isOpen: false,
    };
  },
  computed: {
    filteredBinders() {
      const normalizedQuery = this.query.trim().toLowerCase();
      return this.binders.filter(
        (binder) => !normalizedQuery || binder.name.toLowerCase().includes(normalizedQuery),
      );
    },
    selectedCount() {
      return this.binders.filter((binder) => this.selected.includes(binder.id)).length;
    },
    selectedLabel() {
      if (!this.selectedCount) return "No custom binders selected";
      return `${this.selectedCount} binder${this.selectedCount === 1 ? "" : "s"} selected`;
    },
  },
  watch: {
    modelValue(value) {
      this.selected = [...value];
    },
  },
  methods: {
    trapTab(event) {
      const controls = [
        this.$refs.close,
        this.$refs.search,
        ...(this.$refs.choices || []),
        this.$refs.done,
      ];
      const index = controls.indexOf(event.target);
      const next = (index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length;
      event.preventDefault();
      controls[next].focus();
    },
    toggleBinder(binderId) {
      this.selected = this.selected.includes(binderId)
        ? this.selected.filter((id) => id !== binderId)
        : [...this.selected, binderId];
    },
    commitSelection() {
      this.$emit("update:modelValue", [...this.selected]);
      this.closePicker();
    },
    async openPicker() {
      this.selected = [...this.modelValue];
      this.isOpen = true;
      await this.$nextTick();
      this.$refs.search.focus();
    },
    async closePicker() {
      this.isOpen = false;
      this.query = "";
      await this.$nextTick();
      this.$refs.trigger.focus();
    },
  },
  template: `
    <div class="binder-picker">
      <div class="d-flex align-items-center justify-content-between gap-3">
        <div>
          <span class="form-label d-block mb-1">Binders</span>
          <small class="text-secondary">{{ selectedLabel }}</small>
        </div>
        <button
          type="button"
          class="btn btn-outline-secondary btn-sm"
          ref="trigger" @click="openPicker" :aria-expanded="isOpen"
          :aria-controls="pickerId">
          Choose binders
        </button>
      </div>

      <div
        v-if="isOpen"
        class="binder-picker-backdrop"
        aria-hidden="true"
        @click="closePicker"></div>
      <div
        v-if="isOpen"
        class="offcanvas offcanvas-end show binder-picker-panel"
        tabindex="-1"
        :id="pickerId"
        :aria-labelledby="pickerId + '-title'"
        aria-modal="true"
        role="dialog" @keydown.esc.stop.prevent="closePicker" @keydown.tab="trapTab">
        <div class="offcanvas-header">
          <div>
            <h2 class="offcanvas-title fs-5" :id="pickerId + '-title'">Choose binders</h2>
            <p class="small text-secondary mb-0">{{ selectedLabel }}</p>
          </div>
          <button type="button" ref="close" class="btn-close" aria-label="Close" @click="closePicker"></button>
        </div>
        <div class="offcanvas-body">
          <label class="visually-hidden" :for="pickerId + '-search'">Search binders</label>
          <input
            class="form-control mb-3"
            type="search"
            :id="pickerId + '-search'"
            ref="search" v-model="query"
            placeholder="Search binders…" />
          <div class="binder-picker-list">
            <label v-for="binder in filteredBinders" :key="binder.id" class="option-control">
              <strong>{{ binder.name }}</strong>
              <input
                ref="choices" type="checkbox"
                class="form-check-input"
                :checked="selected.includes(binder.id)"
                @change="toggleBinder(binder.id)" />
            </label>
            <p v-if="!filteredBinders.length" class="small text-secondary mb-0">
              No matching binders.
            </p>
          </div>
        </div>
        <div class="offcanvas-footer p-3 border-top">
          <button type="button" class="btn btn-primary w-100" ref="done" @click="commitSelection">
            Done
          </button>
        </div>
      </div>
    </div>
  `,
};
