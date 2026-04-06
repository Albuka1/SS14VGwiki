import { Link } from "react-router-dom";
import { primaryNavigation } from "@/content/navigation";

export function NotFoundPage() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center shadow-glow sm:p-12">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-ember/30 bg-ember/10 text-2xl text-gold shadow-ember">
        <i className="fas fa-satellite-dish" aria-hidden="true" />
      </div>
      <div className="space-y-3">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-gold/80">404</p>
        <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
          Страница не найдена
        </h1>
        <p className="text-steel">
          Возможно, ссылка устарела после миграции со старой HTML-структуры. Ниже есть быстрые
          переходы по основным разделам.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {primaryNavigation.map((item) => (
          <Link
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-steel transition hover:border-gold/40 hover:text-white"
            key={item.key}
            to={item.to}
          >
            <i className={item.iconClass} aria-hidden="true" />
            {item.label}
          </Link>
        ))}
      </div>
      <div>
        <Link
          className="inline-flex items-center gap-2 rounded-full border border-ember/60 bg-ember/10 px-5 py-3 text-sm text-white shadow-ember transition hover:border-gold/50 hover:text-gold"
          to="/"
        >
          <i className="fas fa-home" aria-hidden="true" />
          На главную
        </Link>
      </div>
    </section>
  );
}
