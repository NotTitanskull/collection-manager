<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import CardSearch from "./CardSearch.vue";
import { collectionCards } from "../stores/collection.js";

const draft = ref({
  name: "",
  printingId: "",
  condition: "Near Mint",
  quantity: 1,
  isFoil: false,
  favorite: false,
  trade: false,
});

const printings = ref([]);
const loadingPrintings = ref(false);
const printingError = ref("");

let printingRequest;

function clearPrintings() {
  printingRequest?.abort();
  printings.value = [];
  draft.value.printingId = "";
  draft.value.isFoil = false;
  loadingPrintings.value = false;
  printingError.value = "";
}

async function loadPrintings(name) {
  clearPrintings();

  const request = new AbortController();
  printingRequest = request;
  loadingPrintings.value = true;

  const query = `!"${name}" game:paper`;
  let url =
    `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}` +
    "&unique=prints&order=released";

  const results = [];

  try {
    while (url) {
      if (request.signal.aborted) return;

      const response = await fetch(url, {
        signal: request.signal,
      });

      if (!response.ok) {
        throw new Error("Could not load printings.");
      }

      const result = await response.json();

      if (request.signal.aborted) return;

      results.push(...result.data);
      url = result.has_more ? result.next_page : null;

      if (url) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    if (!request.signal.aborted) {
      printings.value = results;
    }
  } catch (error) {
    if (!request.signal.aborted) {
      printingError.value = "Could not load printings. Select the card again to retry.";
    }
  } finally {
    if (!request.signal.aborted) {
      loadingPrintings.value = false;
    }
  }
}

const selectedPrinting = computed(() =>
  printings.value.find((printing) => printing.id === draft.value.printingId),
);

const foilLocked = computed(() => {
  const finishes = selectedPrinting.value?.finishes ?? [];

  return !(finishes.includes("foil") && finishes.includes("nonfoil"));
});

watch(selectedPrinting, (printing) => {
  const finishes = printing?.finishes ?? [];

  draft.value.isFoil = finishes.includes("foil") && !finishes.includes("nonfoil");
});

const modalElement = ref(null);

const canAddCard = computed(() => {
  const printing = selectedPrinting.value;
  const finish = draft.value.isFoil ? "foil" : "nonfoil";

  return (
    !loadingPrintings.value &&
    printing?.finishes.includes(finish) &&
    Number.isInteger(draft.value.quantity) &&
    draft.value.quantity > 0 &&
    ["Near Mint", "Lightly Played", "Moderately Played", "Heavily Played", "Damaged"].includes(
      draft.value.condition,
    )
  );
});

function addCard() {
  if (!canAddCard.value) return;

  const printing = selectedPrinting.value;
  const price = draft.value.isFoil ? printing.prices?.usd_foil : printing.prices?.usd;

  collectionCards.value.push({
    entryId: crypto.randomUUID(),
    scryfallId: printing.id,
    name: printing.name,
    type: printing.type_line,
    printing:
      `${printing.set_name} — ${printing.set.toUpperCase()}` + ` #${printing.collector_number}`,
    image: printing.image_uris?.normal ?? printing.card_faces?.[0]?.image_uris?.normal ?? "",
    condition: draft.value.condition,
    quantity: draft.value.quantity,
    isFoil: draft.value.isFoil,
    favorite: draft.value.favorite,
    trade: draft.value.trade,
    binderIds: [],
    price: price == null ? null : Number(price),
  });

  window.bootstrap.Modal.getInstance(modalElement.value)?.hide();

  clearPrintings();

  draft.value = {
    name: "",
    printingId: "",
    condition: "Near Mint",
    quantity: 1,
    isFoil: false,
    favorite: false,
    trade: false,
  };
}

onBeforeUnmount(clearPrintings);
</script>
<template>
  <div
    id="add-card-modal"
    ref="modalElement"
    class="modal fade"
    tabindex="-1"
    aria-labelledby="add-card-title"
    aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h2 id="add-card-title" class="modal-title fs-5">Add Card</h2>

          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"></button>
        </div>

        <div class="modal-body dialog-form">
          <section class="form-section">
            <div class="section-heading">
              <span class="section-number">1</span>
              <div>
                <h3>Choose a card</h3>
                <p>Find the card and select its exact printing.</p>
              </div>
            </div>

            <CardSearch
              v-model="draft.name"
              class="mb-3"
              @update:model-value="clearPrintings"
              @select="loadPrintings" />

            <div>
              <label for="add-card-printing" class="form-label">Printing</label>

              <select
                id="add-card-printing"
                v-model="draft.printingId"
                class="form-select"
                :disabled="loadingPrintings || printings.length === 0">
                <option value="">
                  {{
                    loadingPrintings
                      ? "Loading printings..."
                      : printings.length
                        ? "Select a printing"
                        : "Select a card first"
                  }}
                </option>

                <option v-for="printing in printings" :key="printing.id" :value="printing.id">
                  {{ printing.set_name }} — {{ printing.set.toUpperCase() }} #{{
                    printing.collector_number
                  }}
                </option>
              </select>

              <p v-if="printingError" class="small text-danger mt-2" role="alert">
                {{ printingError }}
              </p>
            </div>
          </section>
          <section class="form-section">
            <div class="section-heading">
              <span class="section-number">2</span>
              <div>
                <h3>Copy details</h3>
                <p>Describe the copies being added to the collection.</p>
              </div>
            </div>

            <div class="row g-3">
              <div class="col-8">
                <label for="add-card-condition" class="form-label">Condition</label>
                <select id="add-card-condition" v-model="draft.condition" class="form-select">
                  <option>Near Mint</option>
                  <option>Lightly Played</option>
                  <option>Moderately Played</option>
                  <option>Heavily Played</option>
                  <option>Damaged</option>
                </select>
              </div>

              <div class="col-4">
                <label for="add-card-quantity" class="form-label">Quantity</label>
                <input
                  id="add-card-quantity"
                  v-model.number="draft.quantity"
                  type="number"
                  class="form-control"
                  min="1"
                  step="1" />
              </div>
            </div>
          </section>
          <section class="form-section">
            <div class="section-heading">
              <span class="section-number">3</span>
              <div>
                <h3>Collection options</h3>
                <p>Add any special properties for this entry.</p>
              </div>
            </div>

            <div class="option-list">
              <label class="option-control" for="add-card-foil">
                <span>
                  <strong>Foil</strong>
                  <small>Finish choices depend on the selected printing.</small>
                </span>
                <input
                  id="add-card-foil"
                  v-model="draft.isFoil"
                  type="checkbox"
                  class="form-check-input"
                  :disabled="foilLocked" />
              </label>

              <label class="option-control" for="add-card-favorite">
                <span>
                  <strong>Favorite</strong>
                  <small>Show this card in the Favorites binder.</small>
                </span>
                <input
                  id="add-card-favorite"
                  v-model="draft.favorite"
                  type="checkbox"
                  class="form-check-input" />
              </label>

              <label class="option-control" for="add-card-trade">
                <span>
                  <strong>Available for trade</strong>
                  <small>Include this card on the Trade page.</small>
                </span>
                <input
                  id="add-card-trade"
                  v-model="draft.trade"
                  type="checkbox"
                  class="form-check-input" />
              </label>
            </div>
          </section>
        </div>

        <div class="modal-footer justify-content-between">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
            Cancel
          </button>

          <button type="button" class="btn btn-primary" :disabled="!canAddCard" @click="addCard">
            Add Card
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
