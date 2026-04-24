import { Component } from 'react';
import { Link } from 'react-router-dom';

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

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null
    };
  }

  static getDerivedStateFromError(error) {
    return {
      error
    };
  }

  componentDidCatch(error) {
    console.error('Application render error:', error);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className="shell flex min-h-screen items-center py-12">
        <div className="glass-panel mx-auto w-full max-w-3xl px-6 py-16 text-center sm:px-10">
          <span className="chip">interface recovery</span>
          <p className="section-kicker mt-6">stability fallback</p>
          <h1 className="display-title mt-4 text-6xl text-white">Интерфейс перезапускается</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-400">
            Один из экранов неожиданно сломался. Вместо пустого полотна я показываю безопасный fallback, чтобы
            навигацию можно было быстро восстановить.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button className="primary-button" onClick={this.handleReload} type="button">
              Перезагрузить страницу
            </button>
            <Link className="secondary-button" to="/">
              На главную
            </Link>
            <Link aria-label="Войти в админку" className="icon-button" title="Войти в админку" to="/login">
              <AdminAccessIcon />
            </Link>
          </div>
        </div>
      </div>
    );
  }
}
