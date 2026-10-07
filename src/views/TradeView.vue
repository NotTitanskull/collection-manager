<script setup>
import ConditionBadge from '../components/cards/ConditionBadge.vue';
// Temporary trade comparison. All edits here affect the draft, not owned card quantities.
import { computed, ref } from "vue";
import { marketPrice, marketState, marketNote, refreshMarketPrice } from "../services/marketPrices.js";
import { collectionCards } from "../stores/collection.js";
import TradeReceiveModal from "../components/trade/TradeReceiveModal.vue";
import TradePickerModal from "../components/trade/TradePickerModal.vue";

const receivedCards = ref([]);
const receivedPricedCards = computed(() => receivedCards.value.map(card => ({ ...card, price: marketPrice(card) })));
const choosingGiven = ref(false);
const choosingReceived = ref(false);
const receivedValid = computed(() =>
  receivedCards.value.every((card) => Number.isInteger(card.quantity) && card.quantity > 0),
);
const receivedMissing = computed(
  () => receivedPricedCards.value.filter((card) => !hasPrice(card)).length,
);
// Calculate in integer cents to reduce floating-point rounding errors.
const receivedTotal = computed(
  () =>
    receivedPricedCards.value.reduce(
      (sum, card) => sum + (hasPrice(card) ? Math.round(card.price * 100) * card.quantity : 0),
      0,
    ) / 100,
);
const comparison = computed(() => {
  if (refreshingPrices.value) return "Fetching market prices…";
  if (!validQuantities.value || !receivedValid.value)
    return "Enter valid quantities on both sides.";
  if (!lines.value.length || !receivedCards.value.length)
    return "Add cards to both sides to compare estimated values.";
  if (missingPrices.value || receivedMissing.value)
    return "Comparison incomplete: some cards have unknown prices.";
  const difference = Math.round((receivedTotal.value - knownTotal.value) * 100) / 100;
  if (difference === 0) return "Both sides have the same estimated value.";
  return `${difference > 0 ? "You receive" : "You give"} ${money(Math.abs(difference))} more in estimated value.`;
});
const comparisonTone = computed(() => {
  if (
    refreshingPrices.value ||
    !validQuantities.value ||
    !receivedValid.value ||
    missingPrices.value ||
    receivedMissing.value
  )
    return "attention";
  if (
    !lines.value.length ||
    !receivedCards.value.length ||
    receivedTotal.value === knownTotal.value
  )
    return "neutral";
  return receivedTotal.value > knownTotal.value ? "receive" : "give";
});
// Merge matching printing, finish, and condition groups in the receiving draft.
function addReceived(card) {
  const existing = receivedCards.value.find(
    (entry) =>
      entry.scryfallId === card.scryfallId &&
      entry.finish === card.finish &&
      entry.condition === card.condition,
  );
  if (existing && Number.isInteger(existing.quantity) && existing.quantity > 0)
    existing.quantity += card.quantity;
  else receivedCards.value.push(card);
  refreshMarketPrice(card);
}
// Remove a proposed incoming entry from this comparison only.
function removeReceived(id) {
  receivedCards.value = receivedCards.value.filter((card) => card.entryId !== id);
}
const offeredCards = ref([]);
const selectedIds = computed(() => offeredCards.value.map((entry) => entry.entryId));
// Join draft IDs to saved cards for display; the draft owns its own quantities.
const lines = computed(() =>
  offeredCards.value.flatMap((entry) => {
    const card = collectionCards.value.find((card) => card.entryId === entry.entryId);
    return card ? [{ ...entry, card: { ...card, price: marketPrice(card) } }] : [];
  }),
);
const validQuantities = computed(() =>
  lines.value.every(
    ({ quantity, card }) => Number.isInteger(quantity) && quantity > 0 && quantity <= card.quantity,
  ),
);
const missingPrices = computed(() => lines.value.filter(({ card }) => !hasPrice(card)).length);
const knownTotal = computed(
  () =>
    lines.value.reduce(
      (sum, { card, quantity }) =>
        sum + (hasPrice(card) ? Math.round(card.price * 100) * quantity : 0),
      0,
    ) / 100,
);
// Zero is a valid price; null or non-finite values mean the price is unknown.
function hasPrice(card) {
  return Number.isFinite(card.price) && card.price >= 0;
}
// Format a numeric estimate consistently as US dollars for display.
function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}
// Add each eligible owned entry once, with a draft quantity of one copy.
function addCards(ids) {
  for (const entryId of ids) {
    if (
      !selectedIds.value.includes(entryId) &&
      collectionCards.value.some((card) => card.entryId === entryId && card.quantity > 0)
    ) {
      offeredCards.value.push({ entryId, quantity: 1 });
      refreshMarketPrice(collectionCards.value.find(card => card.entryId === entryId));
    }
  }
}
// Keep an empty input empty so validation can explain it rather than forcing zero.
function setQuantity(entryId, value) {
  const entry = offeredCards.value.find((entry) => entry.entryId === entryId);
  if (entry) entry.quantity = value === "" ? "" : Number(value);
}
// Remove only a draft line; this does not delete an owned card.
function removeCard(entryId) {
  offeredCards.value = offeredCards.value.filter((entry) => entry.entryId !== entryId);
}
const pricedEntries = computed(() => [...lines.value.map(line => line.card), ...receivedCards.value]);
const refreshingPrices = computed(() => pricedEntries.value.some(card => marketState(card).status === 'loading'));
function refreshPrices() {
  for (const card of pricedEntries.value) refreshMarketPrice(card, { force: true });
}
function setReceivedQuantity(entryId, value) {
  const card = receivedCards.value.find(card => card.entryId === entryId);
  if (card) card.quantity = value === '' ? '' : Number(value);
}
</script>

