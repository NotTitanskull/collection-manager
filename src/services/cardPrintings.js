/** Wait between pages, stopping promptly if the form cancels its request. */
function waitForNextPage(signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', cancel);
      resolve();
    }, 100);
    function cancel() {
      clearTimeout(timer);
      signal?.removeEventListener('abort', cancel);
      reject(signal.reason);
    }
    signal?.addEventListener('abort', cancel, { once: true });
    if (signal?.aborted) cancel();
  });
}

/**
 * Fetch all paper printings of an exact card name. The caller owns loading/error UI.
 * No form or collection state is changed; failed pages reject the whole lookup.
 * @param {string} name Exact card name selected from autocomplete.
 * @param {{signal?: AbortSignal}} [options] Cancellation owned by the calling form.
 * @returns {Promise<import('../models/Card.js').ScryfallPrinting[]>} Complete printing list.
 */
export async function fetchCardPrintings(name, { signal } = {}) {
  const query = `!"${name}" game:paper`;
  let url =
    `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}` +
    '&unique=prints&order=released';
  const printings = [];

  while (url) {
    signal?.throwIfAborted();
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error('Could not load printings.');
    const result = await response.json();
    signal?.throwIfAborted();
    if (!Array.isArray(result.data)) throw new Error('Invalid printing response.');
    printings.push(...result.data);
    if (result.has_more && (typeof result.next_page !== 'string' || !result.next_page)) {
      throw new Error('Missing next printing page.');
    }
    url = result.has_more ? result.next_page : null;
    if (url) await waitForNextPage(signal);
  }

  return printings;
}
