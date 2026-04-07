import fs from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";

const projectRoot = process.cwd();
const sourceRoot = path.join(projectRoot, "legacy-source");
const outputManifestFile = path.join(projectRoot, "src", "content", "generated", "site-content.js");
const outputPagesDir = path.join(projectRoot, "src", "content", "generated", "pages");
const sectionOrder = ["rules", "lore", "races", "corporations", "tech", "game"];
const hrefAliasMap = new Map([
  ["/lore#elizian-empire", "/races/human#elysian-empire"],
  ["/lore#greys", "/races/human#greys"],
  ["/game/corporate-law#kpb", "/game/corporate-law#oprs"],
]);

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
  const rewrittenHref = hash ? `${route}#${hash}` : route;

  return hrefAliasMap.get(rewrittenHref) ?? rewrittenHref;
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

function normalizeOutputHtml(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\sstyle="text-decoration:\s*none"/g, "")
    .replace(/\sstyle="transition:\s*all\s*0\.3s\s*ease"/g, "")
    .replace(/\n\s+\n/g, "\n")
    .trim();
}

function addClasses($, element, classes) {
  const currentClasses = new Set(
    ($(element).attr("class") || "")
      .split(/\s+/)
      .map((value) => value.trim())
      .filter(Boolean),
  );

  classes.filter(Boolean).forEach((className) => currentClasses.add(className));

  if (currentClasses.size > 0) {
    $(element).attr("class", Array.from(currentClasses).join(" "));
  }
}

function sanitizeStyle(style) {
  const declarations = style
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean);

  const visualProperties = new Set([
    "background",
    "background-color",
    "background-image",
    "border",
    "border-top",
    "border-right",
    "border-bottom",
    "border-left",
    "border-color",
    "border-radius",
    "box-shadow",
    "color",
    "padding",
    "padding-top",
    "padding-right",
    "padding-bottom",
    "padding-left",
    "margin",
    "margin-top",
    "margin-right",
    "margin-bottom",
    "margin-left",
    "text-shadow",
    "filter",
    "opacity",
    "display",
    "grid-template-columns",
    "gap",
    "align-items",
    "justify-content",
    "flex-wrap",
    "flex",
    "flex-basis",
    "text-align",
    "font-size",
    "list-style",
    "list-style-type",
    "text-decoration",
    "transition",
    "float",
    "width",
    "min-width",
    "max-width",
    "height",
    "min-height",
    "max-height",
    "position",
    "top",
    "right",
    "bottom",
    "left",
    "overflow",
    "overflow-x",
    "overflow-y",
  ]);

  const cleanedDeclarations = declarations.filter((declaration) => {
    const [property] = declaration.split(":");
    if (!property) {
      return false;
    }

    return !visualProperties.has(property.trim().toLowerCase());
  });

  return cleanedDeclarations.join("; ");
}

