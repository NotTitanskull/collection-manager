// Shared reactive state: importing this module reuses the same ref across components.
import { ref, watch } from "vue";
import { sampleCards } from "../data/sampleCards.js";

// Browser storage is scoped to this origin (protocol, host, and port).
const STORAGE_KEY = "collection-manager:cards";

// Restore saved data, falling back when storage is absent, unreadable, or not an array.
function loadCollection() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved)) {
      return saved;
    }
  } catch (error) {
    console.warn("Could not load saved collection.", error);
  }

  // Clone nested arrays too, keeping edits separate from the imported seed data.
  return structuredClone(sampleCards);
}

export const collectionCards = ref(loadCollection());

// deep observes nested field edits; immediate also saves the initial state.
watch(
  collectionCards,
  (cards) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    } catch (error) {
      console.error("Could not save the collection.", error);
    }
  },
  { deep: true, immediate: true },
);
