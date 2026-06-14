import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import '../App.css';
import { getSession } from '../api/authApi';
import { fetchSidebarSummary, type SidebarSummary } from '../api/sidebarApi';
import { useTheme } from '../state/useTheme';
import { useLanguage } from '../language/useLanguage';

type AppLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
};

const SEEN_MOVEMENTS_STORAGE_KEY = 'sicd-seen-movements-count';

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

function formatBadgeCount(value: number) {
  return value > 99 ? '99+' : String(value);
}

function getSidebarIcon(to: string) {
  switch (to) {
    case '/':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-svg-icon">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      );
    case '/home':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-svg-icon">
          <rect x="3" y="3" width="7" height="9"></rect>
          <rect x="14" y="3" width="7" height="5"></rect>
          <rect x="14" y="12" width="7" height="9"></rect>
          <rect x="3" y="16" width="7" height="5"></rect>
        </svg>
      );
    case '/sales':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-svg-icon">
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      );
    case '/purchases':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-svg-icon">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
      );
    case '/inventory':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-svg-icon">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
      );
    case '/products':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-svg-icon">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
          <line x1="7" y1="7" x2="7.01" y2="7"></line>
        </svg>
      );
    case '/customers':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-svg-icon">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      );
    case '/suppliers':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-svg-icon">
          <rect x="1" y="3" width="15" height="13"></rect>
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
          <circle cx="5.5" cy="18.5" r="2.5"></circle>
          <circle cx="18.5" cy="18.5" r="2.5"></circle>
        </svg>
      );
    case '/movements':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-svg-icon">
          <polyline points="17 1 21 5 17 9"></polyline>
          <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
          <polyline points="7 23 3 19 7 15"></polyline>
          <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
        </svg>
      );
    case '/alerts':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-svg-icon">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      );
    case '/reports':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-svg-icon">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
      );
    default:
      return null;
  }
}

