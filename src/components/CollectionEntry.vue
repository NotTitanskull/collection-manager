<script setup>
defineProps({
  card: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <li class="collection-row">
    <img class="card-thumbnail" :src="card.image" :alt="card.name" />

    <div class="card-details">
      <h2 class="h6 mb-1">{{ card.name }}</h2>

      <p class="small text-secondary mb-1">
        {{ card.type }}
      </p>

      <p class="small text-secondary mb-2">
        {{ card.printing }} · {{ card.isFoil ? "Foil" : "Nonfoil" }}
      </p>

      <div class="d-flex align-items-center gap-2">
        <span class="badge text-bg-light">{{ card.condition }}</span>
        <span class="small">×{{ card.quantity }}</span>
      </div>
    </div>
  </li>
</template>
