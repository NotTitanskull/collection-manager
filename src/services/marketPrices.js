// Market estimates are cached separately from owned cards and purchase costs.
import { ref } from 'vue';

const quotes = ref({});
const pending = new Map();
const CACHE_MS = 15 * 60 * 1000;
let queue = Promise.resolve();
let lastRequestAt = 0;

export function rememberMarketPrinting(printing) {
  if (!printing?.id || pending.has(printing.id)) return;
  quotes.value[printing.id] = {
    status: 'ready',
    prices: printing.prices ?? {},
    details: { setCode: printing.set, collectorNumber: printing.collector_number, rarity: printing.rarity },
    checkedAt: Date.now(),
  };
}

export function marketState(card) {
  return quotes.value[card?.scryfallId] ?? { status: 'unknown', checkedAt: null };
}

// Legacy entries keep their saved printing label; cached metadata fills in rarity.
export function printingDetails(card) {
  const details = marketState(card).details ?? {};
  const legacy = card?.printing?.match(/—\s*([^\s]+)\s+#(.+)$/);
  return {
    setCode: (card?.setCode ?? details.setCode ?? legacy?.[1] ?? '').toUpperCase(),
    collectorNumber: card?.collectorNumber ?? details.collectorNumber ?? legacy?.[2] ?? '',
    rarity: card?.rarity || details.rarity || '',
  };
}

export function marketPrice(card) {
  const quote = marketState(card);
  if (quote.status !== 'ready') return null;
  const finish = card.finish ?? (card.isFoil ? 'foil' : 'nonfoil');
  const key = { nonfoil: 'usd', foil: 'usd_foil', etched: 'usd_etched' }[finish];
  const raw = quote.prices?.[key];
  if (raw == null || raw === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function marketNote(card) {
  const state = marketState(card);
  if (state.status === 'loading') return 'Fetching market price…';
  if (state.status === 'error') return 'Price lookup failed. Refresh to retry.';
  if (!state.checkedAt) return 'Market price unavailable.';
  return `Market checked ${new Date(state.checkedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
}

// Deduplicate exact printings, reuse recent results, and pace outgoing requests.
export function refreshMarketPrice(card, { force = false } = {}) {
  const id = card?.scryfallId;
  if (!id) return Promise.resolve();
  if (pending.has(id)) return pending.get(id);
  const cached = marketState(card);
  if (!force && cached.status === 'ready' && Date.now() - cached.checkedAt < CACHE_MS) {
    return Promise.resolve();
  }
  quotes.value[id] = { status: 'loading', checkedAt: null, details: cached.details };
  const request = queue.then(async () => {
    const delay = Math.max(0, 100 - (Date.now() - lastRequestAt));
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    lastRequestAt = Date.now();
    try {
      const response = await fetch(`https://api.scryfall.com/cards/${encodeURIComponent(id)}`, {
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error('Market lookup failed.');
      const printing = await response.json();
      if (printing.id !== id) throw new Error('Unexpected printing.');
      quotes.value[id] = { status: 'ready', prices: printing.prices ?? {}, checkedAt: Date.now(),
        details: { setCode: printing.set, collectorNumber: printing.collector_number, rarity: printing.rarity } };
    } catch {
      // Failed refreshes never substitute a purchase cost or an old saved estimate.
      quotes.value[id] = { status: 'error', checkedAt: null, details: cached.details };
    } finally {
      pending.delete(id);
    }
  });
  pending.set(id, request);
  queue = request;
  return request;
}
