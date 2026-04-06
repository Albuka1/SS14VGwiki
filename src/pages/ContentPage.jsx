import { useLocation } from "react-router-dom";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageHero } from "@/components/PageHero";
import { RichContent } from "@/components/RichContent";
import { SectionSidebar } from "@/components/SectionSidebar";
import { usePageContent } from "@/lib/usePageContent";
import { NotFoundPage } from "@/pages/NotFoundPage";

export function ContentPage() {
  const location = useLocation();
  const { page, content, isLoading } = usePageContent(location.pathname);

  if (!page || page.routeType === "home") {
    return <NotFoundPage />;
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="space-y-5">
        <Breadcrumbs items={page.breadcrumbs} />
        <PageHero page={page} />
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-glow sm:p-8">
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
      <SectionSidebar page={page} />
    </div>
  );
}
