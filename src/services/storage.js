// App.vue owns live arrays. These helpers handle JSON in this site's browser storage.
/**
 * Load and validate saved rows without writing, repairing, or dropping any of them.
 * Missing data uses cloned defaults; damaged data returns an empty session and an error.
 * The caller must pause saves when error is present to preserve the original data.
 * @template T
 * @param {string} key Browser storage key.
 * @param {T[]} fallback Defaults for a new collection, not a damaged one.
 * @param {(rows: unknown) => (string|null)} validate Validate all saved entries.
 * @returns {{data: T[], error: string|null, raw: string|null}} Data and an exact recovery copy.
 */
export function loadSavedArray(key, fallback, validate) {
  let raw = null;
  try {
    raw = localStorage.getItem(key);
    if (raw === null) return { data: structuredClone(fallback), error: null, raw };
    const saved = JSON.parse(raw);
    const error = validate(saved);
    if (error) return { data: [], error, raw };
    return { data: saved, error: null, raw };
  } catch {
    return {
      data: [],
      error: raw === null ? 'Browser storage could not be read.' : 'Saved data is not valid JSON.',
      raw,
    };
  }
}

/**
 * Serialize a live array. App.vue calls this only when both saved lists loaded safely.
 * @param {string} key Browser storage key.
 * @param {unknown[]} value Array to serialize, without mutating it.
 * @returns {boolean} Whether the write succeeded; errors are also logged.
 */
export function saveArray(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Could not save ${key}.`, error);
    return false;
  }
}
