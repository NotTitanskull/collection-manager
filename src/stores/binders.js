import { ref, watch } from "vue";

const STORAGE_KEY = "collection-manager:binders";

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
