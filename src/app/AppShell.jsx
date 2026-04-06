import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getPageByPath } from "@/lib/pages";

function ScrollManager() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const elementId = decodeURIComponent(location.hash.slice(1));
      requestAnimationFrame(() => {
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const page = getPageByPath(location.pathname);
    document.title = page ? `${page.title} · VanGuard Wiki` : "VanGuard Wiki";
  }, [location.pathname]);

  return null;
}

export function AppShell({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-hero-grid bg-[size:72px_72px] opacity-[0.05]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[42rem] bg-[radial-gradient(circle_at_top,rgba(255,138,61,0.16),transparent_50%),radial-gradient(circle_at_20%_20%,rgba(83,143,255,0.12),transparent_35%)]" />
      <ScrollManager />
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
