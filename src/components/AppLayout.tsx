import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import '../App.css';
import { getSession } from '../api/authApi';
import { useTheme } from '../state/useTheme';
import { useLanguage } from '../language/useLanguage';

type AppLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
};

const navGroups = [
  {
    labelKey: 'nav.group.operation',
    items: [
      { to: '/home', labelKey: 'nav.dashboard', viewer: true },
      { to: '/sales', labelKey: 'nav.sales', viewer: true },
      { to: '/purchases', labelKey: 'nav.purchases', viewer: true },
      { to: '/inventory', labelKey: 'nav.inventory', viewer: true },
    ],
  },
  {
    labelKey: 'nav.group.management',
    items: [
      { to: '/products', labelKey: 'nav.products', viewer: true },
      { to: '/customers', labelKey: 'nav.customers', viewer: true },
      { to: '/suppliers', labelKey: 'nav.suppliers', viewer: true },
    ],
  },
  {
    labelKey: 'nav.group.control',
    items: [
      { to: '/movements', labelKey: 'nav.movements', viewer: true },
      { to: '/alerts', labelKey: 'nav.alerts', viewer: true },
      { to: '/reports', labelKey: 'nav.reports', viewer: true },
    ],
  },
];

function AppLayout({ title, description, children }: AppLayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const session = getSession();
  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label={t('layout.mainNavigation')}>
        <div className="sidebar-top">
          <div className="brand">
            <span className="brand-mark">PV</span>
            <div className="brand-copy">
              <p className="brand-tag">Pinval</p>
              <strong>{t('layout.brandTitle')}</strong>
              <span>{t('layout.brandSubtitle')}</span>
            </div>
          </div>

          <p className="sidebar-caption">{t('layout.sidebarCaption')}</p>
        </div>

        <nav className="side-nav">
          {navGroups.map((group) => (
            <div className="side-nav-group" key={group.labelKey}>
              <span className="side-nav-heading">{t(group.labelKey)}</span>
              {group.items
                .filter((item) => session?.user.role !== 'VIEWER' || item.viewer)
                .map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => (isActive ? 'active' : undefined)}
                  >
                    {t(item.labelKey)}
                  </NavLink>
                ))}
            </div>
          ))}
        </nav>

      </aside>

      <main className="content">
        <header className="page-header">
          <div className="page-title-group">
            <p className="eyebrow">{t('layout.eyebrow')}</p>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <div className="page-header-actions">
            <div className="page-context-card" aria-label={t('layout.pinvalContext')}>
              <span className="page-context-tag">Pinval</span>
              <strong>{session?.user.name ?? t('layout.contextTitle')}</strong>
              <p>
                {session
                  ? `${t('layout.activeRole')}: ${session.user.role}`
                  : t('layout.contextDescription')}
              </p>
            </div>
            <div className="language-toggle" aria-label={t('layout.languageLabel')}>
              <button
                type="button"
                className={`language-toggle-button ${language === 'es' ? 'active' : ''}`}
                onClick={() => setLanguage('es')}
              >
                {t('language.es')}
              </button>
              <button
                type="button"
                className={`language-toggle-button ${language === 'en' ? 'active' : ''}`}
                onClick={() => setLanguage('en')}
              >
                {t('language.en')}
              </button>
            </div>
            <button
              type="button"
              className="theme-toggle-button"
              onClick={toggleTheme}
              aria-label={
                theme === 'dark'
                  ? t('layout.changeToLight')
                  : t('layout.changeToDark')
              }
            >
              {theme === 'dark' ? t('layout.themeLight') : t('layout.themeDark')}
            </button>
            <NavLink to="/login" className="secondary-action">
              {t('layout.changeUser')}
            </NavLink>
          </div>
        </header>

        <section className="page-body">{children}</section>
      </main>
    </div>
  );
}

export default AppLayout;
