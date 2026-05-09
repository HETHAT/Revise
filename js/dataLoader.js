/**
 * dataLoader.js
 * Handles all data fetching from the JSON files.
 * Class-aware from day one — works with any number of class folders.
 */

const BASE = './data';

/**
 * Fetch and return the metadata.json for a given class slug.
 * e.g. loadMetadata('ai') → data/ai/metadata.json
 */
export async function loadMetadata(classSlug) {
  const res = await fetch(`${BASE}/${classSlug}/metadata.json`);
  if (!res.ok) throw new Error(`Failed to load metadata for class "${classSlug}"`);
  return res.json();
}

/**
 * Fetch and return a single subject JSON file.
 * e.g. loadSubject('ai', 'les-reseaux-de-neurones') → data/ai/les-reseaux-de-neurones.json
 */
export async function loadSubject(classSlug, filename) {
  const res = await fetch(`${BASE}/${classSlug}/${filename}`);
  if (!res.ok) throw new Error(`Failed to load subject "${filename}" in class "${classSlug}"`);
  return res.json();
}

/**
 * Load all subject files for a class and return a flat array of all items,
 * each item augmented with its source filename.
 *
 * Optionally pass a list of filenames to load only specific sources.
 */
export async function loadItems(classSlug, filenames = null) {
  const metadata = await loadMetadata(classSlug);
  const targets = filenames
    ? metadata.sources.filter(s => filenames.includes(s.filename))
    : metadata.sources;

  const results = await Promise.all(
    targets.map(s => loadSubject(classSlug, s.filename))
  );

  const items = [];
  results.forEach((subjectData, i) => {
    subjectData.items.forEach(item => {
      items.push({ ...item, _source: targets[i].filename, _class: classSlug });
    });
  });

  return items;
}

/**
 * Discover all available classes by reading a top-level classes.json manifest.
 * This file lists all class slugs so we don't need directory listing.
 *
 * classes.json format: { "classes": [{ "slug": "ai", "label": "Artificial Intelligence" }, ...] }
 */
export async function loadClasses() {
  const res = await fetch(`${BASE}/classes.json`);
  if (!res.ok) throw new Error('Failed to load classes.json — make sure it exists in data/');
  return res.json(); // returns the full object
}

/**
 * Apply filters to a flat items array.
 * All filter arrays are optional — omit or pass null to skip that filter.
 */
export function filterItems(items, { sources, topics, types, difficulties } = {}) {
  return items.filter(item => {
    if (sources?.length && !sources.includes(item._source)) return false;
    if (topics?.length && !topics.includes(item.topic)) return false;
    if (types?.length && !types.includes(item.type)) return false;
    if (difficulties?.length && !difficulties.includes(item.difficulty)) return false;
    return true;
  });
}

/**
 * Shuffle an array in place (Fisher-Yates) and return it.
 */
export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
