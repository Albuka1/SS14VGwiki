import { useState } from "react";
import { NavLink } from "react-router-dom";
import { primaryNavigation } from "@/content/navigation";

function navigationClassName(isActive) {
  return [
    "site-nav-link inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm transition duration-300",
    isActive
      ? "border-amber-300/45 bg-[linear-gradient(135deg,rgba(255,166,102,0.14),rgba(255,255,255,0.07))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_26px_rgba(255,166,102,0.12)]"
      : "border-white/10 bg-white/[0.03] text-steel hover:-translate-y-0.5 hover:border-gold/40 hover:bg-white/[0.08] hover:text-white",
  ].join(" ");
}

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="site-header sticky top-0 z-40 border-b border-white/10 bg-void/75 backdrop-blur-2xl">
      <div className="site-header-inner mx-auto flex w-full max-w-[1520px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <NavLink className="group flex items-center gap-3" to="/" onClick={() => setIsOpen(false)}>
          <div className="site-brand-mark flex h-12 w-12 items-center justify-center rounded-2xl border border-ember/25 text-gold transition duration-300 group-hover:scale-105">
            <i className="fas fa-book-open" aria-hidden="true" />
          </div>
          <div>
            <p className="font-display text-lg font-bold text-white transition duration-300 group-hover:text-gold">
              VanGuard Wiki
            </p>
            <p className="text-xs uppercase tracking-[0.32em] text-steel">SS14 · Medium RP</p>
          </div>
        </NavLink>

        <button
          aria-expanded={isOpen}
          aria-label="Открыть меню"
          className="mobile-menu-button inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white shadow-glow md:hidden"
          onClick={() => setIsOpen((open) => !open)}
          type="button"
        >
          <i className={`fas ${isOpen ? "fa-xmark" : "fa-bars"}`} aria-hidden="true" />
        </button>

        <nav
          className={`${isOpen ? "flex" : "hidden"} site-nav-surface absolute inset-x-4 top-[calc(100%+0.75rem)] flex-col gap-2 rounded-[1.75rem] border border-white/10 bg-void/95 p-4 shadow-glow md:static md:flex md:flex-row md:flex-wrap md:items-center md:justify-end md:rounded-full md:border md:border-white/10 md:bg-white/[0.03] md:p-2 md:shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_12px_32px_rgba(5,9,21,0.35)]`}
        >
          {primaryNavigation.map((item) => (
            <NavLink
              className={({ isActive }) => navigationClassName(isActive)}
              key={item.key}
              onClick={() => setIsOpen(false)}
              to={item.to}
            >
              <i className={item.iconClass} aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
