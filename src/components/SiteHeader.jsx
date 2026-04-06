import { useState } from "react";
import { NavLink } from "react-router-dom";
import { primaryNavigation } from "@/content/navigation";

function navigationClassName(isActive) {
  return [
    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition",
    isActive
      ? "border-ember/70 bg-ember/10 text-white shadow-ember"
      : "border-white/10 bg-white/[0.03] text-steel hover:border-gold/40 hover:text-white",
  ].join(" ");
}

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-void/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <NavLink className="group flex items-center gap-3" to="/" onClick={() => setIsOpen(false)}>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-ember/30 bg-ember/10 text-gold shadow-ember">
            <i className="fas fa-book-open" aria-hidden="true" />
          </div>
          <div>
            <p className="font-display text-lg font-bold text-white">VanGuard Wiki</p>
            <p className="text-xs uppercase tracking-[0.28em] text-steel">SS14 · Medium RP</p>
          </div>
        </NavLink>

        <button
          aria-expanded={isOpen}
          aria-label="Открыть меню"
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white md:hidden"
          onClick={() => setIsOpen((open) => !open)}
          type="button"
        >
          <i className={`fas ${isOpen ? "fa-xmark" : "fa-bars"}`} aria-hidden="true" />
        </button>

        <nav
          className={`${isOpen ? "flex" : "hidden"} absolute inset-x-4 top-[calc(100%+0.75rem)] flex-col gap-2 rounded-[1.75rem] border border-white/10 bg-void/95 p-4 shadow-glow md:static md:flex md:flex-row md:flex-wrap md:items-center md:justify-end md:border-0 md:bg-transparent md:p-0 md:shadow-none`}
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
