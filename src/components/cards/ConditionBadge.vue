<script setup>
// One palette keeps condition labels consistent across collection and trade views.
import { computed } from 'vue';
const props = defineProps({ condition: { type: String, required: true } });
const colors = {
  'Near Mint': 'mint',
  'Lightly Played': 'light',
  'Moderately Played': 'moderate',
  'Heavily Played': 'heavy',
  Damaged: 'damaged',
};
const tone = computed(() => colors[props.condition] ?? 'unknown');
</script>

<template>
  <span class="badge condition-badge" :class="`condition-${tone}`">{{ condition }}</span>
</template>

<style scoped>
.condition-badge {
  background: #edf0f2;
  color: #414950;
}
.condition-mint {
  background: #dcefe4;
  color: #185b37;
}
.condition-light {
  background: #dfeafb;
  color: #244f89;
}
.condition-moderate {
  background: #fff0c7;
  color: #755400;
}
.condition-heavy {
  background: #ffe3cd;
  color: #88410d;
}
.condition-damaged {
  background: #f9dfe3;
  color: #902d3d;
}
</style>
