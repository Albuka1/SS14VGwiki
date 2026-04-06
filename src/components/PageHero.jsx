import { sectionMeta } from "@/content/navigation";

export function PageHero({ page }) {
  const meta = sectionMeta[page.navKey] ?? sectionMeta.home;

  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br ${meta.tone} px-6 py-8 shadow-glow sm:px-8`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_30%)]" />
      <div className="relative flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xl text-ember shadow-ember">
          <i className={page.iconClass || meta.iconClass} aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <p className="font-display text-sm uppercase tracking-[0.3em] text-gold/80">
            {meta.label}
          </p>
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
            {page.heading}
          </h1>
          {page.excerpt ? (
            <p className="max-w-3xl text-sm leading-7 text-steel sm:text-base">
              {page.excerpt}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
