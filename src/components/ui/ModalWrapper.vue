<script setup>
// Vue owns the form's lifetime; Bootstrap owns modal behavior and layout.
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { Modal } from 'bootstrap';

defineProps({ large: { type: Boolean, default: false } });
const emit = defineEmits(['close']);
const modalElement = ref(null);
let modal;
let opener;

function handleHidden() {
  // Programmatically opened modals need to restore focus to their Vue trigger.
  if (opener?.isConnected) opener.focus();
  emit('close');
}

onMounted(() => {
  opener = document.activeElement;
  modalElement.value.addEventListener('hidden.bs.modal', handleHidden);
  modal = new Modal(modalElement.value);
  modal.show();
});

onBeforeUnmount(() => {
  modalElement.value.removeEventListener('hidden.bs.modal', handleHidden);
  // No fade class: hide completes before Vue removes the element, including on navigation.
  modal.hide();
  modal.dispose();
  if (opener?.isConnected) opener.focus();
});
</script>

<template>
  <div ref="modalElement" class="modal" tabindex="-1" aria-hidden="true">
    <div
      class="modal-dialog modal-dialog-centered modal-dialog-scrollable"
      :class="{ 'modal-lg': large }"
    >
      <slot />
    </div>
  </div>
</template>
