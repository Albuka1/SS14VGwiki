import { useDeferredValue, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { apiRequest } from '../utils/api';
import { clearAuthToken, getAuthToken } from '../utils/auth';
import { formatDate } from '../utils/formatDate';
import { createSlug } from '../utils/slugify';
import {
  fetchPageById,
  fetchPageSummaries,
  getCachedPageSummaries,
  prefetchPage,
  removePageFromCache,
  updateCacheWithPage
} from '../utils/wikiCache';

function isUpdatedToday(value) {
  const updatedAt = new Date(value);
  const now = new Date();

  return (
    updatedAt.getFullYear() === now.getFullYear() &&
    updatedAt.getMonth() === now.getMonth() &&
    updatedAt.getDate() === now.getDate()
  );
}

function buildDuplicatePayload(page) {
  const duplicateTitle = `${page.title} (копия)`;
  const uniqueSuffix = Date.now().toString(36);

  return {
    title: duplicateTitle,
    slug: createSlug(`${page.slug}-copy-${uniqueSuffix}`),
    content: page.content
  };
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const cachedPages = getCachedPageSummaries();
  const [pages, setPages] = useState(() => cachedPages ?? []);
  const [loading, setLoading] = useState(() => !cachedPages);
  const [syncing, setSyncing] = useState(() => Boolean(cachedPages));
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [busyActionKey, setBusyActionKey] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    let isMounted = true;

    async function loadPages() {
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

  const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
  const filteredPages = normalizedQuery
    ? pages.filter((page) =>
        `${page.title} ${page.slug} ${page.excerpt}`.toLowerCase().includes(normalizedQuery)
      )
    : pages;
  const updatedTodayCount = pages.filter((page) => isUpdatedToday(page.updated_at)).length;
  const lastUpdatedPage = pages[0] || null;

  async function handleDelete(page) {
    const confirmed = window.confirm(`Удалить страницу "${page.title}"?`);

    if (!confirmed) {
      return;
    }

    setBusyActionKey(`delete:${page.id}`);
    setError('');
    setNotice('');

    try {
      await apiRequest(`/api/pages/${page.id}`, {
        method: 'DELETE',
        token: getAuthToken()
      });

      removePageFromCache(page);
      setPages((currentPages) => currentPages.filter((item) => item.id !== page.id));
      setNotice(`Страница "${page.title}" удалена.`);
    } catch (requestError) {
      if (requestError.status === 401) {
        clearAuthToken();
        navigate('/login', { replace: true });
        return;
      }

      setError(requestError.message);
    } finally {
      setBusyActionKey('');
    }
  }

  async function handleCopyLink(page) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/wiki/${page.slug}`);
      setNotice(`Публичная ссылка на "${page.title}" скопирована.`);
    } catch {
      setError('Не удалось скопировать ссылку.');
    }
  }

  async function handleDuplicate(page) {
    setBusyActionKey(`duplicate:${page.id}`);
    setError('');
    setNotice('');

    try {
      const sourcePage = await fetchPageById(page.id, {
        token: getAuthToken()
      });

      const duplicatedPage = await apiRequest('/api/pages', {
        method: 'POST',
        token: getAuthToken(),
        body: buildDuplicatePayload(sourcePage)
      });

      updateCacheWithPage(duplicatedPage);
      const nextPages = await fetchPageSummaries({ force: true });
      setPages(nextPages);
      setNotice(`Создана копия страницы "${page.title}".`);
      navigate(`/admin/pages/${duplicatedPage.id}/edit`);
    } catch (requestError) {
      if (requestError.status === 401) {
        clearAuthToken();
        navigate('/login', { replace: true });
        return;
      }

      setError(requestError.message);
    } finally {
      setBusyActionKey('');
    }
  }

  return (
    <section className="space-y-6">
      <div className="glass-panel p-7 sm:p-10">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-end">
          <div>
            <p className="section-kicker">fleet operations</p>
            <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Центр управления страницами</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
              Поиск, дублирование, копирование ссылок и быстрый переход к редактору собраны в одном рабочем отсеке.
            </p>
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Найти страницу</span>
              <input
                className="soft-input"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Заголовок, slug или фрагмент..."
                value={searchQuery}
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <Link className="primary-button flex-1" to="/admin/pages/new">
                Создать запись
              </Link>
              <Link className="secondary-button flex-1" to="/">
                Открыть портал
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="data-card">
          <p className="section-kicker">объём</p>
          <p className="mt-4 text-4xl font-semibold text-white">{pages.length}</p>
          <p className="mt-2 text-sm text-slate-400">всего страниц</p>
        </div>
        <div className="data-card">
          <p className="section-kicker">сегодня</p>
          <p className="mt-4 text-4xl font-semibold text-white">{updatedTodayCount}</p>
          <p className="mt-2 text-sm text-slate-400">обновлений за день</p>
        </div>
        <div className="data-card">
          <p className="section-kicker">последняя активность</p>
          <p className="mt-4 text-lg font-semibold text-white">{lastUpdatedPage ? lastUpdatedPage.title : 'Пока пусто'}</p>
          <p className="mt-2 text-sm text-slate-400">
            {lastUpdatedPage ? formatDate(lastUpdatedPage.updated_at) : 'Создайте первую запись'}
          </p>
        </div>
      </div>

      {notice ? (
        <div className="rounded-[20px] border border-emerald-400/24 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {notice}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-[20px] border border-rose-400/24 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <section className="glass-panel p-7 sm:p-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">registry cards</p>
            <h3 className="mt-3 text-3xl font-semibold text-white">Карточки страниц</h3>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <span>Показано {filteredPages.length}</span>
            {syncing ? <span className="chip">sync</span> : null}
          </div>
        </div>

        {loading ? (
          <div className="mt-8 rounded-[26px] border border-dashed border-cyan-300/16 px-6 py-12 text-center text-slate-400">
            Загружаю рабочие карточки...
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="mt-8 rounded-[26px] border border-dashed border-cyan-300/16 px-6 py-12 text-center text-slate-400">
            {pages.length === 0 ? 'В базе пока нет страниц.' : 'Ничего не найдено. Попробуйте другой запрос.'}
          </div>
        ) : (
          <div className="mt-8 grid gap-4 xl:grid-cols-2">
            {filteredPages.map((page) => (
              <article
                className="data-card transition hover:-translate-y-1 hover:border-cyan-300/26"
                key={page.id}
                onFocus={() => {
                  void prefetchPage(page.slug);
                }}
                onMouseEnter={() => {
                  void prefetchPage(page.slug);
                }}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="chip">/{page.slug}</span>
                  <span className="text-xs uppercase tracking-[0.24em] text-slate-400">{page.word_count} слов</span>
                </div>

                <div className="mt-5 flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-2xl font-semibold text-white">{page.title}</h4>
                    <p className="mt-2 text-sm text-slate-400">Обновлено {formatDate(page.updated_at)}</p>
                  </div>
                  <Link className="secondary-button px-4 py-2.5" to={`/admin/pages/${page.id}/edit`}>
                    Редактировать
                  </Link>
                </div>

                <p className="mt-5 text-sm leading-7 text-slate-300">
                  {page.excerpt || 'Добавьте содержимое, чтобы здесь появился краткий анонс страницы.'}
                </p>

                <div className="station-divider mt-6" />
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link className="secondary-button px-4 py-2.5" to={`/wiki/${page.slug}`}>
                    Открыть
                  </Link>
                  <button className="secondary-button px-4 py-2.5" onClick={() => handleCopyLink(page)} type="button">
                    Ссылка
                  </button>
                  <button
                    className="secondary-button px-4 py-2.5"
                    disabled={busyActionKey === `duplicate:${page.id}`}
                    onClick={() => handleDuplicate(page)}
                    type="button"
                  >
                    {busyActionKey === `duplicate:${page.id}` ? 'Копирую...' : 'Дублировать'}
                  </button>
                  <button
                    className="danger-button"
                    disabled={busyActionKey === `delete:${page.id}`}
                    onClick={() => handleDelete(page)}
                    type="button"
                  >
                    {busyActionKey === `delete:${page.id}` ? 'Удаляю...' : 'Удалить'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
