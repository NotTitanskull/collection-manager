<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import CardSearch from "./CardSearch.vue";

const emit = defineEmits(["add"]);
const modalElement = ref(null);
const name = ref("");
const printingId = ref("");
const finish = ref("");
const condition = ref("Near Mint");
const quantity = ref(1);
const conditions = ["Near Mint", "Lightly Played", "Moderately Played", "Heavily Played", "Damaged"];
const finishLabels = { nonfoil: "Nonfoil", foil: "Foil", etched: "Etched foil" };
const printings = ref([]);
const loadingPrintings = ref(false);
const printingError = ref("");

let printingRequest;

function clearPrintings() {
  printingRequest?.abort();
  printings.value = [];
  printingId.value = "";
  finish.value = "";
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


const selectedPrinting = computed(() => printings.value.find((card) => card.id === printingId.value));
const finishes = computed(() => (selectedPrinting.value?.finishes ?? []).filter((value) => value in finishLabels));
watch(selectedPrinting, () => { finish.value = finishes.value[0] ?? ""; });
const canAdd = computed(() => !loadingPrintings.value && selectedPrinting.value &&
  finishes.value.includes(finish.value) && conditions.includes(condition.value) &&
  Number.isInteger(quantity.value) && quantity.value > 0);
function resetForm() {
  clearPrintings();
  name.value = "";
  condition.value = "Near Mint";
  quantity.value = 1;
}
function addCard() {
  if (!canAdd.value) return;
  const card = selectedPrinting.value;
  const priceKey = { nonfoil: "usd", foil: "usd_foil", etched: "usd_etched" }[finish.value];
  const rawPrice = card.prices?.[priceKey];
  const price = rawPrice == null || rawPrice === "" ? null : Number(rawPrice);
  emit("add", {
    entryId: crypto.randomUUID(), scryfallId: card.id, name: card.name,
    printing: `${card.set_name} — ${card.set.toUpperCase()} #${card.collector_number}`,
    image: card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal ?? "",
    finish: finish.value, finishLabel: finishLabels[finish.value],
    condition: condition.value, quantity: quantity.value,
    price: Number.isFinite(price) && price >= 0 ? price : null,
  });
  window.bootstrap.Modal.getInstance(modalElement.value)?.hide();
}
onMounted(() => {
  modalElement.value.addEventListener("show.bs.modal", resetForm);
  modalElement.value.addEventListener("hidden.bs.modal", clearPrintings);
});
onBeforeUnmount(() => {
  clearPrintings();
  modalElement.value.removeEventListener("show.bs.modal", resetForm);
  modalElement.value.removeEventListener("hidden.bs.modal", clearPrintings);
});
</script>

<template>
  <div id="trade-receive-modal" ref="modalElement" class="modal fade" tabindex="-1"
    aria-labelledby="trade-receive-title" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h2 id="trade-receive-title" class="modal-title fs-5">Choose a card you receive</h2>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body dialog-form">
          <section class="form-section">
            <div class="section-heading"><span class="section-number">1</span><div><h3>Choose a printing</h3><p>Search Scryfall for the exact card offered.</p></div></div>
            <CardSearch v-model="name" class="mb-3" @update:model-value="clearPrintings" @select="loadPrintings" />
            <label for="receive-printing" class="form-label">Printing</label>
            <select id="receive-printing" v-model="printingId" class="form-select" :disabled="loadingPrintings || !printings.length">
              <option value="">{{ loadingPrintings ? "Loading printings..." : printings.length ? "Select a printing" : "Select a card first" }}</option>
              <option v-for="card in printings" :key="card.id" :value="card.id">{{ card.set_name }} — {{ card.set.toUpperCase() }} #{{ card.collector_number }}</option>
            </select>
            <p v-if="printingError" class="small text-danger mt-2" role="alert">{{ printingError }}</p>
          </section>
          <section class="form-section">
            <div class="section-heading"><span class="section-number">2</span><div><h3>Copy details</h3><p>These cards are added only to your trade draft.</p></div></div>
            <label for="receive-finish" class="form-label">Finish</label>
            <select id="receive-finish" v-model="finish" class="form-select mb-3" :disabled="finishes.length < 2">
              <option v-if="!finishes.length" value="">Select a printing first</option>
              <option v-for="value in finishes" :key="value" :value="value">{{ finishLabels[value] }}</option>
            </select>
            <div class="copy-details">
              <div><label for="receive-condition" class="form-label">Condition</label><select id="receive-condition" v-model="condition" class="form-select"><option v-for="value in conditions" :key="value">{{ value }}</option></select></div>
              <div><label for="receive-quantity" class="form-label">Quantity</label><input id="receive-quantity" v-model.number="quantity" type="number" min="1" step="1" class="form-control" /></div>
            </div>
          </section>
        </div>
        <div class="modal-footer justify-content-between">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-primary" :disabled="!canAdd" @click="addCard">Add to trade</button>
        </div>
      </div>
    </div>
  </div>
</template>
