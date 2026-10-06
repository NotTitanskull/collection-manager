<script setup>
// Editable draft quantities; changes are applied only when the owning form saves.
import { binders } from '../../stores/binders.js';
import { totalAssigned } from '../../utils/binderQuantities.js';

const props = defineProps({ ownedQuantity: { type: Number, required: true } });
const assignments = defineModel({ type: Object, default: () => ({}) });
function toggle(id, selected) {
  const next = { ...assignments.value };
  if (selected) next[id] = 1;
  else delete next[id];
  assignments.value = next;
}
function setQuantity(id, value) {
  assignments.value = { ...assignments.value, [id]: value === '' ? '' : Number(value) };
}
function maximumFor(id) {
  const others = { ...assignments.value };
  delete others[id];
  return Math.max(0, props.ownedQuantity - totalAssigned(others));
}
</script>

<template>
  <fieldset class="binder-picker">
    <legend class="form-label">Binders</legend>
    <div v-if="binders.length" class="option-list">
      <div v-for="binder in binders" :key="binder.id" class="border rounded p-3">
        <label class="d-flex align-items-center justify-content-between gap-3">
          <span>
            <strong>{{ binder.name }}</strong>
            <small v-if="binder.description" class="d-block text-secondary">{{ binder.description }}</small>
          </span>
          <input type="checkbox" class="form-check-input flex-shrink-0"
            :checked="Object.hasOwn(assignments, binder.id)"
            :disabled="!Object.hasOwn(assignments, binder.id) && totalAssigned(assignments) >= ownedQuantity"
            @change="toggle(binder.id, $event.target.checked)" />
        </label>
        <div v-if="Object.hasOwn(assignments, binder.id)" class="mt-2">
          <label class="form-label small" :for="`binder-quantity-${binder.id}`">Copies in {{ binder.name }}</label>
          <input :id="`binder-quantity-${binder.id}`" :value="assignments[binder.id]"
            type="number" min="1" :max="maximumFor(binder.id)" step="1" class="form-control"
            :aria-invalid="!Number.isInteger(assignments[binder.id]) || assignments[binder.id] < 1 || assignments[binder.id] > maximumFor(binder.id)"
            @input="setQuantity(binder.id, $event.target.value)" />
        </div>
      </div>
    </div>
    <p v-if="binders.length" class="small mt-2 mb-0" :class="totalAssigned(assignments) > ownedQuantity ? 'text-danger' : 'text-secondary'" role="status">
      {{ totalAssigned(assignments) }} of {{ ownedQuantity }} copies assigned. Divide your owned copies across binders.
    </p>
    <p v-else class="small text-secondary mb-0">No binders yet. Create one on the Binders page, then select it here.</p>
  </fieldset>
</template>

<style scoped lang="scss">
.binder-picker {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
  legend { float: none; width: auto; font-size: 1rem; }
}
</style>
