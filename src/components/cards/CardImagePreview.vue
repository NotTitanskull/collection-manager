<script setup>
// ref stores changing state; computed derives a value; watch reacts with an action.
import { computed, ref, watch } from 'vue';

// The parent supplies a card and chooses between the preview and full-image view.
const props = defineProps({
  card: { type: Object, required: true },
  full: Boolean,
});

const emit = defineEmits(['preview']);

// These refs start at false. Their .value changes when an image fails to load.
const fallback = ref(false);
const unavailable = ref(false);

// A template ref: Vue puts the rendered image button here instead of a Boolean.
const trigger = ref(null);

// Vue tracks the values read here and caches the resulting URL until they change.
const source = computed(() => {
  if (fallback.value || !props.card.image) {
    return props.card.image;
  }

  try {
    const url = new URL(props.card.image);

    // Request a sharper Scryfall image without changing URLs from other providers.
    if (url.hostname === 'cards.scryfall.io') {
      url.pathname = url.pathname.replace('/normal/', '/large/');
    }

    return url.href;
  } catch {
    return props.card.image;
  }
});

/** Retry with the saved image URL once; show a message if that also fails. */
function handleError() {
  if (fallback.value || source.value === props.card.image) {
    unavailable.value = true;
  } else {
    fallback.value = true;
  }
}

// Selecting a different printing gives its image a fresh attempt to load.
watch(
  () => props.card.image,
  () => {
    fallback.value = false;
    unavailable.value = false;
  },
);

// Let the parent restore keyboard focus after returning from the full-image view.
defineExpose({ focus: () => trigger.value?.focus() });
</script>

<template>
  <section class="image-stage" :class="{ 'full-image': full }" aria-label="Card image">
    <!-- Exactly one branch renders: missing image, full image, or clickable preview. -->
    <p v-if="!card.image || unavailable" class="text-secondary mb-0">
      No image available for this printing.
    </p>

    <template v-else-if="full">
      <img :src="source" :alt="`${card.name} — ${card.printing}`" @error="handleError" />
      <a :href="source" target="_blank" rel="noopener noreferrer" class="small mt-3"
        >Open original image<span class="visually-hidden"> in a new tab</span></a
      >
    </template>

    <button
      v-else
      ref="trigger"
      type="button"
      class="image-trigger"
      :aria-label="`View full image of ${card.name}`"
      @click="emit('preview')"
    >
      <img :src="source" :alt="`${card.name} — ${card.printing}`" @error="handleError" />
    </button>
  </section>
</template>

<style scoped>
/* The image stage controls the surrounding space, not the image resolution. */
.image-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: var(--bs-tertiary-bg);
}

/* Cap the ordinary preview width so the card details have room below it. */
.image-trigger {
  width: min(100%, 16rem);
  padding: 0;
  border: 0;
  background: transparent;
  border-radius: 0.75rem;
  cursor: zoom-in;
}

.image-trigger img {
  width: auto;
  max-width: 100%;
  max-height: 36dvh; /* At most 36% of the current viewport height. */
  margin-inline: auto;
}

/* Make keyboard focus visible without adding a permanent button border. */
.image-trigger:focus-visible {
  outline: 3px solid var(--bs-primary);
  outline-offset: 5px;
}

img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 0.75rem;
}

/* The reading view has its own larger limit; contain prevents cropping. */
.full-image img {
  width: auto;
  max-width: 100%;
  max-height: calc(100dvh - 12rem); /* Reserve space for modal controls and padding. */
  object-fit: contain;
}

/* Short windows need a smaller preview to keep the variant controls accessible. */
@media (max-height: 700px) {
  .image-stage:not(.full-image) {
    padding: 0.75rem;
  }

  .image-trigger img {
    max-height: 25dvh;
  }
}
</style>
