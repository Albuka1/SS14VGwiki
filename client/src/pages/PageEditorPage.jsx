import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import RichTextEditor from '../components/RichTextEditor';
import { apiRequest } from '../utils/api';
import { clearAuthToken, getAuthToken } from '../utils/auth';
import { formatDate } from '../utils/formatDate';
import { createSlug } from '../utils/slugify';
import { fetchPageById, getCachedPageById, updateCacheWithPage } from '../utils/wikiCache';

const EMPTY_FORM = {
  title: '',
  slug: '',
  content: ''
};

function stripHtml(content) {
  return String(content ?? '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countWords(content) {
  const plainTextContent = stripHtml(content);
  return plainTextContent ? plainTextContent.split(/\s+/).length : 0;
}

function normalizeForm(value) {
  return {
    title: String(value?.title ?? ''),
    slug: String(value?.slug ?? ''),
    content: String(value?.content ?? '')
  };
}

function createSnapshot(form) {
  const normalizedForm = normalizeForm(form);

  return JSON.stringify({
    title: normalizedForm.title.trim(),
    slug: normalizedForm.slug.trim(),
    content: normalizedForm.content
  });
}

function toFormFromPage(page) {
  return normalizeForm({
    title: page.title,
    slug: page.slug,
    content: page.content
  });
}

function getDraftStorageKey(id) {
  return id ? `wiki-draft:${id}` : 'wiki-draft:new';
}

function readDraft(storageKey) {
  try {
    const rawValue = window.localStorage.getItem(storageKey);

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue);

    return {
      form: normalizeForm(parsedValue.form),
      savedAt: parsedValue.savedAt || new Date().toISOString()
    };
  } catch {
    return null;
  }
}

function persistDraft(storageKey, form) {
  const savedAt = new Date().toISOString();
  window.localStorage.setItem(
    storageKey,
    JSON.stringify({
      form: normalizeForm(form),
      savedAt
    })
  );
  return savedAt;
}

function clearDraft(storageKey) {
  window.localStorage.removeItem(storageKey);
}

function hasMeaningfulDraft(form) {
  const normalizedForm = normalizeForm(form);
  return Boolean(normalizedForm.title.trim() || normalizedForm.slug.trim() || stripHtml(normalizedForm.content));
}

