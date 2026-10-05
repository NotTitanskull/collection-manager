// Shared reactive state: importing this module reuses the same ref across components.
import { ref, watch } from "vue";

// Browser storage is scoped to this origin (protocol, host, and port).
const STORAGE_KEY = "collection-manager:binders";

// Restore saved data, falling back when storage is absent, unreadable, or not an array.
function loadBinders() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (Array.isArray(saved)) {
      return saved;
    }
  } catch (error) {
    console.warn("Could not load saved binders.", error);
  }

  return [];
}

export const binders = ref(loadBinders());

// deep observes nested field edits; immediate also saves the initial state.
watch(
  binders,
  (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch (error) {
      console.error("Could not save binders.", error);
    }
  },
  { deep: true, immediate: true },
);
