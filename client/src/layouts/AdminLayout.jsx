import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { clearAuthToken } from '../utils/auth';

function LogoutIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M15.75 7.25V5.75A2.5 2.5 0 0 0 13.25 3.25H6.75a2.5 2.5 0 0 0-2.5 2.5v12.5a2.5 2.5 0 0 0 2.5 2.5h6.5a2.5 2.5 0 0 0 2.5-2.5v-1.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path d="M10.5 12h9m0 0-3-3m3 3-3 3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
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

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    clearAuthToken();
    navigate('/', { replace: true });
  }

  const isDashboard = location.pathname === '/admin';
  const isEditor = location.pathname.includes('/admin/pages/');

  return (
    <div className="shell py-5 sm:py-8">
      <div className="glass-panel px-5 py-5 sm:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="section-kicker">command deck</p>
            <h1 className="display-title mt-2 text-4xl text-white sm:text-5xl">Административный мостик</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Редактирование страниц, контроль архива и быстрые действия собраны в одном космическом workspace.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <nav className="flex flex-wrap items-center gap-2">
              <StationTab active={isDashboard} to="/admin">
                Центр
              </StationTab>
              <StationTab active={isEditor} to="/admin/pages/new">
                Редактор
              </StationTab>
            </nav>

            <div className="flex flex-wrap gap-3">
              <Link className="secondary-button" to="/">
                Публичный сектор
              </Link>
              <Link className="primary-button" to="/admin/pages/new">
                Новая запись
              </Link>
              <button className="secondary-button gap-2" onClick={handleLogout} type="button">
                <LogoutIcon />
                Выход
              </button>
            </div>
          </div>
        </div>

        <div className="station-divider mt-5" />
      </div>

      <div className="pt-8">
        <Outlet />
      </div>
    </div>
  );
}
