<script setup>
// Shared floating action; Bootstrap supplies its button, shape, shadow, and focus styles.
defineProps({ label: { type: String, required: true } });
const emit = defineEmits(['click']);
</script>

<template>
  <button
    type="button"
    class="btn btn-primary rounded-pill position-fixed shadow d-flex align-items-center justify-content-center floating-add-button"
    :aria-label="label"
    :title="label"
    @click="emit('click')"
  >
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
    <span class="d-none d-lg-inline" aria-hidden="true">{{ label }}</span>
  </button>
</template>

<style scoped lang="scss">
.floating-add-button {
  right: calc(1.5rem + env(safe-area-inset-right));
  bottom: calc(1.5rem + env(safe-area-inset-bottom));
  z-index: 1030;
  width: 3.5rem;
  height: 3.5rem;
  padding: 0;

  // The desktop version has room for a visible action label.
  @media (min-width: 992px) {
    width: auto;
    padding-inline: 1.25rem;
    gap: 0.5rem;
  }

  // Stay above mobile navigation and below Bootstrap's modal backdrop.
  @media (max-width: 767.98px) {
    right: calc(1rem + env(safe-area-inset-right));
    bottom: calc(var(--mobile-nav-height) + env(safe-area-inset-bottom) + 1rem);
  }
}
</style>
