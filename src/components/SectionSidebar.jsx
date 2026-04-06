import { NavLink } from "react-router-dom";
import { getSectionLandingPage, getSectionPages } from "@/lib/pages";

export function SectionSidebar({ page }) {
  if (!page.section) {
    return null;
  }

  const landingPage = getSectionLandingPage(page.section);
  const entries = getSectionPages(page.section).filter((entry) => entry.routeType === "article");

  if (!landingPage && entries.length === 0) {
    return null;
  }

  return (
    <aside className="sticky top-28 hidden h-fit rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 shadow-glow xl:block">
      <p className="font-display text-xs uppercase tracking-[0.28em] text-gold/80">В разделе</p>
      {landingPage ? (
        <NavLink
          className={({ isActive }) =>
            [
              "mt-4 flex rounded-2xl border px-4 py-3 text-sm transition",
              isActive
                ? "border-ember/60 bg-ember/10 text-white"
                : "border-white/10 bg-white/5 text-steel hover:border-gold/40 hover:text-white",
            ].join(" ")
          }
          to={landingPage.path}
        >
          {landingPage.heading}
        </NavLink>
      ) : null}
      <div className="mt-3 space-y-2">
        {entries.map((entry) => (
          <NavLink
            className={({ isActive }) =>
              [
                "block rounded-2xl border px-4 py-3 text-sm leading-6 transition",
                isActive
                  ? "border-ember/60 bg-ember/10 text-white"
                  : "border-white/10 bg-white/[0.03] text-steel hover:border-white/20 hover:text-white",
              ].join(" ")
            }
            key={entry.path}
            to={entry.path}
          >
            {entry.heading}
          </NavLink>
        ))}
      </div>
    </aside>
  );
}
