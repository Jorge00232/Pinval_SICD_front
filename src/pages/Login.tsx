import { Link, useNavigate } from 'react-router-dom';
import '../App.css';
import { login, saveSession } from '../api/authApi';
import { useTheme } from '../state/useTheme';
import { useLanguage } from '../language/useLanguage';
import { useState } from 'react';

function Login() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

        <form
          className="form"
          onSubmit={async (event) => {
            event.preventDefault();
            setError('');
            setIsSubmitting(true);

            const formData = new FormData(event.currentTarget);

            try {
              const session = await login({
                username: String(formData.get('username')).trim(),
                password: String(formData.get('password')),
              });

              saveSession(session);
              navigate('/home');
            } catch (loginError) {
              setError(
                loginError instanceof Error
                  ? loginError.message
                  : t('login.loginError'),
              );
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <label htmlFor="username">{t('login.user')}</label>
          <input
            id="username"
            name="username"
            type="text"
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

          <p className="login-help">{t('login.demoUsers')}</p>

          {error ? <p className="form-message error">{error}</p> : null}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('login.submitting') : t('login.submit')}
          </button>
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
