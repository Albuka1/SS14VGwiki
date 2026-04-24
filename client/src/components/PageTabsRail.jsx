import { Link } from 'react-router-dom';

import { prefetchPage } from '../utils/wikiCache';

export default function PageTabsRail({ activeSlug, pages, title = 'Вкладки страниц', toAll = '/#catalog' }) {
  const visiblePages = pages.slice(0, 9);

  return (
    <aside className="data-card xl:sticky xl:top-28">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="section-kicker">page tabs</p>
          <h3 className="mt-3 text-2xl font-semibold text-white">{title}</h3>
        </div>
        <span className="chip">{visiblePages.length}</span>
      </div>

      {visiblePages.length === 0 ? (
        <div className="mt-6 rounded-[24px] border border-dashed border-cyan-300/16 px-4 py-8 text-sm text-slate-400">
          Пока нет страниц для быстрых переходов.
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-2.5">
          {visiblePages.map((page) => {
            const isActive = page.slug === activeSlug;

            return (
              <Link
                className={`group flex items-center gap-3 rounded-[20px] border px-4 py-3 text-left transition ${
                  isActive
                    ? 'border-cyan-300/32 bg-cyan-400/12 text-white shadow-[0_0_34px_rgba(34,211,238,0.12)]'
                    : 'border-cyan-300/12 bg-slate-900/72 text-slate-200 hover:-translate-y-0.5 hover:border-cyan-300/24 hover:bg-slate-900'
                }`}
                key={page.id}
                onFocus={() => {
                  void prefetchPage(page.slug);
                }}
                onMouseEnter={() => {
                  void prefetchPage(page.slug);
                }}
                to={`/wiki/${page.slug}`}
              >
                <span
                  aria-hidden="true"
                  className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full transition ${
                    isActive ? 'bg-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.8)]' : 'bg-cyan-300/35 group-hover:bg-cyan-200'
                  }`}
                />
                <span className="min-w-0 flex-1 truncate text-[0.95rem] font-medium tracking-[0.02em] text-inherit">
                  {page.title}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      <Link className="secondary-button mt-6 w-full" to={toAll}>
        Открыть весь архив
      </Link>
    </aside>
  );
}
