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
    <div className="app-shell relative min-h-screen">
      <div aria-hidden="true" className="app-scene pointer-events-none absolute inset-0 -z-20 overflow-hidden">
        <div className="app-backdrop absolute inset-0" />
        <div className="app-grid absolute inset-0" />
        <div className="app-noise absolute inset-0" />
        <div className="app-orb app-orb-left absolute -left-[10rem] top-24 -z-10" />
        <div className="app-orb app-orb-right absolute -right-[6rem] top-20 -z-10" />
        <div className="app-orb app-orb-bottom absolute bottom-[-12rem] left-1/2 -z-10 -translate-x-1/2" />
        <div className="app-beam app-beam-left absolute inset-y-0 left-0 -z-10 w-[18vw]" />
        <div className="app-beam app-beam-right absolute inset-y-0 right-0 -z-10 w-[12vw]" />
      </div>
      <ScrollManager />
      <SiteHeader />
      <main className="site-main mx-auto flex min-w-0 w-full max-w-[1480px] flex-1 flex-col px-4 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-8 lg:px-8">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