export default function PageEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const formRef = useRef(null);
  const isEditing = Boolean(id);
  const cachedPage = isEditing ? getCachedPageById(id) : null;
  const initialForm = cachedPage ? toFormFromPage(cachedPage) : EMPTY_FORM;
  const draftStorageKey = getDraftStorageKey(isEditing ? id : null);

  const [form, setForm] = useState(initialForm);
  const [initialSnapshot, setInitialSnapshot] = useState(() => createSnapshot(initialForm));
  const [loading, setLoading] = useState(isEditing && !cachedPage);
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(() => Boolean(initialForm.slug));
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const [remoteUpdatedAt, setRemoteUpdatedAt] = useState(cachedPage?.updated_at ?? null);

  const isDirty = createSnapshot(form) !== initialSnapshot;
  const wordCount = countWords(form.content);
  const publicUrl = form.slug ? `/wiki/${form.slug}` : '/';

  useEffect(() => {
    let isMounted = true;
    const draft = readDraft(draftStorageKey);
    const canRestoreDraft = Boolean(draft?.form && hasMeaningfulDraft(draft.form));

    async function bootstrapPage() {
      setError('');
      setNotice('');
      setNotFound(false);

      if (!isEditing) {
        const nextForm = canRestoreDraft ? draft.form : EMPTY_FORM;
        setForm(nextForm);
        setSlugTouched(Boolean(nextForm.slug));
        setInitialSnapshot(createSnapshot(EMPTY_FORM));
        setDraftSavedAt(canRestoreDraft ? draft.savedAt : null);
        setRemoteUpdatedAt(null);
        setLoading(false);

        if (canRestoreDraft) {
          setNotice(`Черновик восстановлен: ${formatDate(draft.savedAt)}`);
        }

        return;
      }

      const optimisticPage = getCachedPageById(id);
      const optimisticForm = optimisticPage ? toFormFromPage(optimisticPage) : EMPTY_FORM;
      const optimisticValue = canRestoreDraft ? draft.form : optimisticForm;

      if (optimisticPage || canRestoreDraft) {
        setForm(optimisticValue);
        setSlugTouched(Boolean(optimisticValue.slug));
        setRemoteUpdatedAt(optimisticPage?.updated_at ?? null);

        if (canRestoreDraft) {
          setDraftSavedAt(draft.savedAt);
          setNotice(`Черновик восстановлен: ${formatDate(draft.savedAt)}`);
        }
      }

      setLoading(!optimisticPage);

      try {
        const page = await fetchPageById(id, {
          token: getAuthToken()
        });

        if (!isMounted) {
          return;
        }

        const serverForm = toFormFromPage(page);
        setRemoteUpdatedAt(page.updated_at);

        if (canRestoreDraft) {
          setForm(draft.form);
          setSlugTouched(Boolean(draft.form.slug));
          setInitialSnapshot(createSnapshot(serverForm));
          setDraftSavedAt(draft.savedAt);
        } else {
          setForm(serverForm);
          setSlugTouched(Boolean(page.slug));
          setInitialSnapshot(createSnapshot(serverForm));
          setDraftSavedAt(null);
        }
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        if (requestError.status === 401) {
          clearAuthToken();
          navigate('/login', { replace: true });
          return;
        }

        if (requestError.status === 404) {
          setNotFound(true);
        } else {
          setError(requestError.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void bootstrapPage();

    return () => {
      isMounted = false;
    };
  }, [draftStorageKey, id, isEditing, navigate]);

  useEffect(() => {
    if (loading) {
      return undefined;
    }

    if (!isDirty) {
      clearDraft(draftStorageKey);
      setDraftSavedAt(null);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      const savedAt = persistDraft(draftStorageKey, form);
      setDraftSavedAt(savedAt);
    }, 700);

    return () => {
      window.clearTimeout(timer);
    };
  }, [draftStorageKey, form, isDirty, loading]);

  useEffect(() => {
    function handleBeforeUnload(event) {
      if (!isDirty) {
        return;
      }

      event.preventDefault();
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  useEffect(() => {
    function handleKeyDown(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        formRef.current?.requestSubmit();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  function updateField(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  function handleTitleChange(value) {
    setForm((currentForm) => ({
      ...currentForm,
      title: value,
      slug: slugTouched ? currentForm.slug : createSlug(value)
    }));
  }

  function handleSlugChange(value) {
    setSlugTouched(true);
    updateField('slug', createSlug(value));
  }

  function regenerateSlug() {
    const generatedSlug = createSlug(form.title || 'page');
    setSlugTouched(false);
    updateField('slug', generatedSlug);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    const normalizedPayload = {
      title: form.title.trim(),
      slug: createSlug(form.slug || form.title),
      content: form.content
    };

    try {
      const previousSlug = isEditing ? getCachedPageById(id)?.slug || form.slug : undefined;
      const savedPage = await apiRequest(isEditing ? `/api/pages/${id}` : '/api/pages', {
        method: isEditing ? 'PUT' : 'POST',
        body: normalizedPayload,
        token: getAuthToken()
      });

      updateCacheWithPage(savedPage, {
        previousSlug
      });

      clearDraft(draftStorageKey);
      setDraftSavedAt(null);

      const savedForm = toFormFromPage(savedPage);
      setForm(savedForm);
      setSlugTouched(Boolean(savedForm.slug));
      setInitialSnapshot(createSnapshot(savedForm));
      setRemoteUpdatedAt(savedPage.updated_at);
      setNotice(isEditing ? 'Изменения сохранены.' : 'Страница создана.');

      navigate(`/admin/pages/${savedPage.id}/edit`, { replace: true });
    } catch (requestError) {
      if (requestError.status === 401) {
        clearAuthToken();
        navigate('/login', { replace: true });
        return;
      }

      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="glass-panel px-6 py-16 text-center text-slate-400">Подключаю редакторский модуль...</div>;
  }

  if (notFound) {
    return (
      <div className="glass-panel px-6 py-16 text-center">
        <span className="chip">404</span>
        <h2 className="display-title mt-6 text-5xl text-white">Страница не найдена</h2>
        <Link className="secondary-button mt-8" to="/admin">
          Вернуться в командный центр
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="glass-panel p-7 sm:p-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-kicker">{isEditing ? 'edit node' : 'create node'}</p>
            <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
              {isEditing ? 'Редактирование записи' : 'Создание новой записи'}
            </h2>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link className="secondary-button" to="/admin">
              К карточкам
            </Link>
            <Link className="primary-button" rel="noreferrer" target="_blank" to={publicUrl}>
              Публичный просмотр
            </Link>
          </div>
        </div>

        {notice ? (
          <div className="mt-6 rounded-[20px] border border-emerald-400/24 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {notice}
          </div>
        ) : null}
        {error ? (
          <div className="mt-6 rounded-[20px] border border-rose-400/24 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} ref={formRef}>
          <div className="grid gap-5 lg:grid-cols-[1fr_0.92fr]">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="title">
                Заголовок
              </label>
              <input
                className="soft-input"
                id="title"
                onChange={(event) => handleTitleChange(event.target.value)}
                placeholder="Например, правила станции"
                value={form.title}
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-sm font-medium text-slate-300" htmlFor="slug">
                  Slug
                </label>
                <button className="text-sm font-medium text-cyan-200 transition hover:text-cyan-100" onClick={regenerateSlug} type="button">
                  Перегенерировать
                </button>
              </div>
              <input
                className="soft-input"
                id="slug"
                onChange={(event) => handleSlugChange(event.target.value)}
                placeholder="pravila-stantsii"
                value={form.slug}
              />
              <p className="mt-2 text-xs text-slate-400">Публичный маршрут: /wiki/{form.slug || createSlug(form.title || 'page')}</p>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Содержимое</label>
            <RichTextEditor onChange={(value) => updateField('content', value)} value={form.content} />
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="primary-button" disabled={saving} type="submit">
              {saving ? 'Сохраняю...' : isEditing ? 'Сохранить изменения' : 'Создать страницу'}
            </button>
            <Link className="secondary-button" rel="noreferrer" target="_blank" to={publicUrl}>
              Открыть в новой вкладке
            </Link>
          </div>
        </form>
      </section>

      <aside className="space-y-6">
        <div className="data-card">
          <p className="section-kicker">status</p>
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-lg font-semibold text-white">{isDirty ? 'Есть несохранённые изменения' : 'Все изменения синхронизированы'}</p>
              <p className="mt-2 text-sm leading-7 text-slate-400">`Ctrl/Cmd + S` сохраняет запись без клика по кнопке.</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">Авточерновик</p>
              <p className="mt-1 text-sm text-slate-400">{draftSavedAt ? formatDate(draftSavedAt) : 'Пока не создавался'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">Последняя публикация</p>
              <p className="mt-1 text-sm text-slate-400">{remoteUpdatedAt ? formatDate(remoteUpdatedAt) : 'Ещё не публиковалась'}</p>
            </div>
          </div>
        </div>

        <div className="data-card">
          <p className="section-kicker">metrics</p>
          <div className="mt-5 grid gap-4">
            <div>
              <p className="text-4xl font-semibold text-white">{wordCount}</p>
              <p className="mt-2 text-sm text-slate-400">слов в документе</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">Публичный адрес</p>
              <p className="mt-1 break-words text-sm text-slate-400">{window.location.origin}{publicUrl}</p>
            </div>
          </div>
        </div>

        <div className="data-card">
          <p className="section-kicker">fast actions</p>
          <div className="mt-5 flex flex-col gap-3">
            <Link className="secondary-button" rel="noreferrer" target="_blank" to={publicUrl}>
              Открыть страницу
            </Link>
            <Link className="secondary-button" to="/admin">
              Вернуться к списку
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
