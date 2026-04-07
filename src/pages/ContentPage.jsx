import { useRef } from "react";
import { useLocation } from "react-router-dom";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageHero } from "@/components/PageHero";
import { RichContent } from "@/components/RichContent";
import { SectionSidebar } from "@/components/SectionSidebar";
import { useRevealAnimations } from "@/lib/useRevealAnimations";
import { usePageContent } from "@/lib/usePageContent";
import { NotFoundPage } from "@/pages/NotFoundPage";

export function ContentPage() {
  const location = useLocation();
  const { page, content, error, isLoading } = usePageContent(location.pathname);
  const containerRef = useRef(null);

  useRevealAnimations(containerRef, [content, location.pathname]);

  if (!page || page.routeType === "home") {
    return <NotFoundPage />;
  }

  return (
    <div
      ref={containerRef}
      className="page-layout grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(17rem,20rem)] xl:gap-8"
    >
      <div className="min-w-0 space-y-5">
        <div data-reveal>
          <Breadcrumbs items={page.breadcrumbs} />
        </div>
        <PageHero page={page} />
        <SectionSidebar page={page} mode="mobile" />
        <section
          className="page-surface min-w-0 overflow-hidden rounded-[2rem] border border-white/10 p-5 shadow-glow backdrop-blur-sm sm:p-8"
          data-reveal
        >
          {error ? (
            <div className="mb-5 rounded-3xl border border-rose-400/20 bg-rose-400/10 px-5 py-4 text-sm text-rose-200">
              Контент страницы не загрузился. Проверь генерацию `npm run sync:content`.
            </div>
          ) : null}
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-6 w-52 animate-pulse rounded-full bg-white/10" />
              <div className="h-6 w-40 animate-pulse rounded-full bg-white/10" />
              <div className="h-32 animate-pulse rounded-[1.5rem] bg-white/5" />
              <div className="h-48 animate-pulse rounded-[1.5rem] bg-white/5" />
            </div>
          ) : (
            <RichContent html={content?.contentHtml ?? ""} />
          )}
        </section>
      </div>
      <SectionSidebar page={page} mode="desktop" />
    </div>
  );
}
