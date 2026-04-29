import { Link } from 'react-router-dom';
import '../App.css';
import { useTheme } from '../state/useTheme';
import { useLanguage } from '../language/useLanguage';

function Login() {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="login-page">
      <section className="login-panel" aria-labelledby="login-title">
        <div>
          <p className="eyebrow">{t('login.eyebrow')}</p>
          <h1 id="login-title">{t('login.title')}</h1>
          <p>{t('login.description')}</p>
        </div>

        <div className="language-toggle login-language-toggle">
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
          className="ghost-button theme-toggle-button login-theme-toggle"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? t('layout.themeLight') : t('layout.themeDark')}
        </button>

        <form className="form" onSubmit={(event) => event.preventDefault()}>
          <label htmlFor="email">{t('login.user')}</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder={t('login.userPlaceholder')}
            autoComplete="username"
            required
          />

          <label htmlFor="password">{t('login.password')}</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder={t('login.passwordPlaceholder')}
            autoComplete="current-password"
            required
          />

          <label htmlFor="role">{t('login.role')}</label>
          <select id="role" name="role" defaultValue="admin">
            <option value="admin">{t('layout.roleAdmin')}</option>
            <option value="stock">{t('layout.roleStock')}</option>
            <option value="consulta">{t('layout.roleView')}</option>
          </select>

          <button type="submit">{t('login.submit')}</button>
        </form>

        <div className="login-links">
          <Link to="/home">{t('login.enterSystem')}</Link>
          <a href="#recuperar">{t('login.recoverPassword')}</a>
        </div>
      </section>
    </div>
  );
}

export default Login;