<template>
  <section class="trade-page">
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
      <h1>Trade comparison</h1>
      <button type="button" class="btn btn-outline-secondary"
        :disabled="!pricedEntries.length || refreshingPrices" @click="refreshPrices">
        {{ refreshingPrices ? 'Refreshing prices…' : 'Refresh prices' }}
      </button>
    </div>
    <p class="text-secondary">
      Plan a trade without changing your collection. This draft resets when you leave the page.
    </p>
    <div class="trade-summary mt-4" :class="`comparison-${comparisonTone}`" aria-live="polite">
      <div>
        <p class="comparison-label">
          {{ comparisonTone === "attention" ? "Needs attention" : "Estimated value comparison" }}
        </p>
        <p class="comparison-message mb-0">{{ comparison }}</p>
      </div>
    </div>
    <div class="trade-columns mt-4">
      <section class="trade-column trade-give" aria-labelledby="give-title">
        <div class="trade-column-heading">
          <div>
            <span class="trade-direction">
              <span aria-hidden="true">↗</span>
              Outgoing
            </span>
            <h2 id="give-title" class="h5 mb-0">You give</h2>
            <p>Cards from your collection</p>
          </div>
          <div class="trade-total" aria-live="polite">
            <small class="total-label">
              {{ missingPrices ? "Known subtotal" : "Estimated total" }}
            </small>
            <strong>
              {{ validQuantities ? money(knownTotal) : "Check quantities" }}
            </strong>
            <small v-if="missingPrices" class="d-block text-secondary">
              {{ missingPrices }} unpriced
              {{ missingPrices === 1 ? "entry" : "entries" }}
            </small>
          </div>
        </div>
        <ul class="list-unstyled trade-card-list">
          <li v-for="line in lines" :key="line.entryId" class="trade-card">
            <img
              v-if="line.card.image"
              class="trade-card-image"
              :src="line.card.image"
              :alt="line.card.name" />
            <div class="trade-card-details">
              <h3 class="h6 mb-1">{{ line.card.name }}</h3>
              <p>
                {{ line.card.printing }} ·
                {{
                  line.card.finish === "etched"
                    ? "Etched foil"
                    : line.card.isFoil
                      ? "Foil"
                      : "Nonfoil"
                }}
              </p>
              <p>
                <ConditionBadge :condition="line.card.condition" /> ·
                {{ hasPrice(line.card) ? money(line.card.price) + " per copy" : "Price unknown" }}
              </p>
              <p class="small text-secondary" role="status">{{ marketNote(line.card) }}</p>
              <div class="trade-quantity mt-2">
                <label :for="`trade-quantity-${line.entryId}`" class="small">
                  Quantity ({{ line.card.quantity }} owned)
                </label>
                <input
                  :id="`trade-quantity-${line.entryId}`"
                  :value="line.quantity"
                  type="number"
                  min="1"
                  :max="line.card.quantity"
                  step="1"
                  class="form-control form-control-sm"
                  :aria-invalid="
                    !Number.isInteger(line.quantity) ||
                    line.quantity < 1 ||
                    line.quantity > line.card.quantity
                  "
                  @input="setQuantity(line.entryId, $event.target.value)" />
              </div>
              <button
                type="button"
                class="btn btn-link text-danger px-0 btn-sm"
                :aria-label="`Remove ${line.card.name} from trade`"
                @click="removeCard(line.entryId)">
                Remove
              </button>
            </div>
          </li>
        </ul>
        <p v-if="!lines.length" class="text-secondary mt-3">
          Choose cards to estimate your side of the trade.
        </p>
        <p v-if="!validQuantities" class="text-danger small mt-3" role="alert">
          Use whole quantities between 1 and the number you own.
        </p>
        <button
          type="button"
          class="btn btn-outline-primary trade-add-button"
          @click="choosingGiven = true">
          + Choose cards
        </button>
      </section>
      <section class="trade-column trade-receive" aria-labelledby="receive-title">
        <div class="trade-column-heading">
          <div>
            <span class="trade-direction">
              <span aria-hidden="true">↙</span>
              Incoming
            </span>
            <h2 id="receive-title" class="h5 mb-0">You receive</h2>
            <p>Cards offered by the other person</p>
          </div>
          <div class="trade-total" aria-live="polite">
            <small class="total-label">
              {{ receivedMissing ? "Known subtotal" : "Estimated total" }}
            </small>
            <strong>
              {{ receivedValid ? money(receivedTotal) : "Check quantities" }}
            </strong>
            <small v-if="receivedMissing" class="d-block text-secondary">
              {{ receivedMissing }} unpriced
              {{ receivedMissing === 1 ? "entry" : "entries" }}
            </small>
          </div>
        </div>
        <ul class="list-unstyled trade-card-list">
          <li v-for="card in receivedPricedCards" :key="card.entryId" class="trade-card">
            <img v-if="card.image" :src="card.image" :alt="card.name" class="trade-card-image" />
            <div class="trade-card-details">
              <h3 class="h6 mb-1">{{ card.name }}</h3>
              <p>{{ card.printing }} · {{ card.finishLabel }}</p>
              <p>
                <ConditionBadge :condition="card.condition" /> ·
                {{ hasPrice(card) ? money(card.price) + " per copy" : "Price unknown" }}
              </p>
              <p class="small text-secondary" role="status">{{ marketNote(card) }}</p>
              <div class="trade-quantity mt-2">
                <label :for="`receive-qty-${card.entryId}`" class="small">Quantity</label>
                <input
                  :id="`receive-qty-${card.entryId}`"
                  :value="card.quantity"
                  @input="setReceivedQuantity(card.entryId, $event.target.value)"
                  type="number"
                  min="1"
                  step="1"
                  class="form-control form-control-sm"
                  :aria-invalid="!Number.isInteger(card.quantity) || card.quantity < 1" />
              </div>
              <button
                type="button"
                class="btn btn-link text-danger px-0 btn-sm"
                :aria-label="`Remove ${card.name} from receiving side`"
                @click="removeReceived(card.entryId)">
                Remove
              </button>
            </div>
          </li>
        </ul>
        <p v-if="!receivedCards.length" class="text-secondary mt-3">
          Find the cards offered by the other person.
        </p>
        <p v-if="!receivedValid" class="small text-danger mt-3" role="alert">
          Use positive whole quantities.
        </p>
        <button
          type="button"
          class="btn btn-outline-primary trade-add-button"
          @click="choosingReceived = true">
          + Find a card
        </button>
      </section>
    </div>
    <p class="trade-disclaimer mt-3">
      Both sides use Scryfall’s latest fetched USD estimates for the selected printing and finish.
      Purchase prices are separate from this comparison. Estimates do not account for condition or
      determine whether a trade is fair. Unavailable prices are excluded from the known subtotal.
    </p>
    <TradeReceiveModal
      v-if="choosingReceived"
      @add="addReceived"
      @close="choosingReceived = false" />
    <TradePickerModal
      v-if="choosingGiven"
      :selected-ids="selectedIds"
      @add="addCards"
      @close="choosingGiven = false" />
  </section>
