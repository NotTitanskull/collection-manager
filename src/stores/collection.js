import { ref, watch } from "vue";
import { sampleCards } from "../data/cards.js";

const STORAGE_KEY = "collection-manager:cards";

function loadCollection() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved)) {
      return saved;
    }
  } catch (error) {
    console.warn("Could not load saved collection.", error);
  }

  return structuredClone(sampleCards);
}

export const collectionCards = ref(loadCollection());

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
