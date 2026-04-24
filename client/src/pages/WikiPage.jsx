import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import PageTabsRail from '../components/PageTabsRail';
import { formatDate } from '../utils/formatDate';
import {
  fetchPageDetail,
  fetchPageSummaries,
  getCachedPageDetail,
  getCachedPageSummaries,
  getCachedPageSummaryBySlug
} from '../utils/wikiCache';

function stripHtml(content) {
  return String(content ?? '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function createExcerpt(content) {
  const plainTextContent = stripHtml(content);
  return plainTextContent.length > 180 ? `${plainTextContent.slice(0, 177).trimEnd()}...` : plainTextContent;
}

function createPageTabRecord(page) {
  const plainTextContent = stripHtml(page.content);
  return {
    id: page.id,
    title: page.title,
    slug: page.slug,
    updated_at: page.updated_at,
    excerpt: createExcerpt(page.content),
    word_count: plainTextContent ? plainTextContent.split(/\s+/).length : 0
  };
}

export default function WikiPage() {
  const { slug } = useParams();
  const cachedDetail = getCachedPageDetail(slug);
  const cachedSummary = getCachedPageSummaryBySlug(slug);
  const [page, setPage] = useState(() => cachedDetail ?? cachedSummary);
  const [railPages, setRailPages] = useState(() => (getCachedPageSummaries() ?? []).slice(0, 7));
  const [loading, setLoading] = useState(() => !cachedDetail);
  const [syncing, setSyncing] = useState(() => Boolean(cachedSummary && !cachedDetail));
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const pageFromCache = getCachedPageDetail(slug);
    const summaryFromCache = getCachedPageSummaryBySlug(slug);

    setPage(pageFromCache ?? summaryFromCache);
    setLoading(!pageFromCache);
    setSyncing(Boolean(summaryFromCache && !pageFromCache));
    setError('');
    setNotFound(false);

    async function loadPage() {
      try {
        const data = await fetchPageDetail(slug);

        if (isMounted) {
          setPage(data);
        }
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        if (requestError.status === 404) {
          setNotFound(true);
          setPage(null);
        } else {
          setError(requestError.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setSyncing(false);
        }
      }
    }

    void loadPage();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  useEffect(() => {
    let isMounted = true;

    async function loadRailPages() {
      try {
        const data = await fetchPageSummaries();

        if (!isMounted) {
          return;
        }

        if (page?.id) {
          const currentRecord = page.content ? createPageTabRecord(page) : null;
          const related = data.filter((item) => item.slug !== slug).slice(0, 6);
          setRailPages(currentRecord ? [currentRecord, ...related] : [data.find((item) => item.slug === slug), ...related].filter(Boolean));
        } else {
          setRailPages(data.slice(0, 7));
        }
      } catch {
        if (!isMounted) {
          return;
        }

        const cachedPages = getCachedPageSummaries() ?? [];

        if (page?.id) {
          const currentRecord = page.content ? createPageTabRecord(page) : cachedPages.find((item) => item.slug === slug);
          const related = cachedPages.filter((item) => item.slug !== slug).slice(0, 6);
          setRailPages([currentRecord, ...related].filter(Boolean));
        } else {
          setRailPages(cachedPages.slice(0, 7));
        }
      }
    }

    void loadRailPages();

    return () => {
      isMounted = false;
    };
  }, [page, slug]);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  if (loading && !page) {
    return <div className="glass-panel px-6 py-16 text-center text-slate-400">Открываю архивную запись...</div>;
  }

  if (error && !page) {
    return (
      <div className="glass-panel px-6 py-16 text-center">
        <p className="text-lg text-rose-200">{error}</p>
        <Link className="secondary-button mt-6" to="/">
          Вернуться к архиву
        </Link>
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="glass-panel px-6 py-16 text-center sm:px-10">
        <span className="chip">404</span>
        <h2 className="display-title mt-6 text-5xl text-white">Запись не найдена</h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-slate-400">
          По адресу `/wiki/{slug}` пока нет материала. Проверьте slug или вернитесь к каталогу.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link className="primary-button" to="/#catalog">
            К архиву
          </Link>
          <Link className="secondary-button" to="/">
            На обзор
          </Link>
        </div>
      </div>
    );
  }

  const plainTextContent = stripHtml(page.content);
  const excerpt = page.excerpt || getCachedPageSummaryBySlug(page.slug)?.excerpt || createExcerpt(page.content);
  const wordCount = page.word_count || (plainTextContent ? plainTextContent.split(/\s+/).length : 0);
  const readingTime = Math.max(1, Math.round(wordCount / 180));

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_310px]">
      <article className="space-y-6">
        <section className="glass-panel p-6 sm:p-7 lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="chip">/{page.slug}</span>
                <span className="chip">{readingTime} мин чтения</span>
                {syncing ? <span className="chip">sync</span> : null}
              </div>
              <p className="section-kicker mt-5">station archive record</p>
              <h2 className="display-title mt-3 text-4xl leading-[0.95] text-white sm:text-6xl">{page.title}</h2>
              {excerpt ? <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">{excerpt}</p> : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="secondary-button" onClick={handleCopyLink} type="button">
                {copied ? 'Ссылка скопирована' : 'Скопировать ссылку'}
              </button>
              <Link className="primary-button" to="/#catalog">
                К архиву
              </Link>
            </div>
          </div>

          <div className="station-divider mt-6" />
          <p className="mt-5 text-sm text-slate-400">Обновлено {formatDate(page.updated_at)}</p>

          {error ? (
            <div className="mt-5 rounded-[20px] border border-rose-400/24 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}
        </section>

        <section className="glass-panel p-6 sm:p-7 lg:p-8">
          {page.content ? (
            <div className="prose-content" dangerouslySetInnerHTML={{ __html: page.content }} />
          ) : (
            <div className="space-y-4">
              <div className="h-5 w-2/3 rounded-full bg-slate-800/90" />
              <div className="h-5 w-full rounded-full bg-slate-800/70" />
              <div className="h-5 w-5/6 rounded-full bg-slate-800/60" />
            </div>
          )}
        </section>
      </article>

      <PageTabsRail activeSlug={page.slug} pages={railPages} title="Другие страницы" />
    </div>
  );
}
