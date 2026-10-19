import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchCardPrintings } from '../src/services/cardPrintings.js';

const page = (data, extra = {}) => ({ ok: true, json: async () => ({ data, ...extra }) });

test('exact name lookup combines all pages and passes the caller’s abort signal', async (t) => {
  const calls = [];
  const controller = new AbortController();
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, options });
    return calls.length === 1
      ? page([{ id: 'one' }], { has_more: true, next_page: 'https://api.scryfall.com/page2' })
      : page([{ id: 'two' }]);
  });
  assert.deepEqual(await fetchCardPrintings('Dogmeat, Ever Loyal', { signal: controller.signal }), [
    { id: 'one' },
    { id: 'two' },
  ]);
  const url = new URL(calls[0].url);
  assert.equal(url.searchParams.get('q'), '!"Dogmeat, Ever Loyal" game:paper');
  assert.equal(url.searchParams.get('unique'), 'prints');
  assert.equal(url.searchParams.get('order'), 'released');
  assert.equal(calls[1].url, 'https://api.scryfall.com/page2');
  assert.equal(calls[1].options.signal, controller.signal);
});

test('a failed later page rejects instead of returning partial results', async (t) => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () =>
    ++calls === 1
      ? page([{ id: 'one' }], { has_more: true, next_page: 'https://api.scryfall.com/page2' })
      : { ok: false },
  );
  await assert.rejects(fetchCardPrintings('Sol Ring'), /Could not load/);
});

test('malformed response or missing pagination link is rejected', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', async () => page(null));
  await assert.rejects(fetchCardPrintings('Sol Ring'), /Invalid printing/);
  mock.mock.mockImplementation(async () => page([], { has_more: true }));
  await assert.rejects(fetchCardPrintings('Sol Ring'), /Missing next/);
});

test('pre-cancelled requests never fetch', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', async () => page([]));
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(fetchCardPrintings('Sol Ring', { signal: controller.signal }), {
    name: 'AbortError',
  });
  assert.equal(mock.mock.callCount(), 0);
});

test('cancelling during body parsing prevents stale results from returning', async (t) => {
  const controller = new AbortController();
  t.mock.method(globalThis, 'fetch', async () => ({
    ok: true,
    json: async () => {
      controller.abort();
      return { data: [{ id: 'stale' }] };
    },
  }));
  await assert.rejects(fetchCardPrintings('Old name', { signal: controller.signal }), {
    name: 'AbortError',
  });
});

test('cancelling the pagination pause prevents the next request', async (t) => {
  const controller = new AbortController();
  const mock = t.mock.method(globalThis, 'fetch', async () => {
    setTimeout(() => controller.abort(), 0);
    return page([], { has_more: true, next_page: 'https://api.scryfall.com/page2' });
  });
  await assert.rejects(fetchCardPrintings('Sol Ring', { signal: controller.signal }), {
    name: 'AbortError',
  });
  assert.equal(mock.mock.callCount(), 1);
});
