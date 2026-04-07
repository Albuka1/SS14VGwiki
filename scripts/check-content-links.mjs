import { readFile } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "cheerio";
import { generatedPages } from "../src/content/generated/site-content.js";

const currentFile = fileURLToPath(import.meta.url);
const rootDir = resolve(dirname(currentFile), "..");
const pagesDir = join(rootDir, "src", "content", "generated", "pages");

function normalizePath(pathname) {
  if (!pathname || pathname === "") {
    return "/";
  }

  if (pathname !== "/" && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

function decodeHash(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function isExternalHref(href) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href);
}

async function readPagePayload(page) {
  if (!page.contentFile) {
    return { contentHtml: "", quickDock: [] };
  }

  const payloadPath = join(pagesDir, page.contentFile);
  const raw = await readFile(payloadPath, "utf8");
  return JSON.parse(raw);
}

function collectAnchors(contentHtml) {
  const $ = load(contentHtml ?? "");
  const anchors = new Set();

  $("[id]").each((_, element) => {
    const id = $(element).attr("id");
    if (id) {
      anchors.add(id);
    }
  });

  $("a[name]").each((_, element) => {
    const name = $(element).attr("name");
    if (name) {
      anchors.add(name);
    }
  });

  return anchors;
}

const pagesByPath = new Map(generatedPages.map((page) => [normalizePath(page.path), page]));
const pagePayloads = new Map();
const pageAnchors = new Map();

for (const page of generatedPages) {
  const payload = await readPagePayload(page);
  pagePayloads.set(page.path, payload);
  pageAnchors.set(page.path, collectAnchors(payload.contentHtml));
}

const issues = [];

function addIssue(message) {
  issues.push(message);
}

function validateHref(sourcePath, href, originLabel) {
  if (!href || isExternalHref(href)) {
    return;
  }

  if (href.startsWith("#")) {
    const anchor = decodeHash(href.slice(1));
    if (!anchor) {
      return;
    }

    const anchors = pageAnchors.get(sourcePath) ?? new Set();
    if (!anchors.has(anchor)) {
      addIssue(`${sourcePath}: ${originLabel} указывает на отсутствующий якорь ${href}`);
    }
    return;
  }

  if (!href.startsWith("/")) {
    addIssue(`${sourcePath}: ${originLabel} использует неподдерживаемую относительную ссылку ${href}`);
    return;
  }

  const [rawPath, rawHash = ""] = href.split("#");
  const targetPath = normalizePath(rawPath || "/");
  const targetPage = pagesByPath.get(targetPath);

  if (!targetPage) {
    addIssue(`${sourcePath}: ${originLabel} указывает на отсутствующий маршрут ${targetPath}`);
    return;
  }

  if (!rawHash) {
    return;
  }

  const anchor = decodeHash(rawHash);
  const anchors = pageAnchors.get(targetPage.path) ?? new Set();

  if (!anchors.has(anchor)) {
    addIssue(`${sourcePath}: ${originLabel} указывает на отсутствующий якорь ${href}`);
  }
}

for (const page of generatedPages) {
  const payload = pagePayloads.get(page.path) ?? { contentHtml: "", quickDock: [] };
  const $ = load(payload.contentHtml ?? "");

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    validateHref(page.path, href, "контент");
  });

  for (const item of payload.quickDock ?? []) {
    validateHref(page.path, item.href, `quickDock (${item.label ?? "без названия"})`);
  }
}

if (issues.length > 0) {
  console.error("Найдены проблемы во внутренних ссылках и якорях:");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log(`Проверка ссылок пройдена: ${generatedPages.length} страниц, ошибок не найдено.`);
