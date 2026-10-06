<script setup>
// Shared printing summary for card-related dialogs.
defineProps({ card: { type: Object, required: true } });
</script>

<template>
<section class="form-section card-summary" aria-label="Selected card">
  <img v-if="card.image" :src="card.image" :alt="card.name" />
  <div>
    <h3 class="h5 mb-1">{{ card.name }}</h3>
    <p class="small text-secondary mb-1">{{ card.type }}</p>
    <p class="small text-secondary mb-2">{{ card.printing }}</p>
    <span class="badge text-bg-light">
      {{ card.finish === "etched" ? "Etched foil" : card.isFoil ? "Foil" : "Nonfoil" }}
    </span>
  </div>
</section>
</template>

<style scoped lang="scss">
// Keep the selected card preview and its identifying text together.
.card-summary {
  display: flex;
  align-items: center;
  gap: 1rem;

  img {
    width: 5rem;
    flex-shrink: 0;
    border-radius: 0.375rem;
  }

  > div {
    min-width: 0;
    overflow-wrap: anywhere;
  }
}
</style>
