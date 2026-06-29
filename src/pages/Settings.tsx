import { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { useLanguage } from '../language/useLanguage';
import { useTheme } from '../state/useTheme';
import { getSession } from '../api/authApi';

function Settings() {
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const session = getSession();

  // Local state for account settings
  const [emailNotif, setEmailNotif] = useState(() => {
    return localStorage.getItem('sicd-settings-email') !== 'false';
  });
  const [smsNotif, setSmsNotif] = useState(() => {
    return localStorage.getItem('sicd-settings-sms') !== 'false';
  });
  const [twoFactor, setTwoFactor] = useState(() => {
    return localStorage.getItem('sicd-settings-2fa') === 'true';
  });

  // Typography state
  const [fontFamily, setFontFamily] = useState(() => {
    return localStorage.getItem('sicd-font-family') || 'Inter';
  });
  const [fontScale, setFontScale] = useState(() => {
    return parseFloat(localStorage.getItem('sicd-font-scale') || '1.0');
  });

  const [toastMessage, setToastMessage] = useState('');

  // Auto-save account settings to localStorage
  useEffect(() => {
    localStorage.setItem('sicd-settings-email', String(emailNotif));
  }, [emailNotif]);

  useEffect(() => {
    localStorage.setItem('sicd-settings-sms', String(smsNotif));
  }, [smsNotif]);

  useEffect(() => {
    localStorage.setItem('sicd-settings-2fa', String(twoFactor));
  }, [twoFactor]);

  // Apply typography adjustments
  const updateTypography = (font: string, scale: number) => {
    localStorage.setItem('sicd-font-family', font);
    localStorage.setItem('sicd-font-scale', scale.toFixed(2));

    // Dispatch event so AppLayout/global styles hear the change
    window.dispatchEvent(new Event('sicd-settings-updated'));
  };

  const handleFontFamilyChange = (font: string) => {
    setFontFamily(font);
    updateTypography(font, fontScale);
    showToast(language === 'es' ? 'Tipografía actualizada' : 'Typography updated');
  };

  const adjustFontScale = (increment: number) => {
    const nextScale = Math.min(Math.max(fontScale + increment, 0.8), 1.3);
    setFontScale(nextScale);
    updateTypography(fontFamily, nextScale);
    showToast(language === 'es' ? 'Tamaño de letra ajustado' : 'Font size adjusted');
  };

  const resetTypography = () => {
    setFontFamily('Inter');
    setFontScale(1.0);
    updateTypography('Inter', 1.0);
    showToast(language === 'es' ? 'Valores predeterminados restablecidos' : 'Defaults restored');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? '' : prev));
    }, 3000);
  };

  return (
    <AppLayout
      title={language === 'es' ? 'Configuración' : 'Settings'}
      description={language === 'es' ? 'Personaliza tus preferencias del sistema, interfaz y seguridad.' : 'Customize system preferences, interface, and security.'}
    >
      <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', padding: '12px 0' }}>
        
        {/* Toast alert */}
        {toastMessage && (
          <div className="floating-toast success" role="status" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 99999 }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Section 1: Language and Theme */}
        <article className="panel">
          <div className="panel-heading" style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)', paddingBottom: '12px', marginBottom: '16px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {language === 'es' ? 'Idioma y Tema' : 'Language & Theme'}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Language Selection */}
            <div>
              <strong style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-color, #1f2937)' }}>
                {language === 'es' ? 'Idioma del Sitio' : 'Site Language'}
              </strong>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setLanguage('es');
                    showToast('Idioma cambiado a Español');
                  }}
                  className={`secondary-action ${language === 'es' ? 'active' : ''}`}
                  style={{
                    flex: 1,
                    background: language === 'es' ? '#2f80ed' : 'transparent',
                    color: language === 'es' ? '#ffffff' : 'inherit',
                    borderColor: language === 'es' ? '#2f80ed' : 'var(--border-color, #e2e8f0)',
                    fontWeight: 600
                  }}
                >
                  Español (ES)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLanguage('en');
                    showToast('Language changed to English');
                  }}
                  className={`secondary-action ${language === 'en' ? 'active' : ''}`}
                  style={{
                    flex: 1,
                    background: language === 'en' ? '#2f80ed' : 'transparent',
                    color: language === 'en' ? '#ffffff' : 'inherit',
                    borderColor: language === 'en' ? '#2f80ed' : 'var(--border-color, #e2e8f0)',
                    fontWeight: 600
                  }}
                >
                  English (EN)
                </button>
              </div>
            </div>

            {/* Theme Toggle */}
            <div>
              <strong style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-color, #1f2937)' }}>
                {language === 'es' ? 'Apariencia del Sitio' : 'Site Appearance'}
              </strong>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (theme === 'dark') toggleTheme();
                    showToast(language === 'es' ? 'Tema Claro activado' : 'Light theme active');
                  }}
                  className={`secondary-action ${theme === 'light' ? 'active' : ''}`}
                  style={{
                    flex: 1,
                    background: theme === 'light' ? '#2f80ed' : 'transparent',
                    color: theme === 'light' ? '#ffffff' : 'inherit',
                    borderColor: theme === 'light' ? '#2f80ed' : 'var(--border-color, #e2e8f0)',
                    fontWeight: 600
                  }}
                >
                  {language === 'es' ? 'Tema Claro' : 'Light Theme'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (theme === 'light') toggleTheme();
                    showToast(language === 'es' ? 'Tema Oscuro activado' : 'Dark theme active');
                  }}
                  className={`secondary-action ${theme === 'dark' ? 'active' : ''}`}
                  style={{
                    flex: 1,
                    background: theme === 'dark' ? '#2f80ed' : 'transparent',
                    color: theme === 'dark' ? '#ffffff' : 'inherit',
                    borderColor: theme === 'dark' ? '#2f80ed' : 'var(--border-color, #e2e8f0)',
                    fontWeight: 600
                  }}
                >
                  {language === 'es' ? 'Tema Oscuro' : 'Dark Theme'}
                </button>
              </div>
            </div>
          </div>
        </article>

        {/* Section 2: Font Customization */}
        <article className="panel">
          <div className="panel-heading" style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)', paddingBottom: '12px', marginBottom: '16px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {language === 'es' ? 'Tipografía y Accesibilidad' : 'Typography & Font Options'}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Font Family Selection */}
            <div>
              <label htmlFor="font-family-select" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 700, color: 'var(--text-color, #1f2937)' }}>
                {language === 'es' ? 'Tipo de Letra' : 'Font Family'}
              </label>
              <select
                id="font-family-select"
                value={fontFamily}
                onChange={(e) => handleFontFamilyChange(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)', background: 'var(--surface-color, #fff)', color: 'var(--text-color, #1f2937)' }}
              >
                <option value="Inter">Inter (Predeterminado)</option>
                <option value="Outfit">Outfit (Moderna)</option>
                <option value="Roboto">Roboto (Limpia)</option>
                <option value="Montserrat">Montserrat (Estilizada)</option>
                <option value="Georgia">Georgia (Serif Elegante)</option>
                <option value="Courier">Courier New (Monospaciado)</option>
              </select>
            </div>

            {/* Font Size Adjustments */}
            <div>
              <strong style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-color, #1f2937)' }}>
                {language === 'es' ? 'Tamaño de la Letra' : 'Font Size scale'}
              </strong>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => adjustFontScale(-0.05)}
                  disabled={fontScale <= 0.8}
                  className="secondary-action"
                  style={{ flex: 1, padding: '10px', fontSize: '14px', fontWeight: 700 }}
                  title="Achicar letra"
                >
                  A-
                </button>
                <div style={{ flex: 2, textAlign: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                  {(fontScale * 100).toFixed(0)}%
                </div>
                <button
                  type="button"
                  onClick={() => adjustFontScale(0.05)}
                  disabled={fontScale >= 1.3}
                  className="secondary-action"
                  style={{ flex: 1, padding: '10px', fontSize: '14px', fontWeight: 700 }}
                  title="Agrandar letra"
                >
                  A+
                </button>
              </div>

              <button
                type="button"
                onClick={resetTypography}
                className="ghost-button"
                style={{ width: '100%', marginTop: '10px', padding: '8px', textDecoration: 'underline', cursor: 'pointer', background: 'transparent', border: 'none', color: '#64748b' }}
              >
                {language === 'es' ? 'Restablecer valores predeterminados' : 'Reset to default style'}
              </button>
            </div>

            {/* Typography Preview box */}
            <div style={{
              background: 'color-mix(in srgb, var(--surface-color, #fff) 94%, #2f80ed 6%)',
              border: '1px solid var(--border-color, #e2e8f0)',
              borderRadius: '8px',
              padding: '12px',
              marginTop: '4px'
            }}>
              <small style={{ display: 'block', color: '#64748b', fontSize: '10px', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 700 }}>
                {language === 'es' ? 'Vista previa' : 'Typography Preview'}
              </small>
              <p style={{ margin: 0, lineHeight: 1.4, color: 'var(--text-color, #1f2937)' }}>
                {language === 'es' 
                  ? 'El veloz murciélago hindú comía feliz cardillo y kiwi. 1234567890' 
                  : 'The quick brown fox jumps over the lazy dog. 1234567890'}
              </p>
            </div>
          </div>
        </article>

        {/* Section 3: Account & Notifications Settings */}
        <article className="panel" style={{ gridColumn: 'span 1' }}>
          <div className="panel-heading" style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)', paddingBottom: '12px', marginBottom: '16px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {language === 'es' ? 'Seguridad y Cuenta' : 'Security & Account Settings'}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Account Details Box */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--surface-color, #fff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '8px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: '#f7b731',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 'bold',
                fontSize: '18px'
              }}>
                {session?.user.name ? session.user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '14px', color: 'var(--text-color, #1f2937)' }}>
                  {session?.user.name ?? 'Usuario'}
                </strong>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>
                  @{session?.user.username ?? 'user'} · {session?.user.role ?? 'VIEWER'}
                </span>
              </div>
            </div>

            {/* Notifications toggles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <strong style={{ display: 'block', fontSize: '14px', color: 'var(--text-color, #1f2937)' }}>
                {language === 'es' ? 'Preferencias de Alertas' : 'Alert Preferences'}
              </strong>
              
              <label className="checkbox-container-v2" style={{ margin: 0, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={emailNotif}
                  onChange={(e) => {
                    setEmailNotif(e.target.checked);
                    showToast(language === 'es' ? 'Notificaciones guardadas' : 'Notifications saved');
                  }}
                />
                <span className="checkbox-checkmark-v2"></span>
                <span className="checkbox-label-v2" style={{ marginLeft: '6px' }}>
                  {language === 'es' ? 'Notificaciones por Correo' : 'Email Alerts'}
                </span>
              </label>

              <label className="checkbox-container-v2" style={{ margin: 0, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={smsNotif}
                  onChange={(e) => {
                    setSmsNotif(e.target.checked);
                    showToast(language === 'es' ? 'Notificaciones guardadas' : 'Notifications saved');
                  }}
                />
                <span className="checkbox-checkmark-v2"></span>
                <span className="checkbox-label-v2" style={{ marginLeft: '6px' }}>
                  {language === 'es' ? 'Alertas SMS de stock crítico' : 'SMS critical stock alerts'}
                </span>
              </label>

              <label className="checkbox-container-v2" style={{ margin: 0, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={twoFactor}
                  onChange={(e) => {
                    setTwoFactor(e.target.checked);
                    showToast(language === 'es' ? 'Doble factor actualizado' : '2FA settings updated');
                  }}
                />
                <span className="checkbox-checkmark-v2"></span>
                <span className="checkbox-label-v2" style={{ marginLeft: '6px' }}>
                  {language === 'es' ? 'Doble factor de autenticación (2FA)' : 'Two-Factor Authentication (2FA)'}
                </span>
              </label>
            </div>
          </div>
        </article>

      </div>
    </AppLayout>
  );
}

export default Settings;