</template>

<style scoped lang="scss">
// Add giving/receiving accents and local controls to the shared trade layout.
.trade-quantity {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  input {
    width: 5rem;
  }
}
// Shared layout remains in _trade.scss; these accents identify each side.
.trade-give {
  --side-color: #885008;
  --side-tint: #fff6e7;
  --side-border: #e7c99a;
}
.trade-receive {
  --side-color: #2456a0;
  --side-tint: #eef5ff;
  --side-border: #bdd1ee;
}
.trade-column {
  border-top: 4px solid var(--side-color);
}
.trade-column-heading {
  flex-wrap: wrap;
  margin: -1.25rem -1.25rem 0;
  padding: 1.25rem;
  background: var(--side-tint);
  border-bottom-color: var(--side-border);
  border-radius: 0.5rem 0.5rem 0 0;
}
.trade-direction {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 0.5rem;
  color: var(--side-color);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.trade-total {
  margin-left: auto;
  text-align: right;
  max-width: 100%;
  strong {
    display: block;
    color: var(--side-color);
    font-size: 1.65rem;
    font-variant-numeric: tabular-nums;
    line-height: 1.3;
    overflow-wrap: anywhere;
  }
  .total-label {
    display: block;
    color: #495057;
  }
}
.trade-add-button {
  color: var(--side-color);
  border-color: var(--side-color);
  font-weight: 600;
  &:hover,
  &:active {
    color: white;
    background: var(--side-color);
    border-color: var(--side-color);
  }
  &:focus-visible {
    outline: 3px solid var(--side-color);
    outline-offset: 3px;
  }
}
.trade-summary {
  border-left-width: 5px;
  border-left-color: #6c757d;
  &.comparison-give,
  &.comparison-attention {
    background: #fff6e7;
    border-color: #e7c99a;
    border-left-color: #885008;
  }
  &.comparison-receive {
    background: #eef5ff;
    border-color: #bdd1ee;
    border-left-color: #2456a0;
  }
}
.comparison-label {
  margin: 0 0 0.4rem;
  color: #495057;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.comparison-message {
  font-size: 1.15rem;
  font-weight: 600;
}

.trade-card-details {
  overflow-wrap: anywhere;
}
</style>
