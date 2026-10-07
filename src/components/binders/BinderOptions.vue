<script setup>
import { onBeforeUnmount, ref } from 'vue';
import { Dropdown } from 'bootstrap';

defineProps({
  small: { type: Boolean, default: false },
  iconOnly: { type: Boolean, default: false },
  settings: { type: Boolean, default: false },
  binderName: { type: String, required: true },
});
const emit = defineEmits(['edit', 'delete']);
const trigger = ref(null);

// Bootstrap owns opening, positioning, dismissal, and keyboard navigation.
onBeforeUnmount(() => Dropdown.getInstance(trigger.value)?.dispose());
</script>

<template>
  <div class="dropdown">
    <button
      ref="trigger"
      type="button"
      class="btn d-inline-flex align-items-center justify-content-center gap-2"
      :class="{
        'btn-sm': small,
        'btn-outline-secondary': !iconOnly,
        'binder-options-icon': iconOnly,
        'binder-settings': settings,
      }"
      data-bs-toggle="dropdown"
      aria-expanded="false"
      :aria-label="`${settings ? 'Binder settings' : 'Binder options'} for ${binderName}`"
    >
      <svg
        v-if="settings"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="m9.5 3-.5 2-2 1.2-2-.6-2.5 4.3 1.5 1.4v2.4L2 15.1l2.5 4.3 2-.6 2 1.2.5 2h5l.5-2 2-1.2 2 .6 2.5-4.3-1.5-1.4v-2.4L21 9.9l-2.5-4.3-2 .6-2-1.2-.5-2z"
        />
        <circle cx="12" cy="12.5" r="3" />
      </svg>
      <span v-if="settings" class="d-none d-lg-inline">Binder settings</span>
      <span v-else-if="!iconOnly">Binder options</span>
      <svg
        v-if="!settings"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="3" cy="8" r="1.5" />
        <circle cx="8" cy="8" r="1.5" />
        <circle cx="13" cy="8" r="1.5" />
      </svg>
    </button>
    <ul class="dropdown-menu dropdown-menu-end">
      <li>
        <button type="button" class="dropdown-item" @click="emit('edit')">Edit binder</button>
      </li>
      <li><hr class="dropdown-divider" /></li>
      <li>
        <button type="button" class="dropdown-item text-danger" @click="emit('delete')">
          Delete binder
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.binder-options-icon {
  width: 2.75rem;
  height: 2.75rem;
  padding: 0;
  border: 0;
  color: var(--bs-secondary-color);
}
.binder-options-icon:hover,
.binder-options-icon[aria-expanded='true'] {
  background-color: var(--bs-tertiary-bg);
}
.binder-options-icon:focus-visible {
  outline: 2px solid var(--bs-primary);
  outline-offset: 2px;
}
@media (max-width: 991.98px) {
  .binder-settings {
    width: 2.75rem;
    height: 2.75rem;
    padding: 0;
    border: 0;
    border-radius: var(--bs-border-radius);
    --bs-btn-hover-bg: var(--bs-tertiary-bg);
    --bs-btn-hover-color: var(--bs-secondary-color);
    --bs-btn-active-bg: var(--bs-tertiary-bg);
    --bs-btn-active-color: var(--bs-secondary-color);
  }
}
</style>
