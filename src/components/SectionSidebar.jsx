import { NavLink } from "react-router-dom";
import { getSectionLandingPage, getSectionPages } from "@/lib/pages";

function SectionSidebarBody({ entries, landingPage, totalEntries }) {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-xs uppercase tracking-[0.28em] text-gold/80">В разделе</p>
        <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-steel">
          {totalEntries} стр.
        </span>
      </div>
      {landingPage ? (
        <NavLink
          className={({ isActive }) =>
            [
              "mt-4 flex rounded-2xl border px-4 py-3 text-sm transition",
              isActive
                ? "border-ember/60 bg-[linear-gradient(135deg,rgba(255,138,61,0.2),rgba(255,255,255,0.05))] text-white"
                : "border-white/10 bg-white/5 text-steel hover:border-gold/40 hover:bg-white/[0.08] hover:text-white",
            ].join(" ")
          }
          to={landingPage.path}
        >
          {landingPage.heading}
        </NavLink>
      ) : null}
      <div className="section-sidebar-list mt-3 space-y-2">
        {entries.map((entry) => (
          <NavLink
            className={({ isActive }) =>
              [
                "block rounded-2xl border px-4 py-3 text-sm leading-6 transition",
                isActive
                  ? "border-ember/60 bg-[linear-gradient(135deg,rgba(255,138,61,0.16),rgba(255,255,255,0.04))] text-white"
                  : "border-white/10 bg-white/[0.03] text-steel hover:border-white/20 hover:bg-white/[0.06] hover:text-white",
              ].join(" ")
            }
            key={entry.path}
            to={entry.path}
          >
            {entry.heading}
          </NavLink>
        ))}
      </div>
    </>
  );
}

export function SectionSidebar({ page, mode = "both" }) {
  if (!page.section) {
    return null;
  }

  const landingPage = getSectionLandingPage(page.section);
  const entries = getSectionPages(page.section).filter((entry) => entry.routeType === "article");
  const totalEntries = entries.length + (landingPage ? 1 : 0);

  if (!landingPage && entries.length === 0) {
    return null;
  }

  const showMobile = mode === "both" || mode === "mobile";
  const showDesktop = mode === "both" || mode === "desktop";

  return (
    <>
      {showMobile ? (
        <div className="section-sidebar-mobile xl:hidden" data-reveal>
          <details className="section-sidebar-mobile-panel rounded-[1.5rem] border border-white/10 bg-white/[0.04] shadow-glow">
            <summary className="section-sidebar-mobile-trigger flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <p className="font-display text-[0.7rem] uppercase tracking-[0.26em] text-gold/80">Навигация</p>
                <p className="mt-1 text-sm text-white">Раздел {landingPage?.heading ?? page.heading}</p>
              </div>
              <span className="inline-flex shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-steel">
                {totalEntries} стр.
              </span>
            </summary>
            <div className="px-4 pb-4 pt-1">
              <SectionSidebarBody entries={entries} landingPage={landingPage} totalEntries={totalEntries} />
            </div>
          </details>
        </div>
      ) : null}
      {showDesktop ? (
        <aside
          className="section-sidebar sticky top-28 hidden h-fit min-w-0 self-start rounded-[1.75rem] border border-white/10 p-5 shadow-glow xl:block"
          data-reveal
        >
          <SectionSidebarBody entries={entries} landingPage={landingPage} totalEntries={totalEntries} />
        </aside>
      ) : null}
    </>
  );
}
