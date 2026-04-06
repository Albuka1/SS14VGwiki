import { QuickDock } from "@/components/QuickDock";
import { RichContent } from "@/components/RichContent";
import { usePageContent } from "@/lib/usePageContent";

export function HomePage() {
  const { page, content, isLoading } = usePageContent("/");

  if (!page) {
    return null;
  }

  return (
    <>
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-glow sm:p-8">
        {isLoading ? (
          <div className="grid gap-4">
            <div className="h-6 w-36 animate-pulse rounded-full bg-white/10" />
            <div className="h-16 animate-pulse rounded-[1.5rem] bg-white/5" />
            <div className="h-56 animate-pulse rounded-[2rem] bg-white/5" />
          </div>
        ) : (
          <RichContent className="content-home" html={content?.contentHtml ?? ""} />
        )}
      </section>
      <QuickDock items={content?.quickDock ?? []} />
    </>
  );
}
