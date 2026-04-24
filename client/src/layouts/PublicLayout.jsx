import { Link, Outlet, useLocation } from 'react-router-dom';

import { getAuthToken } from '../utils/auth';

function AdminAccessIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 3.25 5.75 5.7v5.4c0 4.03 2.33 7.78 6.25 9.65 3.92-1.87 6.25-5.62 6.25-9.65V5.7L12 3.25Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path d="M9.5 11.75 11.2 13.5 14.8 9.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function StationTab({ active, children, to }) {
  return (
    <Link className={`nav-tab ${active ? 'nav-tab-active' : ''}`} to={to}>
      {children}
    </Link>
  );
}

export default function PublicLayout() {
  const location = useLocation();
  const isLoggedIn = Boolean(getAuthToken());

  const isOverviewActive = location.pathname === '/' && (!location.hash || location.hash === '#overview');
  const isArchiveActive = location.pathname === '/' && location.hash === '#catalog';

  return (
    <div className="pb-16">
      <header className="shell sticky top-0 z-30 pt-4 sm:pt-6">
        <div className="glass-panel px-5 py-4 sm:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link className="flex items-center gap-4" to="/">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-[22px] border border-cyan-300/18 bg-cyan-400/10 shadow-[0_0_40px_rgba(34,211,238,0.18)]">
                <div className="absolute inset-2 rounded-[16px] border border-cyan-300/16" />
                <div className="absolute h-6 w-6 rounded-full border border-cyan-200/40" />
                <div className="h-2.5 w-2.5 rounded-full bg-cyan-200" />
              </div>

              <div>
                <p className="section-kicker">space station 14 archive</p>
                <h1 className="display-title text-3xl text-white sm:text-4xl">Vanguard Wiki</h1>
                <p className="mt-1 text-sm text-slate-400">Навигационный хаб знаний для сервера и экипажа.</p>
              </div>
            </Link>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <nav className="flex flex-wrap items-center gap-2">
                <StationTab active={isOverviewActive} to="/#overview">
                  Обзор
                </StationTab>
                <StationTab active={isArchiveActive} to="/#catalog">
                  Архив
                </StationTab>
              </nav>

              <div className="flex items-center gap-3">
                <span className="chip">
                  {isLoggedIn ? 'доступ: command deck' : 'доступ: restricted'}
                </span>
                <Link
                  aria-label={isLoggedIn ? 'Открыть админку' : 'Войти в админку'}
                  className="icon-button relative"
                  title={isLoggedIn ? 'Открыть админку' : 'Войти как администратор'}
                  to={isLoggedIn ? '/admin' : '/login'}
                >
                  <AdminAccessIcon />
                  <span
                    className={`absolute right-2 top-2 h-2.5 w-2.5 rounded-full ${
                      isLoggedIn ? 'bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.85)]' : 'bg-amber-300 shadow-[0_0_14px_rgba(252,211,77,0.85)]'
                    }`}
                  />
                </Link>
              </div>
            </div>
          </div>

          <div className="station-divider mt-4" />
        </div>
      </header>

      <main className="shell pt-8 sm:pt-10">
        <Outlet />
      </main>
    </div>
  );
}