function AppLayout({ title, description, children }: AppLayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const session = getSession();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  const [sidebarSummary, setSidebarSummary] = useState<SidebarSummary | null>(null);

  const [seenMovementsCount, setSeenMovementsCount] = useState(() => {
    const savedValue = Number(localStorage.getItem(SEEN_MOVEMENTS_STORAGE_KEY) ?? 0);
    return Number.isFinite(savedValue) ? savedValue : 0;
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState(() => {
    return localStorage.getItem('sicd-user-avatar') || '';
  });

  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const [emailNotif, setEmailNotif] = useState(() => {
    return localStorage.getItem('sicd-settings-email') !== 'false';
  });

  const [smsNotif, setSmsNotif] = useState(() => {
    return localStorage.getItem('sicd-settings-sms') !== 'false';
  });

  const [twoFactor, setTwoFactor] = useState(() => {
    return localStorage.getItem('sicd-settings-2fa') === 'true';
  });

  const totalMovements = sidebarSummary?.totalMovements ?? 0;
  const activeAlerts = sidebarSummary?.activeAlerts ?? 0;
  const newMovementsCount = Math.max(totalMovements - seenMovementsCount, 0);

  useEffect(() => {
    let isActive = true;

    async function loadSidebarSummary() {
      try {
        const summary = await fetchSidebarSummary();

        if (!isActive) {
          return;
        }

        setSidebarSummary(summary);
      } catch {
        if (!isActive) {
          return;
        }

        setSidebarSummary(null);
      }
    }

    void loadSidebarSummary();

    const intervalId = window.setInterval(() => {
      void loadSidebarSummary();
    }, 3000);

    const handleWindowFocus = () => {
      void loadSidebarSummary();
    };

    window.addEventListener('focus', handleWindowFocus);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  useEffect(() => {
    if (location.pathname !== '/movements') {
      return;
    }

    localStorage.setItem(SEEN_MOVEMENTS_STORAGE_KEY, String(totalMovements));
    setSeenMovementsCount(totalMovements);
  }, [location.pathname, totalMovements]);

  const handleLogout = () => {
    window.localStorage.removeItem('sicd-auth-session');
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const newValue = !prev;
      localStorage.setItem('sidebar-collapsed', String(newValue));
      return newValue;
    });
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      const base64Data = reader.result as string;
      setAvatarUrl(base64Data);
      localStorage.setItem('sicd-user-avatar', base64Data);
    };

    reader.readAsDataURL(file);
  };

  const saveSettings = (event: FormEvent) => {
    event.preventDefault();
    localStorage.setItem('sicd-settings-email', String(emailNotif));
    localStorage.setItem('sicd-settings-sms', String(smsNotif));
    localStorage.setItem('sicd-settings-2fa', String(twoFactor));
    setShowSettingsModal(false);
  };

  function getBadgeCount(path: string) {
    if (path === '/movements') {
      return newMovementsCount;
    }

    if (path === '/alerts') {
      return activeAlerts;
    }

    return 0;
  }

  function getBadgeTone(path: string) {
    if (path === '/alerts') {
      return 'danger';
    }

    return '';
  }

  return (
    <div className={`app-shell ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="sidebar" aria-label={t('layout.mainNavigation')}>
        <div className="sidebar-top">
          <div className="brand">
            <span className="brand-mark">PV</span>
            <div className="brand-copy">
              <p className="brand-tag">Pinval</p>
              <strong>{t('layout.brandTitle')}</strong>
              <span>{t('layout.brandSubtitle')}</span>
            </div>
            <button
              type="button"
              className="sidebar-close-btn"
              onClick={toggleSidebar}
              aria-label={t('layout.closeSidebar') || 'Cerrar barra lateral'}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <p className="sidebar-caption">{t('layout.sidebarCaption')}</p>
        </div>

        <nav className="side-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `side-nav-home ${isActive ? 'active' : ''}`}
          >
            {getSidebarIcon('/')}
            <span className="side-nav-label">{t('nav.landing')}</span>
          </NavLink>

          {navGroups.map((group) => (
            <div className="side-nav-group" key={group.labelKey}>
              <span className="side-nav-heading">{t(group.labelKey)}</span>

              {group.items
                .filter((item) => session?.user.role !== 'VIEWER' || item.viewer)
                .map((item) => {
                  const badgeCount = getBadgeCount(item.to);
                  const badgeTone = getBadgeTone(item.to);

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) => (isActive ? 'active' : undefined)}
                    >
                      {getSidebarIcon(item.to)}
                      <span className="side-nav-label">{t(item.labelKey)}</span>

                      {badgeCount > 0 ? (
                        <span className={`side-nav-badge ${badgeTone}`}>
                          {formatBadgeCount(badgeCount)}
                        </span>
                      ) : null}
                    </NavLink>
                  );
                })}
            </div>
          ))}
        </nav>
      </aside>

      <main className="content">
        <header className="page-header">
          <button
            type="button"
            className="sidebar-toggle"
            onClick={toggleSidebar}
            aria-label={isCollapsed ? 'Abrir barra lateral' : 'Cerrar barra lateral'}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

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

            <div className="profile-avatar-container">
              <button
                type="button"
                className="profile-avatar-trigger"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-label="Abrir perfil"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="profile-avatar-img" />
                ) : (
                  <div className="profile-avatar-placeholder">
                    {session?.user.name
                      ? session.user.name.charAt(0).toUpperCase()
                      : 'U'}
                  </div>
                )}

                <span className="profile-avatar-badge"></span>
              </button>

              {isDropdownOpen ? (
                <>
                  <div
                    className="dropdown-overlay-detector"
                    onClick={() => setIsDropdownOpen(false)}
                  ></div>

                  <div className="avatar-dropdown-menu">
                    <div className="dropdown-user-info">
                      <div className="dropdown-user-avatar-wrapper">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="Avatar Large"
                            className="dropdown-user-avatar-img"
                          />
                        ) : (
                          <div className="dropdown-user-avatar-placeholder">
                            {session?.user.name
                              ? session.user.name.charAt(0).toUpperCase()
                              : 'U'}
                          </div>
                        )}

                        <label
                          className="change-avatar-label"
                          htmlFor="avatar-file-input"
                          title="Cambiar foto de perfil"
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                            <circle cx="12" cy="13" r="4"></circle>
                          </svg>

                          <input
                            id="avatar-file-input"
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            style={{ display: 'none' }}
                          />
                        </label>
                      </div>

                      <div className="dropdown-user-copy">
                        <strong>{session?.user.name ?? t('layout.contextTitle')}</strong>
                        <span className="dropdown-username">
                          @{session?.user.username ?? 'user'}
                        </span>
                        <span className="role-badge-v2">
                          {session?.user.role ?? 'VIEWER'}
                        </span>
                      </div>
                    </div>

                    <div className="dropdown-divider"></div>

                    <div className="dropdown-options">
                      <button
                        type="button"
                        className="dropdown-item"
                        onClick={() => {
                          setShowSettingsModal(true);
                          setIsDropdownOpen(false);
                        }}
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="3"></circle>
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>

                        <span>
                          {language === 'es'
                            ? 'Configuración de cuenta'
                            : 'Account Settings'}
                        </span>
                      </button>

                      <NavLink to="/login" className="dropdown-item">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>

                        <span>{t('layout.changeUser')}</span>
                      </NavLink>

                      <div className="dropdown-divider"></div>

                      <button
                        type="button"
                        className="dropdown-item logout-btn-item"
                        onClick={handleLogout}
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                          <polyline points="16 17 21 12 16 7"></polyline>
                          <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>

                        <span>{t('layout.logout')}</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </header>

        <section className="page-body">{children}</section>
      </main>

      {showSettingsModal ? (
        <div className="modal-backdrop-v2" onClick={() => setShowSettingsModal(false)}>
          <div className="modal-content-v2" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header-v2">
              <h2>
                {language === 'es'
                  ? 'Configuración de la Cuenta'
                  : 'Account Settings'}
              </h2>

              <button
                type="button"
                className="close-modal-btn-v2"
                onClick={() => setShowSettingsModal(false)}
                aria-label="Cerrar modal"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <form onSubmit={saveSettings} className="settings-form-v2">
              <div
                className="settings-section-v2"
                style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
              >
                <h3
                  style={{
                    fontSize: '15px',
                    color: theme === 'dark' ? '#cbd5e1' : '#334155',
                  }}
                >
                  {language === 'es'
                    ? 'Preferencias del Sistema'
                    : 'System Preferences'}
                </h3>

                <div className="form-group-v2">
                  <label className="checkbox-container-v2">
                    <input
                      type="checkbox"
                      checked={emailNotif}
                      onChange={(event) => setEmailNotif(event.target.checked)}
                    />
                    <span className="checkbox-checkmark-v2"></span>
                    <span className="checkbox-label-v2">
                      {language === 'es'
                        ? 'Notificaciones por Correo'
                        : 'Email Notifications'}
                    </span>
                  </label>
                </div>

                <div className="form-group-v2">
                  <label className="checkbox-container-v2">
                    <input
                      type="checkbox"
                      checked={smsNotif}
                      onChange={(event) => setSmsNotif(event.target.checked)}
                    />
                    <span className="checkbox-checkmark-v2"></span>
                    <span className="checkbox-label-v2">
                      {language === 'es'
                        ? 'Alertas SMS de inventario bajo'
                        : 'SMS alerts for low stock'}
                    </span>
                  </label>
                </div>

                <div className="form-group-v2">
                  <label className="checkbox-container-v2">
                    <input
                      type="checkbox"
                      checked={twoFactor}
                      onChange={(event) => setTwoFactor(event.target.checked)}
                    />
                    <span className="checkbox-checkmark-v2"></span>
                    <span className="checkbox-label-v2">
                      {language === 'es'
                        ? 'Doble factor de autenticación (2FA)'
                        : 'Two-Factor Authentication (2FA)'}
                    </span>
                  </label>
                </div>
              </div>

              <div className="modal-footer-v2">
                <button
                  type="button"
                  className="secondary-btn-v2"
                  onClick={() => setShowSettingsModal(false)}
                >
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </button>

                <button type="submit" className="submit-btn-v2" style={{ width: 'auto' }}>
                  {language === 'es' ? 'Guardar Cambios' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default AppLayout;