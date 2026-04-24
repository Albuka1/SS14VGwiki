import { apiRequest } from './api';

const CACHE_STORAGE_KEY = 'wiki-cache-v2';
const SUMMARY_TTL = 45_000;
const PAGE_TTL = 5 * 60_000;

const state = {
  hydrated: false,
  summaries: null,
  summariesFetchedAt: 0,
  pageRecords: {},
  inFlight: new Map()
};

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

function sortSummaries(pages) {
  return [...pages].sort((left, right) => {
    const dateDelta = new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime();

    if (dateDelta !== 0) {
      return dateDelta;
    }

    return right.id - left.id;
  });
}

function stripHtml(content) {
  return String(content ?? '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hydrateCache() {
  if (state.hydrated) {
    return;
  }

  state.hydrated = true;

  if (!canUseStorage()) {
    return;
  }

  try {
    const rawValue = window.sessionStorage.getItem(CACHE_STORAGE_KEY);

    if (!rawValue) {
      return;
    }

    const parsedValue = JSON.parse(rawValue);
    state.summaries = Array.isArray(parsedValue.summaries) ? parsedValue.summaries : null;
    state.summariesFetchedAt = Number(parsedValue.summariesFetchedAt) || 0;
    state.pageRecords = parsedValue.pageRecords && typeof parsedValue.pageRecords === 'object' ? parsedValue.pageRecords : {};
  } catch {
    state.summaries = null;
    state.summariesFetchedAt = 0;
    state.pageRecords = {};
  }
}

function persistCache() {
  if (!canUseStorage()) {
    return;
  }

  window.sessionStorage.setItem(
    CACHE_STORAGE_KEY,
    JSON.stringify({
      summaries: state.summaries,
      summariesFetchedAt: state.summariesFetchedAt,
      pageRecords: state.pageRecords
    })
  );
}

function createPageSummary(page) {
  const plainTextContent = stripHtml(page.content);
  const excerpt =
    page.excerpt ||
    (plainTextContent.length > 180 ? `${plainTextContent.slice(0, 177).trimEnd()}...` : plainTextContent);

  return {
    id: page.id,
    title: page.title,
    slug: page.slug,
    created_at: page.created_at,
    updated_at: page.updated_at,
    excerpt,
    word_count: page.word_count || (plainTextContent ? plainTextContent.split(/\s+/).length : 0)
  };
}

function rememberSummaries(pages) {
  hydrateCache();
  state.summaries = sortSummaries(pages);
  state.summariesFetchedAt = Date.now();
  persistCache();
}

function removeExistingSlugForId(id, keepSlug) {
  Object.keys(state.pageRecords).forEach((slug) => {
    const record = state.pageRecords[slug];

    if (record?.data?.id === id && slug !== keepSlug) {
      delete state.pageRecords[slug];
    }
  });
}

function upsertSummary(summary) {
  const currentSummaries = state.summaries ?? [];
  const filteredPages = currentSummaries.filter((page) => page.id !== summary.id);
  filteredPages.push(summary);
  state.summaries = sortSummaries(filteredPages);
  state.summariesFetchedAt = Date.now();
}

function rememberPage(page, options = {}) {
  hydrateCache();

  const previousSlug = options.previousSlug;

  if (previousSlug && previousSlug !== page.slug) {
    delete state.pageRecords[previousSlug];
  }

  removeExistingSlugForId(page.id, page.slug);

  state.pageRecords[page.slug] = {
    data: page,
    fetchedAt: Date.now(),
    full: true
  };

  upsertSummary(createPageSummary(page));
  persistCache();
}

function isFresh(timestamp, ttl) {
  return timestamp > 0 && Date.now() - timestamp < ttl;
}

function findRecordById(id) {
  hydrateCache();

  return Object.values(state.pageRecords).find((record) => record?.data?.id === Number(id)) ?? null;
}

function withInFlight(key, loader) {
  hydrateCache();

  if (state.inFlight.has(key)) {
    return state.inFlight.get(key);
  }

  const request = loader().finally(() => {
    state.inFlight.delete(key);
  });

  state.inFlight.set(key, request);
  return request;
}

export function getCachedPageSummaries() {
  hydrateCache();
  return state.summaries;
}

export function getCachedPageSummaryBySlug(slug) {
  hydrateCache();
  return state.summaries?.find((page) => page.slug === slug) ?? null;
}

export function getCachedPageDetail(slug) {
  hydrateCache();
  const record = state.pageRecords[slug];

  return record?.full ? record.data : null;
}

export function getCachedPageById(id) {
  const record = findRecordById(id);
  return record?.full ? record.data : null;
}

export async function fetchPageSummaries(options = {}) {
  const { force = false } = options;

  hydrateCache();

  if (!force && state.summaries && isFresh(state.summariesFetchedAt, SUMMARY_TTL)) {
    return state.summaries;
  }

  return withInFlight('summaries', async () => {
    const pages = await apiRequest('/api/pages');
    rememberSummaries(pages);
    return pages;
  });
}

export async function fetchPageDetail(slug, options = {}) {
  const { force = false } = options;

  hydrateCache();

  const cachedRecord = state.pageRecords[slug];

  if (!force && cachedRecord?.full && isFresh(cachedRecord.fetchedAt, PAGE_TTL)) {
    return cachedRecord.data;
  }

  return withInFlight(`page:${slug}`, async () => {
    const page = await apiRequest(`/api/pages/${slug}`);
    rememberPage(page);
    return page;
  });
}

export async function fetchPageById(id, options = {}) {
  const { force = false, token } = options;

  hydrateCache();

  const cachedRecord = findRecordById(id);

  if (!force && cachedRecord?.full && isFresh(cachedRecord.fetchedAt, PAGE_TTL)) {
    return cachedRecord.data;
  }

  return withInFlight(`page-id:${id}`, async () => {
    const page = await apiRequest(`/api/pages/id/${id}`, {
      token
    });

    rememberPage(page);
    return page;
  });
}

export function prefetchPage(slug) {
  return fetchPageDetail(slug).catch(() => null);
}

export function updateCacheWithPage(page, options = {}) {
  rememberPage(page, options);
}

export function updateCacheWithSummaries(pages) {
  rememberSummaries(pages);
}

export function removePageFromCache(page) {
  hydrateCache();

  if (page?.slug) {
    delete state.pageRecords[page.slug];
  }

  if (page?.id) {
    removeExistingSlugForId(page.id, null);
  }

  if (state.summaries) {
    state.summaries = state.summaries.filter((item) => item.id !== page.id);
    state.summariesFetchedAt = Date.now();
  }

  persistCache();
}
