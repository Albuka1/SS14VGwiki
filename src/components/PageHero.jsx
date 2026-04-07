import { sectionMeta } from "@/content/navigation";

export function PageHero({ page }) {
  const meta = sectionMeta[page.navKey] ?? sectionMeta.home;

  return (
    <div
      className={`page-hero relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br ${meta.tone} px-6 py-8 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_48px_rgba(6,10,20,0.38)] sm:px-8`}
      data-reveal
    >
      <div className="page-hero-grid pointer-events-none absolute inset-0" />
      <div className="page-hero-ambient pointer-events-none absolute inset-0" />
      <div className="page-hero-orb pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
      <div className="relative z-10 flex min-w-0 flex-col items-start gap-4 sm:flex-row">
        <div className="page-hero-icon flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 text-xl text-ember shadow-[0_12px_30px_rgba(255,138,61,0.14)]">
          <i className={page.iconClass || meta.iconClass} aria-hidden="true" />
        </div>
        <div className="min-w-0 space-y-2">
          <p className="page-hero-eyebrow inline-flex rounded-full border border-white/10 px-3 py-1 font-display text-xs uppercase tracking-[0.3em] text-gold/80">
            {meta.label}
          </p>
          <h1 className="page-hero-title font-display text-3xl font-bold text-white sm:text-4xl">
            {page.heading}
          </h1>
          {page.excerpt ? (
            <p className="page-hero-copy max-w-3xl text-sm leading-7 text-steel sm:text-base">
              {page.excerpt}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
