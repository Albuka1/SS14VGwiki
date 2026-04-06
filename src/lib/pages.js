import { generatedPages } from "@/content/generated/site-content";

const pageContentModules = import.meta.glob("../content/generated/pages/*.json", {
  import: "default",
});

export function normalizePath(pathname) {
  if (!pathname || pathname === "") {
    return "/";
  }

  if (pathname !== "/" && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

export const allPages = generatedPages;

const pageLookup = new Map(allPages.map((page) => [normalizePath(page.path), page]));

export function getPageByPath(pathname) {
  return pageLookup.get(normalizePath(pathname)) ?? null;
}

export function getSectionPages(sectionKey) {
  if (sectionKey === "rules") {
    return allPages.filter((page) => page.path === "/rules");
  }

  return allPages.filter((page) => page.section === sectionKey);
}

export function getSectionLandingPage(sectionKey) {
  if (sectionKey === "rules") {
    return getPageByPath("/rules");
  }

  return getPageByPath(`/${sectionKey}`);
}

export function getSiblingPages(pathname) {
  const page = getPageByPath(pathname);

  if (!page?.section) {
    return [];
  }

  return allPages.filter(
    (entry) =>
      entry.section === page.section &&
      entry.path !== page.path &&
      entry.routeType === "article",
  );
}

export async function loadPageContent(page) {
  if (!page?.contentFile) {
    return { contentHtml: "", quickDock: [] };
  }

  const loader = pageContentModules[`../content/generated/pages/${page.contentFile}`];

  if (!loader) {
    throw new Error(`Content module not found for ${page.path}`);
  }

  return loader();
}
