import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import '../App.css';
import { useTheme } from '../state/useTheme';
import { useLanguage } from '../language/useLanguage';

type AppLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
};

const navItems = [
  { to: '/home', labelKey: 'nav.dashboard' },
  { to: '/sales', labelKey: 'nav.sales' },
  { to: '/purchases', labelKey: 'nav.purchases' },
  { to: '/inventory', labelKey: 'nav.inventory' },
  { to: '/products', labelKey: 'nav.products' },
  { to: '/movements', labelKey: 'nav.movements' },
  { to: '/customers', labelKey: 'nav.customers' },
  { to: '/suppliers', labelKey: 'nav.suppliers' },
  { to: '/alerts', labelKey: 'nav.alerts' },
  { to: '/reports', labelKey: 'nav.reports' },
];

function AppLayout({ title, description, children }: AppLayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

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

          <div className="role-list" aria-label={t('layout.systemRoles')}>
            <span>{t('layout.roleAdmin')}</span>
            <span>{t('layout.roleStock')}</span>
            <span>{t('layout.roleView')}</span>
          </div>
        </div>

        <nav className="side-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <strong>Pinval</strong>
          <span>{t('layout.sidebarFooter')}</span>
        </div>
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
              <strong>{t('layout.contextTitle')}</strong>
              <p>{t('layout.contextDescription')}</p>
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
