<script setup>
import ConditionBadge from '../cards/ConditionBadge.vue';
// Selects owned entries for a trade draft; emits IDs without changing the collection.
import ModalWrapper from '../ui/ModalWrapper.vue';
import { computed, ref } from 'vue';
import { collectionCards } from '../../stores/collection.js';

const props = defineProps({
  selectedIds: {
    type: Array,
    default: () => [],
  },
});
const emit = defineEmits(['add', 'close']);
const search = ref('');
const tradeOnly = ref(false);
const checkedIds = ref([]);
const availableCards = computed(() =>
  collectionCards.value.filter(
    (card) => card.quantity > 0 && !props.selectedIds.includes(card.entryId),
  ),
);
const matchingCards = computed(() => {
  const query = search.value.trim().toLowerCase();
  return availableCards.value.filter(
    (card) =>
      (!tradeOnly.value || card.trade) &&
      `${card.name} ${card.printing}`.toLowerCase().includes(query),
  );
});
// Recheck availability and send selected entry IDs to the parent draft.
function addSelected() {
  const ids = availableCards.value
    .filter((card) => checkedIds.value.includes(card.entryId))
    .map((card) => card.entryId);
  if (!ids.length) return;
  emit('add', ids);
  emit('close');
}
</script>

<template>
  <ModalWrapper
    aria-labelledby="trade-picker-title"
    id="trade-picker-modal"
    large
    @close="emit('close')"
  >
    <form class="modal-content" @submit.prevent="addSelected">
      <div class="modal-header">
        <h2 id="trade-picker-title" class="modal-title fs-5">Choose cards you give</h2>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body dialog-form">
        <section class="form-section">
          <p>
            Select collection entries. Each starts at one copy; adjust quantities on the Trade page.
          </p>
          <label for="trade-picker-search" class="form-label">Search your collection</label>
          <input
            id="trade-picker-search"
            v-model="search"
            type="search"
            class="form-control mb-3"
            placeholder="Card name or printing"
          />
          <div class="form-check mb-3">
            <input id="trade-only" v-model="tradeOnly" type="checkbox" class="form-check-input" />
            <label for="trade-only" class="form-check-label">
              Only cards marked available for trade
            </label>
          </div>
          <div class="option-list">
            <label v-for="card in matchingCards" :key="card.entryId" class="option-control">
              <span>
                <strong>{{ card.name }}</strong>
                <small>
                  {{ card.printing }} ·
                  {{ card.finish === 'etched' ? 'Etched foil' : card.isFoil ? 'Foil' : 'Nonfoil' }}
                </small>
                <small><ConditionBadge :condition="card.condition" /> · {{ card.quantity }} owned</small>
              </span>
              <input
                v-model="checkedIds"
                :value="card.entryId"
                type="checkbox"
                class="form-check-input"
              />
            </label>
          </div>
          <p v-if="!matchingCards.length" class="text-secondary mb-0">
            No available cards match. Entries already added are excluded.
          </p>
        </section>
      </div>
      <div class="modal-footer justify-content-between">
        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" :disabled="!checkedIds.length">
          Add selected ({{ checkedIds.length }})
        </button>
      </div>
    </form>
  </ModalWrapper>
</template>
