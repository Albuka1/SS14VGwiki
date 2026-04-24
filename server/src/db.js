const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const { createSlug } = require('./utils/slugify');

const databasePath = path.resolve(__dirname, '../data/wiki.db');
const database = new DatabaseSync(databasePath);

database.exec(`
  CREATE TABLE IF NOT EXISTS pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

database.exec(`
  CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages (slug);
  CREATE INDEX IF NOT EXISTS idx_pages_updated_at ON pages (updated_at DESC);
`);

const totalPages = database.prepare('SELECT COUNT(*) AS count FROM pages').get().count;

if (totalPages === 0) {
  const now = new Date().toISOString();

  database
    .prepare(
      `
        INSERT INTO pages (title, slug, content, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `
    )
    .run(
      'Добро пожаловать',
      'welcome',
      `
        <h1>Добро пожаловать в новую wiki</h1>
        <p>Это стартовая страница проекта. Откройте админ-панель и создайте свои статьи.</p>
        <p>Маршруты уже готовы: публичный просмотр работает по адресу <strong>/wiki/:slug</strong>, а управление страницами доступно в <strong>/admin</strong>.</p>
      `,
      now,
      now
    );
}

function stripHtml(content) {
  return String(content ?? '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function summarizePage(page) {
  const plainTextContent = stripHtml(page.content);
  const excerpt =
    plainTextContent.length > 180 ? `${plainTextContent.slice(0, 177).trimEnd()}...` : plainTextContent;

  return {
    id: page.id,
    title: page.title,
    slug: page.slug,
    created_at: page.created_at,
    updated_at: page.updated_at,
    excerpt,
    word_count: plainTextContent ? plainTextContent.split(/\s+/).length : 0
  };
}

function listPages(query = '') {
  const normalizedQuery = String(query ?? '').trim().toLowerCase();
  const rows =
    normalizedQuery.length > 0
      ? database
          .prepare(
            `
              SELECT id, title, slug, content, created_at, updated_at
              FROM pages
              WHERE lower(title) LIKE ? OR lower(slug) LIKE ?
              ORDER BY updated_at DESC, id DESC
            `
          )
          .all(`%${normalizedQuery}%`, `%${normalizedQuery}%`)
      : database
          .prepare(
            `
              SELECT id, title, slug, content, created_at, updated_at
              FROM pages
              ORDER BY updated_at DESC, id DESC
            `
          )
          .all();

  return rows.map(summarizePage);
}

function getPageBySlug(slug) {
  return database
    .prepare(
      `
        SELECT id, title, slug, content, created_at, updated_at
        FROM pages
        WHERE slug = ?
      `
    )
    .get(slug);
}

function getPageById(id) {
  return database
    .prepare(
      `
        SELECT id, title, slug, content, created_at, updated_at
        FROM pages
        WHERE id = ?
      `
    )
    .get(id);
}

function findPageBySlug(slug) {
  return database
    .prepare(
      `
        SELECT id, slug
        FROM pages
        WHERE slug = ?
      `
    )
    .get(slug);
}

function createPage({ title, slug, content }) {
  const now = new Date().toISOString();
  const normalizedTitle = String(title ?? '').trim();
  const normalizedSlug = createSlug(slug || normalizedTitle);
  const normalizedContent = String(content ?? '');
  const slugOwner = findPageBySlug(normalizedSlug);

  if (slugOwner) {
    const error = new Error('Slug already exists.');
    error.code = 'SLUG_CONFLICT';
    throw error;
  }

  const result = database
    .prepare(
      `
        INSERT INTO pages (title, slug, content, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `
    )
    .run(normalizedTitle, normalizedSlug, normalizedContent, now, now);

  return getPageById(Number(result.lastInsertRowid));
}

function updatePage(id, { title, slug, content }) {
  const existingPage = getPageById(id);

  if (!existingPage) {
    return null;
  }

  const normalizedTitle = String(title ?? existingPage.title).trim();
  const normalizedSlug = createSlug(slug || normalizedTitle);
  const normalizedContent = content === undefined ? existingPage.content : String(content);
  const slugOwner = findPageBySlug(normalizedSlug);

  if (slugOwner && slugOwner.id !== existingPage.id) {
    const error = new Error('Slug already exists.');
    error.code = 'SLUG_CONFLICT';
    throw error;
  }

  database
    .prepare(
      `
        UPDATE pages
        SET title = ?, slug = ?, content = ?, updated_at = ?
        WHERE id = ?
      `
    )
    .run(normalizedTitle, normalizedSlug, normalizedContent, new Date().toISOString(), id);

  return getPageById(id);
}

function deletePage(id) {
  const result = database.prepare('DELETE FROM pages WHERE id = ?').run(id);
  return result.changes > 0;
}

module.exports = {
  createPage,
  deletePage,
  getPageById,
  getPageBySlug,
  listPages,
  updatePage
};
