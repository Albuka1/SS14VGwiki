import fs from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";

const projectRoot = process.cwd();
const sourceRoot = path.join(projectRoot, "legacy-source");
const outputManifestFile = path.join(projectRoot, "src", "content", "generated", "site-content.js");
const outputPagesDir = path.join(projectRoot, "src", "content", "generated", "pages");
const sectionOrder = ["rules", "lore", "races", "corporations", "tech", "game"];

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

function toRoute(relativeFilePath) {
  const normalized = toPosix(relativeFilePath).replace(/^\/+/, "");

  if (normalized === "index.html") {
    return "/";
  }

  if (normalized.endsWith("/index.html")) {
    return `/${normalized.replace(/\/index\.html$/, "")}`;
  }

  return `/${normalized.replace(/\.html$/, "")}`;
}

function stripBranding(title) {
  return title
    .replace(/\s*·\s*Вики SS14$/u, "")
    .replace(/\s*·\s*VanGuard$/u, "")
    .replace(/^VanGuard\s*·\s*/u, "")
    .trim();
}

function getRouteType(relativeFilePath) {
  const normalized = toPosix(relativeFilePath);

  if (normalized === "index.html") {
    return "home";
  }

  if (normalized === "rules.html") {
    return "standalone";
  }

  if (normalized.endsWith("/index.html")) {
    return "section";
  }

  return "article";
}

function resolveTarget(currentFile, targetPath) {
  const currentDir = path.posix.dirname(`/${toPosix(currentFile)}`);
  const resolved = path.posix.normalize(path.posix.join(currentDir, targetPath));
  return resolved.replace(/^\/+/, "");
}

function rewriteHref(currentFile, href) {
  if (!href) {
    return href;
  }

  if (
    href.startsWith("#") ||
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  ) {
    return href;
  }

  const [targetPath, hash] = href.split("#");

  if (!targetPath || !targetPath.endsWith(".html")) {
    return href;
  }

  const route = toRoute(resolveTarget(currentFile, targetPath));
  return hash ? `${route}#${hash}` : route;
}

function rewriteSrc(currentFile, src) {
  if (!src || src.startsWith("/") || src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) {
    return src;
  }

  return `/${resolveTarget(currentFile, src)}`;
}

function textContent(value) {
  return value.replace(/\s+/g, " ").trim();
}

function extractBreadcrumbs($, currentFile) {
  const breadcrumbRoot = $(".home-breadcrumbs").first().length
    ? $(".home-breadcrumbs").first()
    : $(".breadcrumbs").first();

  if (!breadcrumbRoot.length) {
    return [];
  }

  const items = [];

  breadcrumbRoot.children().each((_, element) => {
    const tagName = element.tagName?.toLowerCase();
    const label = textContent($(element).text());

    if (!label || label === "/") {
      return;
    }

    if (tagName === "a") {
      items.push({
        label,
        to: rewriteHref(currentFile, $(element).attr("href")),
      });
      return;
    }

    items.push({ label });
  });

  return items;
}

function extractQuickDock($) {
  return $(".quick-dock a")
    .map((_, element) => ({
      iconClass: $(element).find("i").attr("class") || "",
      label: $(element).attr("title") || textContent($(element).text()) || "Переход",
      href: $(element).attr("href") || "#",
    }))
    .get();
}

function getExcerpt(contentRoot) {
  const firstParagraph = textContent(contentRoot.find("p").first().text());
  return firstParagraph.slice(0, 220);
}

function getSectionKey(route) {
  if (route === "/") {
    return "home";
  }

  if (route === "/rules") {
    return "rules";
  }

  const [, section] = route.split("/");
  return section || "home";
}

function createContentFileName(relativeFilePath) {
  return toPosix(relativeFilePath)
    .replace(/\.html$/, "")
    .replace(/[^\w/-]+/g, "-")
    .replace(/[\\/]/g, "--")
    .replace(/-+/g, "-")
    .toLowerCase()
    .concat(".json");
}

