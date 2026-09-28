<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { binders } from "../stores/binders.js";
import { collectionCards } from "../stores/collection.js";

const props = defineProps({
  binder: {
    type: Object,
    default: null,
  },
});

const modalElement = ref(null);
const name = ref("");
const description = ref("");
const color = ref("blue");
const confirmingDeletion = ref(false);

const colors = [
  { value: "blue", label: "Blue" },
  { value: "purple", label: "Purple" },
  { value: "green", label: "Green" },
];

const duplicateName = computed(() => {
  const value = name.value.trim().toLowerCase();
  return value === "favorites" || binders.value.some((binder) =>
    binder.id !== props.binder?.id && binder.name.trim().toLowerCase() === value,
  );
});
const canSave = computed(() => name.value.trim().length > 0 && !duplicateName.value);

async function resetForm() {
  await nextTick();
  confirmingDeletion.value = false;
  name.value = props.binder?.name ?? "";
  description.value = props.binder?.description ?? "";
  color.value = props.binder?.color ?? "blue";
}

function saveBinder() {
  if (!canSave.value || confirmingDeletion.value) return;

  const values = {
    name: name.value.trim(),
    description: description.value.trim(),
    color: color.value,
  };

  if (props.binder) {
    const binder = binders.value.find((entry) => entry.id === props.binder.id);

    if (!binder) return;

    Object.assign(binder, values);
  } else {
    binders.value.push({
      id: crypto.randomUUID(),
      ...values,
    });
  }

  window.bootstrap.Modal.getInstance(modalElement.value)?.hide();
}

function deleteBinder() {
  if (!props.binder || !confirmingDeletion.value) return;

  const id = props.binder.id;
  const index = binders.value.findIndex((binder) => binder.id === id);
  if (index === -1) return;

  for (const card of collectionCards.value) {
    if (card.binderIds?.includes(id)) {
      card.binderIds = card.binderIds.filter((binderId) => binderId !== id);
    }
  }

  binders.value.splice(index, 1);
  window.bootstrap.Modal.getInstance(modalElement.value)?.hide();
}

onMounted(() => {
  modalElement.value.addEventListener("show.bs.modal", resetForm);
});

onBeforeUnmount(() => {
  modalElement.value.removeEventListener("show.bs.modal", resetForm);
});
</script>

<template>
  <div
    id="binder-modal"
    ref="modalElement"
    class="modal fade"
    tabindex="-1"
    aria-labelledby="binder-modal-title"
    aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
      <form class="modal-content" @submit.prevent="saveBinder">
        <div class="modal-header">
          <h2 id="binder-modal-title" class="modal-title fs-5">
            {{ binder ? "Edit Binder" : "Create Binder" }}
          </h2>

          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"></button>
        </div>

        <div class="modal-body dialog-form">
          <section class="form-section" aria-labelledby="binder-details-title">
            <div class="section-heading">
              <div>
                <h3 id="binder-details-title">Binder details</h3>
                <p>Give your binder a name and an optional description.</p>
              </div>
            </div>

            <div class="mb-3">
              <label for="binder-name" class="form-label">Name</label>
              <input
                id="binder-name"
                v-model="name"
                :aria-invalid="duplicateName"
                aria-describedby="binder-name-help"
                type="text"
                class="form-control"
                placeholder="e.g. Commander Staples"
                required />
              <p id="binder-name-help" class="small mt-2 mb-0" :class="duplicateName ? 'text-danger' : 'text-secondary'">
                {{ duplicateName ? "Choose a different name. That binder name is already in use." : "Use a unique name. Favorites is an automatic binder." }}
              </p>
            </div>

            <div>
              <label for="binder-description" class="form-label">Description (optional)</label>
              <textarea
                id="binder-description"
                v-model="description"
                class="form-control"
                rows="3"></textarea>
            </div>
          </section>

          <section class="form-section" aria-labelledby="binder-color-title">
            <div class="section-heading">
              <div>
                <h3 id="binder-color-title">Cover color</h3>
                <p>Choose a color to help identify this binder.</p>
              </div>
            </div>

            <div role="group" aria-labelledby="binder-color-title" class="d-flex flex-wrap gap-3">
              <div v-for="option in colors" :key="option.value" class="form-check">
                <input
                  :id="`binder-color-${option.value}`"
                  v-model="color"
                  class="form-check-input"
                  type="radio"
                  name="binder-color"
                  :value="option.value" />
                <label class="form-check-label" :for="`binder-color-${option.value}`">
                  {{ option.label }}
                </label>
              </div>
            </div>
          </section>
          <div v-if="binder">
            <div v-if="confirmingDeletion" class="alert alert-danger mb-0" role="alert">
              <p>
                Delete <strong>{{ binder.name }}</strong>? Its cards will stay in your
                collection and any other assigned binders.
              </p>
              <div class="d-flex flex-wrap gap-2">
                <button type="button" class="btn btn-outline-secondary"
                  @click="confirmingDeletion = false">Keep Binder</button>
                <button type="button" class="btn btn-danger" @click="deleteBinder">
                  Confirm Delete
                </button>
              </div>
            </div>
            <button v-else type="button" class="btn btn-outline-danger"
              @click="confirmingDeletion = true">Delete Binder</button>
          </div>
        </div>

        <div class="modal-footer justify-content-between">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
            Cancel
          </button>

          <button type="submit" class="btn btn-primary" :disabled="!canSave || confirmingDeletion">
            {{ binder ? "Save Changes" : "Create Binder" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
