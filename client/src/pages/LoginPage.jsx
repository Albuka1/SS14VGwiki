import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { apiRequest } from '../utils/api';
import { getAuthToken, setAuthToken } from '../utils/auth';

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const redirectTo = new URLSearchParams(location.search).get('redirect') || '/admin';
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('change-me');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (getAuthToken()) {
    return <Navigate replace to="/admin" />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: {
          username,
          password
        }
      });

      setAuthToken(response.token);
      navigate(redirectTo, { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="glass-panel p-7 sm:p-10">
          <span className="chip">restricted terminal</span>
          <p className="section-kicker mt-6">admin authorization node</p>
          <h2 className="display-title mt-4 text-5xl leading-[0.94] text-white sm:text-6xl">Вход в командный мостик</h2>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300">
            Здесь начинается рабочая зона редакторов: управление страницами, быстрые карточки, черновики и
            модуль обновления знаний сервера.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="data-card p-5">
              <p className="section-kicker">jwt</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">Сессия защищена токеном и закрывает приватные маршруты.</p>
            </div>
            <div className="data-card p-5">
              <p className="section-kicker">drafts</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">Редактор хранит черновики и быстро восстанавливается после возврата.</p>
            </div>
            <div className="data-card p-5">
              <p className="section-kicker">cache</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">Карточки и статьи открываются мгновеннее за счёт prefetch и кэша.</p>
            </div>
          </div>
        </section>

        <section className="glass-panel p-7 sm:p-10">
          <span className="chip">terminal access</span>
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="username">
                Логин
              </label>
              <input
                className="soft-input"
                id="username"
                onChange={(event) => setUsername(event.target.value)}
                placeholder="admin"
                value={username}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="password">
                Пароль
              </label>
              <input
                className="soft-input"
                id="password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="change-me"
                type="password"
                value={password}
              />
            </div>

            {error ? (
              <div className="rounded-[20px] border border-rose-400/24 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            <button className="primary-button w-full" disabled={submitting} type="submit">
              {submitting ? 'Подключаю терминал...' : 'Войти в админку'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