function decorateStyledElements($, contentRoot) {
  contentRoot.find("[style]").each((_, element) => {
    const style = ($(element).attr("style") || "").toLowerCase();
    const tag = element.tagName?.toLowerCase() || "";
    const classes = [];
    const className = $(element).attr("class") || "";
    const hasStructuredClass =
      className.includes("rule-group") ||
      className.includes("infobox") ||
      className.includes("home-") ||
      className.includes("card") ||
      className.includes("metric") ||
      className.includes("showcase");

    const isPanelLike =
      /(background|background-color):/.test(style) ||
      /border-left:\s*4px/.test(style) ||
      /padding:\s*/.test(style) ||
      /border-radius:\s*/.test(style);

    if (tag === "div" && isPanelLike && !hasStructuredClass) {
      classes.push("legacy-panel");
    }

    if (/border-left:\s*4px solid var\(--accent-orange\)/.test(style)) {
      classes.push("legacy-panel-ember");
    }

    if (/border-left:\s*4px solid var\(--accent-gold\)/.test(style)) {
      classes.push("legacy-panel-gold");
    }

    if (/background:\s*rgba\(0,0,0,0\.2\)|background-color:\s*var\(--surface-dark\)/.test(style)) {
      classes.push("legacy-panel-muted");
    }

    if (/text-align:\s*center/.test(style)) {
      classes.push("legacy-center");
    }

    if (/display:\s*grid/.test(style)) {
      classes.push("legacy-grid");
    }

    if (/grid-template-columns:\s*1fr 1fr/.test(style)) {
      classes.push("legacy-grid-2");
    }

    if (/grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(200px,\s*1fr\)\)/.test(style)) {
      classes.push("legacy-grid-fluid-sm");
    }

    if (/grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(300px,\s*1fr\)\)/.test(style)) {
      classes.push("legacy-grid-fluid-lg");
    }

    if (/display:\s*flex/.test(style)) {
      classes.push("legacy-flex");
    }

    if (/align-items:\s*center/.test(style)) {
      classes.push("legacy-items-center");
    }

    if (/justify-content:\s*center/.test(style)) {
      classes.push("legacy-justify-center");
    }

    if (/flex-wrap:\s*wrap/.test(style)) {
      classes.push("legacy-wrap");
    }

    if (/gap:\s*1\.5rem/.test(style)) {
      classes.push("legacy-gap-lg");
    } else if (/gap:\s*(0\.5rem|0\.8rem|1rem)/.test(style)) {
      classes.push("legacy-gap");
    }

    if (/font-size:\s*1\.1rem/.test(style)) {
      classes.push("legacy-lead");
    }

    if (/font-size:\s*0\.9rem/.test(style)) {
      classes.push("legacy-small");
    }

    if (/font-size:\s*0\.7rem/.test(style)) {
      classes.push("legacy-icon-xs");
    }

    if (/color:\s*(#ff8a8a|#f87171)/.test(style)) {
      classes.push("legacy-tone-danger");
    }

    if (/color:\s*(#4ade80|#2ecc71)/.test(style)) {
      classes.push("legacy-tone-success");
    }

    if (/color:\s*(#3498db|var\(--accent-blue\))/.test(style)) {
      classes.push("legacy-tone-sky");
    }

    if (/color:\s*(#9b59b6)/.test(style)) {
      classes.push("legacy-tone-violet");
    }

    if (/color:\s*(var\(--accent-gold\)|#f1c40f|#feb908)/.test(style)) {
      classes.push("legacy-tone-gold");
    }

    if (/color:\s*(var\(--accent-orange\)|#de7219)/.test(style)) {
      classes.push("legacy-tone-ember");
    }

    if (tag === "ul" || tag === "ol") {
      if (/list-style-type:\s*none/.test(style) || /padding-left:\s*0/.test(style)) {
        classes.push("legacy-list-plain");
      }

      if (/list-style-type:\s*disc/.test(style)) {
        classes.push("legacy-list-disc");
      }

      if (/list-style-type:\s*decimal/.test(style) || /list-style:\s*decimal/.test(style)) {
        classes.push("legacy-list-decimal");
      }

      if (/margin-left:\s*2rem/.test(style) || /padding-left:\s*2rem/.test(style)) {
        classes.push("legacy-indent");
      }
    }

    addClasses($, element, classes);

    if (className.includes("infobox")) {
      $(element).removeAttr("style");
      return;
    }

    const cleanedStyle = sanitizeStyle(style);
    if (cleanedStyle) {
      $(element).attr("style", cleanedStyle);
    } else {
      $(element).removeAttr("style");
    }
  });
}

function ensureAnchorAlias($, target, id) {
  if (!target?.length || $(`#${id}`).length) {
    return;
  }

  const firstTarget = target.first();
  const existingId = firstTarget.attr("id");

  if (!existingId) {
    firstTarget.attr("id", id);
    return;
  }

  firstTarget.before(`<span id="${id}"></span>`);
}

function findByText($, contentRoot, selector, needle) {
  return contentRoot
    .find(selector)
    .filter((_, element) => textContent($(element).text()).includes(needle))
    .first();
}

function addStructuralAnchors(relativeFilePath, $, contentRoot) {
  contentRoot.find(".code-reference").each((_, element) => {
    const code = textContent($(element).text());

    if (!/^\d{3}$/u.test(code)) {
      return;
    }

    ensureAnchorAlias($, $(element).closest("tr"), code);
  });

  switch (relativeFilePath) {
    case "lore/index.html":
      ensureAnchorAlias($, findByText($, contentRoot, "h3", "Фронтир"), "frontier");
      break;
    case "races/human.html":
      ensureAnchorAlias($, findByText($, contentRoot, "h2", "Элизианская Империя"), "elysian-empire");
      ensureAnchorAlias($, findByText($, contentRoot, "p", "Несмотря на хорошие отношения"), "greys");
      break;
    case "corporations/index.html":
      ensureAnchorAlias($, findByText($, contentRoot, ".rule-group h3", "NanoTrasen"), "central-command");
      break;
    case "tech/energy.html":
      ensureAnchorAlias($, findByText($, contentRoot, "h2", "Антиматерия"), "antimatter");
      ensureAnchorAlias($, findByText($, contentRoot, "h2", "Генераторы гравитации"), "gravity");
      ensureAnchorAlias($, findByText($, contentRoot, "h2", "Плазма"), "plasma");
      ensureAnchorAlias($, findByText($, contentRoot, "h2", "Сингулярность"), "singularity");
      break;
    case "tech/ships.html":
      ensureAnchorAlias($, findByText($, contentRoot, "h2", "МКК"), "mkk");
      break;
    case "game/sop-cargo.html":
      ensureAnchorAlias($, findByText($, contentRoot, ".role-title", "Квартирмейстер"), "kvartirmeyster");
      break;
    case "game/corporate-law.html":
      ensureAnchorAlias($, findByText($, contentRoot, "h2", "ОПРС"), "kpb");
      break;
    default:
      break;
  }
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

    decorateStyledElements($, contentRoot);
    addStructuralAnchors(relativeFilePath, $, contentRoot);

    const route = toRoute(relativeFilePath);
    const pageHeader = $(".page-header").first();
    const rawTitle = textContent($("title").first().text());
    const heading = textContent(pageHeader.find("h1").first().text()) || stripBranding(rawTitle) || "VanGuard Wiki";
    const section = routeType === "article" || routeType === "section" ? toPosix(relativeFilePath).split("/")[0] : null;
    const contentFile = createContentFileName(relativeFilePath);
    const contentPayload = {
      contentHtml: normalizeOutputHtml(contentRoot.html() || ""),
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
