<script setup>
import ModalWrapper from '../shared/ModalWrapper.vue';

const props = defineProps({ binder: { type: Object, required: true } });
const emit = defineEmits(['close', 'deleted']);

function deleteBinder() {
  const id = props.binder.id;
  emit('deleted', id);
}
</script>

<template>
  <ModalWrapper
    aria-labelledby="delete-binder-title"
    aria-describedby="delete-binder-description"
    @close="emit('close')"
  >
    <div class="modal-content">
      <div class="modal-header">
        <h2 id="delete-binder-title" class="modal-title fs-5">Delete binder?</h2>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div id="delete-binder-description" class="modal-body">
        <p>
          Delete <strong>{{ binder.name }}</strong
          >?
        </p>
        <p class="text-secondary mb-0">
          Your cards will stay in your collection and any other binders. This binder’s name,
          description, and assignments will be removed.
        </p>
      </div>
      <div class="modal-footer justify-content-end">
        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
          Keep binder
        </button>
        <button type="button" class="btn btn-danger" @click="deleteBinder">Delete binder</button>
      </div>
    </div>
  </ModalWrapper>
</template>
