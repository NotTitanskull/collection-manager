<script setup>
// Reusable checkbox group. Its v-model is an array of selected binder IDs.
import { binders } from "../stores/binders.js";

const selectedIds = defineModel({
  type: Array,
  default: () => [],
});
</script>

<template>
  <fieldset class="binder-picker">
    <legend class="form-label">Binders</legend>

    <div v-if="binders.length" class="option-list">
      <label v-for="binder in binders" :key="binder.id" class="option-control">
        <span>
          <strong>{{ binder.name }}</strong>
          <small v-if="binder.description">
            {{ binder.description }}
          </small>
        </span>

        <input v-model="selectedIds" type="checkbox" class="form-check-input" :value="binder.id" />
      </label>
    </div>

    <p v-else class="small text-secondary mb-0">
      No binders yet. Create one on the Binders page, then select it here.
    </p>
  </fieldset>
</template>

<style scoped lang="scss">
// Limit a long binder list’s height while allowing the choices to scroll.
.binder-picker {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;

  legend {
    float: none;
    width: auto;
    font-size: 1rem;
  }
}
</style>