function sortPages(left, right) {
  const getWeight = (page) => {
    if (page.path === "/") {
      return [-2, -2, page.path];
    }

    if (page.path === "/rules") {
      return [-1, -1, page.path];
    }

    const orderIndex = sectionOrder.indexOf(page.navKey);
    const sectionIndex = orderIndex === -1 ? 99 : orderIndex;
    const routeTypeIndex = page.routeType === "section" ? 0 : 1;

    return [sectionIndex, routeTypeIndex, page.path];
  };

  const leftWeight = getWeight(left);
  const rightWeight = getWeight(right);

  if (leftWeight[0] !== rightWeight[0]) {
    return leftWeight[0] - rightWeight[0];
  }

  if (leftWeight[1] !== rightWeight[1]) {
    return leftWeight[1] - rightWeight[1];
  }

  return leftWeight[2].localeCompare(rightWeight[2], "ru");
}

async function walkHtmlFiles(directory) {
  const results = [];
  const entries = await fs.readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      results.push(...(await walkHtmlFiles(fullPath)));
      continue;
    }

    if (entry.name.endsWith(".html")) {
      results.push(fullPath);
    }
  }

  return results;
}

async function main() {
  const sourceFiles = (await walkHtmlFiles(sourceRoot)).sort();
  const pages = [];

  await fs.rm(outputPagesDir, { recursive: true, force: true });
  await fs.mkdir(outputPagesDir, { recursive: true });

  for (const filePath of sourceFiles) {
    const relativeFilePath = toPosix(path.relative(sourceRoot, filePath));
    const routeType = getRouteType(relativeFilePath);
    const html = await fs.readFile(filePath, "utf8");
    const $ = load(html, { decodeEntities: false });
    const contentRoot = routeType === "home" ? $(".home-main").first() : $(".wiki-article").first();

    if (!contentRoot.length) {
      throw new Error(`Content root not found in ${relativeFilePath}`);
    }

    contentRoot.find("a[href]").each((_, element) => {
      $(element).attr("href", rewriteHref(relativeFilePath, $(element).attr("href")));
    });

    contentRoot.find("img[src]").each((_, element) => {
      $(element).attr("src", rewriteSrc(relativeFilePath, $(element).attr("src")));
    });

    const route = toRoute(relativeFilePath);
    const pageHeader = $(".page-header").first();
    const rawTitle = textContent($("title").first().text());
    const heading = textContent(pageHeader.find("h1").first().text()) || stripBranding(rawTitle) || "VanGuard Wiki";
    const section = routeType === "article" || routeType === "section" ? toPosix(relativeFilePath).split("/")[0] : null;
    const contentFile = createContentFileName(relativeFilePath);
    const contentPayload = {
      contentHtml: contentRoot.html()?.trim() || "",
      quickDock: routeType === "home" ? extractQuickDock($) : [],
    };

    await fs.writeFile(
      path.join(outputPagesDir, contentFile),
      `${JSON.stringify(contentPayload, null, 2)}\n`,
      "utf8",
    );

    pages.push({
      path: route,
      source: relativeFilePath,
      contentFile,
      routeType,
      section,
      navKey: getSectionKey(route),
      title: stripBranding(rawTitle) || heading,
      heading,
      iconClass: pageHeader.find("i").first().attr("class") || "",
      breadcrumbs: extractBreadcrumbs($, relativeFilePath),
      excerpt: getExcerpt(contentRoot),
      footerNote: textContent($("footer p").first().text()) || null,
    });
  }

  pages.sort(sortPages);

  const fileContents = `export const generatedPages = ${JSON.stringify(pages, null, 2)};\n`;

  await fs.mkdir(path.dirname(outputManifestFile), { recursive: true });
  await fs.writeFile(outputManifestFile, fileContents, "utf8");

  console.log(`Generated ${pages.length} pages into ${path.relative(projectRoot, outputManifestFile)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
