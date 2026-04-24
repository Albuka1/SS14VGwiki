import { useDeferredValue, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import PageTabsRail from '../components/PageTabsRail';
import { formatDate } from '../utils/formatDate';
import { fetchPageSummaries, getCachedPageSummaries, prefetchPage } from '../utils/wikiCache';

function isUpdatedRecently(value) {
  const updatedAt = new Date(value).getTime();
  return Date.now() - updatedAt < 7 * 24 * 60 * 60 * 1000;
}

export default function HomePage() {
  const cachedPages = getCachedPageSummaries();
  const [pages, setPages] = useState(() => cachedPages ?? []);
  const [loading, setLoading] = useState(() => !cachedPages);
  const [syncing, setSyncing] = useState(() => Boolean(cachedPages));
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    let isMounted = true;

    async function loadPages() {
      setSyncing(Boolean(getCachedPageSummaries()));

      try {
        const data = await fetchPageSummaries();

        if (isMounted) {
          setPages(data);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setSyncing(false);
        }
      }
    }

    void loadPages();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!pages.length) {
      return undefined;
    }

    const timers = pages.slice(0, 4).map((page, index) =>
      window.setTimeout(() => {
        void prefetchPage(page.slug);
      }, 120 * (index + 1))
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [pages]);

  const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
  const filteredPages = normalizedQuery
    ? pages.filter((page) =>
        `${page.title} ${page.slug} ${page.excerpt}`.toLowerCase().includes(normalizedQuery)
      )
    : pages;
  const featuredPage = filteredPages[0] || pages[0] || null;
  const updatedRecentlyCount = pages.filter((page) => isUpdatedRecently(page.updated_at)).length;

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_310px]" id="overview">
        <div className="glass-panel p-6 sm:p-7 lg:p-8">
          <div className="flex flex-wrap gap-2.5">
            <span className="chip">SS14 knowledge dock</span>
            <span className="chip">instant route cache</span>
            <span className="chip">server archive</span>
          </div>

          <div className="mt-6 max-w-4xl">
            <p className="section-kicker">orbital knowledge sector</p>
            <h2 className="display-title mt-3 text-4xl leading-[0.95] text-white sm:text-6xl xl:text-[4.7rem]">
              Центр знаний Space Station 14
            </h2>
            <p className="mt-5 max-w-3xl text-[0.97rem] leading-8 text-slate-300 sm:text-base">
              Архив сервера, лор, правила, внутриигровые инструкции и документация экипажа собраны в одном компактном
              космическом интерфейсе. Всё осталось на главной странице, но теперь работает плотнее и аккуратнее.
            </p>
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Быстрый поиск по архиву</span>
              <input
                className="soft-input"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Правила, гайд, расы, профессии..."
                value={searchQuery}
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <Link className="primary-button" to={featuredPage ? `/wiki/${featuredPage.slug}` : '/#catalog'}>
                {featuredPage ? 'Открыть активную статью' : 'Перейти к архиву'}
              </Link>
              <Link className="secondary-button" to="/#catalog">
                Смотреть архив
              </Link>
            </div>
          </div>

          {error ? (
            <div className="mt-5 rounded-[20px] border border-rose-400/24 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-3">
              <div className="data-card p-4">
                <p className="section-kicker">всего</p>
                <p className="mt-3 text-3xl font-semibold text-white">{pages.length}</p>
                <p className="mt-2 text-sm text-slate-400">страниц на борту</p>
              </div>
              <div className="data-card p-4">
                <p className="section-kicker">активность</p>
                <p className="mt-3 text-3xl font-semibold text-white">{updatedRecentlyCount}</p>
                <p className="mt-2 text-sm text-slate-400">обновлено за 7 дней</p>
              </div>
              <div className="data-card p-4">
                <p className="section-kicker">поиск</p>
                <p className="mt-3 text-3xl font-semibold text-white">{filteredPages.length}</p>
                <p className="mt-2 text-sm text-slate-400">совпадений по запросу</p>
              </div>
            </div>

            <div className="data-card p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="section-kicker">быстрый доступ</p>
                  <h3 className="mt-3 text-2xl font-semibold text-white">
                    {featuredPage ? featuredPage.title : 'Ожидание первой записи'}
                  </h3>
                </div>
                {syncing ? <span className="chip">sync</span> : null}
              </div>

              <p className="mt-4 text-sm leading-7 text-slate-300">
                {featuredPage
                  ? featuredPage.excerpt || 'Откройте страницу, чтобы увидеть содержимое.'
                  : 'Когда появится первая статья, здесь автоматически отобразится актуальный материал.'}
              </p>

              <div className="station-divider mt-5" />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-400">
                  {featuredPage ? `Обновлено ${formatDate(featuredPage.updated_at)}` : 'Каталог пока пуст'}
                </p>
                {featuredPage ? (
                  <Link className="secondary-button" to={`/wiki/${featuredPage.slug}`}>
                    Открыть материал
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <PageTabsRail pages={filteredPages.length ? filteredPages : pages} title="Вкладки страниц" />
      </section>

      <section className="glass-panel p-6 sm:p-7 lg:p-8" id="catalog">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-kicker">public station archive</p>
            <h3 className="mt-3 text-3xl font-semibold text-white sm:text-[2.2rem]">Каталог wiki-страниц</h3>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <span>Публичный маршрут: `/wiki/:slug`</span>
            {syncing ? <span className="chip">кэш обновляется</span> : null}
          </div>
        </div>

        {loading ? (
          <div className="mt-7 rounded-[24px] border border-dashed border-cyan-300/16 px-6 py-10 text-center text-slate-400">
            Загружаю архивные карточки...
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="mt-7 rounded-[24px] border border-dashed border-cyan-300/16 px-6 py-10 text-center text-slate-400">
            {pages.length === 0
              ? 'Архив пока пуст. Создайте первую статью через терминал администратора.'
              : 'По текущему запросу ничего не найдено. Попробуйте другую формулировку.'}
          </div>
        ) : (
          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredPages.map((page) => (
              <Link
                className="data-card block p-5 transition hover:-translate-y-1 hover:border-cyan-300/26 hover:shadow-[0_22px_70px_rgba(8,47,73,0.45)]"
                key={page.id}
                onFocus={() => {
                  void prefetchPage(page.slug);
                }}
                onMouseEnter={() => {
                  void prefetchPage(page.slug);
                }}
                to={`/wiki/${page.slug}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="chip">/{page.slug}</span>
                  <span className="text-xs uppercase tracking-[0.24em] text-slate-400">{page.word_count} слов</span>
                </div>
                <h4 className="mt-5 text-[1.65rem] font-semibold leading-tight text-white">{page.title}</h4>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {page.excerpt || 'Краткое описание появится после добавления содержимого.'}
                </p>
                <div className="station-divider mt-5" />
                <p className="mt-4 text-sm text-slate-400">Обновлено {formatDate(page.updated_at)}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
