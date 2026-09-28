<script setup>
defineProps({
  card: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["manage"]);
</script>

<template>
  <li class="collection-row">
    <button
      type="button"
      class="collection-entry"
      :aria-label="`Manage ${card.name}`"
      data-bs-toggle="modal"
      data-bs-target="#manage-card-modal"
      @click="emit('manage', card)">
      <img class="card-thumbnail" :src="card.image" :alt="''" />

      <span class="card-details">
        <span class="card-name h6 mb-1">{{ card.name }}</span>

        <span class="small text-secondary mb-1">
          {{ card.type }}
        </span>

        <span class="small text-secondary mb-2">
          {{ card.printing }} · {{ card.finish === "etched" ? "Etched foil" : card.isFoil ? "Foil" : "Nonfoil" }}
        </span>

        <span class="d-flex align-items-center gap-2">
          <span class="badge text-bg-light">{{ card.condition }}</span>
          <span class="small">×{{ card.quantity }}</span>
        </span>
      </span>
    </button>
  </li>
</template>

<style scoped lang="scss">
@use "../assets/scss/variables" as theme;

.collection-row {
  border-bottom: 1px solid theme.$row-border;
}

.collection-entry {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  padding: 1rem 0.5rem;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  border-radius: 0.375rem;

  &:hover {
    background-color: rgba(0, 0, 0, 0.035);
  }

  &:focus-visible {
    outline: 2px solid var(--bs-primary);
    outline-offset: -2px;
  }
}

.card-thumbnail {
  width: 50px;
  height: 70px;
  object-fit: contain;
  flex-shrink: 0;
  border-radius: 4px;
}

.card-details {
  flex: 1;
  min-width: 0;

  > span {
    display: block;
  }
}
</style>