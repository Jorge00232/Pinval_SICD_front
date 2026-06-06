import { Link, useNavigate } from 'react-router-dom';
import '../App.css';
import { login, saveSession } from '../api/authApi';
import { useTheme } from '../state/useTheme';
import { useLanguage } from '../language/useLanguage';
import { useState, useEffect } from 'react';

function Login() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  
  // Login states
  const [authMode, setAuthMode] = useState<'password' | 'otp' | 'biometrics'>('password');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('sicd-remember-me') === 'true';
  });
  
  // OTP states
  const [otpStep, setOtpStep] = useState<'send' | 'verify'>('send');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [otpSentMessage, setOtpSentMessage] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Biometrics states
  const [biometricsScanning, setBiometricsScanning] = useState(false);
  const [biometricsSuccess, setBiometricsSuccess] = useState(false);

  // Recovery modal
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [isSendingRecovery, setIsSendingRecovery] = useState(false);

  // General feedback
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Load remembered identifier if exists
  useEffect(() => {
    if (rememberMe) {
      const savedUser = localStorage.getItem('sicd-saved-user');
      if (savedUser) setIdentifier(savedUser);
    }
  }, [rememberMe]);

  // Auto-hide success toast
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    const inputUser = identifier.trim();
    const inputPass = password;

    try {
      let session;
      const lowerIdent = inputUser.toLowerCase();

      try {
        if (lowerIdent === 'admin' || lowerIdent === 'admin@pinval.cl') {
          session = await login({ username: 'admin', password: inputPass });
        } else if (lowerIdent === 'inventario' || lowerIdent === 'stock@pinval.cl') {
          session = await login({ username: 'inventario', password: inputPass });
        } else if (lowerIdent === 'consulta' || lowerIdent === 'consulta@pinval.cl') {
          session = await login({ username: 'consulta', password: inputPass });
        } else {
          session = await login({ username: inputUser, password: inputPass });
        }
      } catch (networkOrLoginError) {
        // Fallback to local hardcoded mock verification if the backend fails or is offline
        const isDemoAdmin = (lowerIdent === 'admin' || lowerIdent === 'admin@pinval.cl') && inputPass === 'admin123';
        const isDemoStock = (lowerIdent === 'inventario' || lowerIdent === 'stock@pinval.cl') && inputPass === 'stock123';
        const isDemoViewer = (lowerIdent === 'consulta' || lowerIdent === 'consulta@pinval.cl') && inputPass === 'consulta123';

        if (isDemoAdmin) {
          session = {
            accessToken: 'local-demo-token-admin',
            user: { id: 'admin-id', username: 'admin', name: 'Administrador (Demo)', role: 'ADMIN' as const }
          };
        } else if (isDemoStock) {
          session = {
            accessToken: 'local-demo-token-stock',
            user: { id: 'stock-id', username: 'inventario', name: 'Control Stock (Demo)', role: 'STOCK' as const }
          };
        } else if (isDemoViewer) {
          session = {
            accessToken: 'local-demo-token-viewer',
            user: { id: 'viewer-id', username: 'consulta', name: 'Consulta (Demo)', role: 'VIEWER' as const }
          };
        } else {
          // If it wasn't a valid local demo account and backend failed, rethrow the error
          throw networkOrLoginError;
        }
      }

      if (rememberMe) {
        localStorage.setItem('sicd-remember-me', 'true');
        localStorage.setItem('sicd-saved-user', inputUser);
      } else {
        localStorage.removeItem('sicd-remember-me');
        localStorage.removeItem('sicd-saved-user');
      }

      saveSession(session);
      setSuccessToast(t('login.biometricsSuccess') || '¡Acceso exitoso!');
      setTimeout(() => navigate('/home'), 800);
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : t('login.loginError'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError(language === 'es' ? 'Por favor ingrese su correo o teléfono' : 'Please enter your email or phone');
      return;
    }
    setError('');
    setIsSubmitting(true);

    // Mock sending OTP
    setTimeout(() => {
      setIsSubmitting(false);
      setOtpStep('verify');
      setCountdown(60);
      setOtpSentMessage(`${t('login.otpSent')} a ${identifier}`);
    }, 1200);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpCode.join('');
    if (code.length < 6) {
      setError(language === 'es' ? 'Ingrese el código completo de 6 dígitos' : 'Please enter the full 6-digit code');
      return;
    }
    setError('');
    setIsSubmitting(true);

    // Mock OTP validation (accepts any code for the capstone demo)
    setTimeout(() => {
      setIsSubmitting(false);
      
      // Save a mock demo session
      const mockSession = {
        accessToken: 'mock-otp-token',
        user: {
          id: 'otp-user',
          username: 'admin',
          name: 'Demo OTP User',
          role: 'ADMIN' as const
        }
      };
      saveSession(mockSession);
      setSuccessToast(t('login.biometricsSuccess') || '¡Acceso exitoso!');
      setTimeout(() => navigate('/home'), 800);
    }, 1000);
  };

  const handleOtpInputChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);

    // Focus next input automatically
    if (value !== '' && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && otpCode[index] === '' && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
        const newOtp = [...otpCode];
        newOtp[index - 1] = '';
        setOtpCode(newOtp);
      }
    }
  };

  const handleBiometricsScan = () => {
    setError('');
    setBiometricsScanning(true);

    // Mock biometric scan
    setTimeout(() => {
      setBiometricsScanning(false);
      setBiometricsSuccess(true);
      
      setTimeout(() => {
        // Save a mock admin session
        const mockSession = {
          accessToken: 'mock-biometrics-token',
          user: {
            id: 'bio-user',
            username: 'admin',
            name: 'Biometric Admin',
            role: 'ADMIN' as const
          }
        };
        saveSession(mockSession);
        setSuccessToast(t('login.biometricsSuccess'));
        setTimeout(() => navigate('/home'), 1000);
      }, 800);
    }, 2000);
  };

  const handleSocialLogin = (platform: string) => {
    setError('');
    setIsSubmitting(true);
    setSuccessToast(language === 'es' ? `Conectando con ${platform}...` : `Connecting with ${platform}...`);
    
    // Simulate social login redirect/auth
    setTimeout(() => {
      const mockSession = {
        accessToken: `mock-${platform.toLowerCase()}-token`,
        user: {
          id: `${platform.toLowerCase()}-user`,
          username: 'consulta',
          name: `Social User (${platform})`,
          role: 'VIEWER' as const
        }
      };
      saveSession(mockSession);
      navigate('/home');
    }, 1500);
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    setRecoveryMessage('');
    
    if (!recoveryEmail.trim()) {
      setRecoveryError(language === 'es' ? 'Ingrese su correo' : 'Please enter your email');
      return;
    }
    
    setIsSendingRecovery(true);
    setTimeout(() => {
      setIsSendingRecovery(false);
      setRecoveryMessage(
        language === 'es' 
          ? 'Instrucciones enviadas. Revisa tu bandeja de entrada.' 
          : 'Instructions sent. Please check your inbox.'
      );
    }, 1500);
  };

  return (
    <div className="login-page-v2">
      {/* Background decoration elements for premium glassmorphism vibe */}
      <div className="decor-blob decor-blob-1"></div>
      <div className="decor-blob decor-blob-2"></div>
      <div className="decor-blob decor-blob-3"></div>

      {successToast && (
        <div className="floating-toast success" role="status">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>{successToast}</span>
        </div>
      )}

      <section className="login-card-v2" aria-labelledby="login-title">
        {/* Header containing system branding info, theme & language */}
        <div className="login-header-v2">
          <div className="login-logo-v2">
            <span className="logo-badge-v2">PV</span>
            <div className="logo-text-v2">
              <strong>Pinval SICD</strong>
              <span>{t('layout.brandSubtitle')}</span>
            </div>
          </div>

          <div className="login-actions-v2">
            <div className="language-toggle">
              <button
                type="button"
                className={`language-toggle-button ${language === 'es' ? 'active' : ''}`}
                onClick={() => setLanguage('es')}
                aria-label="Español"
              >
                {t('language.es')}
              </button>
              <button
                type="button"
                className={`language-toggle-button ${language === 'en' ? 'active' : ''}`}
                onClick={() => setLanguage('en')}
                aria-label="English"
              >
                {t('language.en')}
              </button>
            </div>

            <button
              type="button"
              className="theme-icon-button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? t('layout.changeToLight') : t('layout.changeToDark')}
            >
              {theme === 'dark' ? (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Intro text */}
        <div className="login-intro-v2">
          <p className="eyebrow">{t('login.eyebrow')}</p>
          <h1 id="login-title">{t('login.title')}</h1>
          <p>{t('login.description')}</p>
        </div>

        {/* Navigation Tabs to choose authentication mode */}
        <div className="auth-tabs-v2">
          <button
            type="button"
            className={`auth-tab-btn ${authMode === 'password' ? 'active' : ''}`}
            onClick={() => { setAuthMode('password'); setError(''); }}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span>{language === 'es' ? 'Contraseña' : 'Password'}</span>
          </button>
          
          <button
            type="button"
            className={`auth-tab-btn ${authMode === 'otp' ? 'active' : ''}`}
            onClick={() => { setAuthMode('otp'); setError(''); }}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            <span>OTP</span>
          </button>
          
          <button
            type="button"
            className={`auth-tab-btn ${authMode === 'biometrics' ? 'active' : ''}`}
            onClick={() => { setAuthMode('biometrics'); setError(''); }}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12c0-1.66-4-3-9-3s-9 1.34-9 3"></path>
              <path d="M3 20c0-1.66 4-3 9-3s9 1.34 9 3"></path>
              <path d="M12 2a15.3 15.3 0 0 1 4 10c0 1.66-4 3-9 3s-9-1.34-9-3A15.3 15.3 0 0 1 12 2z"></path>
            </svg>
            <span>{language === 'es' ? 'Biométrico' : 'Biometrics'}</span>
          </button>
        </div>

        {/* DYNAMIC FORMS ACCORDING TO SELECTED TAB */}
        {authMode === 'password' && (
          <form className="login-form-v2" onSubmit={handlePasswordSubmit}>
            <div className="form-group-v2">
              <label htmlFor="identifier-input">{t('login.identifier') || 'Usuario o Correo'}</label>
              <div className="input-with-icon-v2">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="input-icon-left">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <input
                  id="identifier-input"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={t('login.identifierPlaceholder') || t('login.userPlaceholder')}
                  required
                />
              </div>
            </div>

            <div className="form-group-v2">
              <div className="label-row-v2">
                <label htmlFor="password-input">{t('login.password')}</label>
                <button
                  type="button"
                  className="link-btn-v2 forgot-password-btn"
                  onClick={() => setShowRecoveryModal(true)}
                >
                  {t('login.forgotPassword') || '¿Olvidó su contraseña?'}
                </button>
              </div>
              <div className="input-with-icon-v2">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="input-icon-left">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('login.passwordPlaceholder')}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn-v2"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="form-actions-v2">
              <label className="checkbox-container-v2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="checkbox-checkmark-v2"></span>
                <span className="checkbox-label-v2">{t('login.rememberMe') || 'Recordarme'}</span>
              </label>
            </div>

            {error && <p className="form-error-v2" role="alert">{error}</p>}

            <button type="submit" className="submit-btn-v2" disabled={isSubmitting}>
              {isSubmitting ? t('login.submitting') : t('login.submit')}
            </button>
          </form>
        )}

        {authMode === 'otp' && (
          <div className="passwordless-container-v2">
            <p className="tab-description-v2">{t('login.passwordlessDesc')}</p>
            
            {otpStep === 'send' ? (
              <form onSubmit={handleSendOtp} className="login-form-v2">
                <div className="form-group-v2">
                  <label htmlFor="otp-identifier">{t('login.identifier') || 'Correo electrónico o Teléfono'}</label>
                  <div className="input-with-icon-v2">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="input-icon-left">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    <input
                      id="otp-identifier"
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={t('login.identifierPlaceholder')}
                      required
                    />
                  </div>
                </div>

                {error && <p className="form-error-v2" role="alert">{error}</p>}

                <button type="submit" className="submit-btn-v2" disabled={isSubmitting}>
                  {isSubmitting ? t('login.submitting') : t('login.sendOtp')}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="login-form-v2">
                {otpSentMessage && <p className="otp-sent-status-v2">{otpSentMessage}</p>}
                
                <div className="form-group-v2">
                  <label>{t('login.enterOtp')}</label>
                  <div className="otp-code-grid-v2">
                    {otpCode.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-input-${index}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpInputChange(e.target.value, index)}
                        onKeyDown={(e) => handleOtpKeyDown(e, index)}
                        className="otp-digit-input-v2"
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                </div>

                {error && <p className="form-error-v2" role="alert">{error}</p>}

                <div className="otp-resend-row-v2">
                  {countdown > 0 ? (
                    <span className="resend-countdown-v2">
                      {language === 'es' ? `Reenviar código en ${countdown}s` : `Resend code in ${countdown}s`}
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="link-btn-v2"
                      onClick={() => {
                        setCountdown(60);
                        setSuccessToast(t('login.otpSent'));
                      }}
                    >
                      {language === 'es' ? 'Reenviar código OTP' : 'Resend OTP Code'}
                    </button>
                  )}
                </div>

                <div className="button-group-v2">
                  <button
                    type="button"
                    className="secondary-btn-v2"
                    onClick={() => { setOtpStep('send'); setError(''); }}
                  >
                    {language === 'es' ? 'Atrás' : 'Back'}
                  </button>
                  <button type="submit" className="submit-btn-v2" disabled={isSubmitting}>
                    {isSubmitting ? t('login.submitting') : t('login.submit')}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {authMode === 'biometrics' && (
          <div className="biometrics-container-v2">
            <h3>{t('login.biometricsTitle')}</h3>
            <p className="tab-description-v2">{t('login.biometricsDesc')}</p>

            <div className="biometric-scanner-v2">
              <button
                type="button"
                className={`biometric-scan-circle-v2 ${biometricsScanning ? 'scanning' : ''} ${biometricsSuccess ? 'success' : ''}`}
                onClick={handleBiometricsScan}
                disabled={biometricsScanning || biometricsSuccess}
                aria-label={t('login.biometricsScan')}
              >
                {biometricsSuccess ? (
                  <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2.5" className="success-icon-anim">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" className="fingerprint-icon-anim">
                    <path d="M12 2a10 10 0 0 0-10 10c0 2.2.8 4.2 2.1 5.7l1.4-1.4A8 8 0 1 1 20 12"></path>
                    <path d="M12 6a6 6 0 0 0-6 6c0 1.3.4 2.5 1.1 3.5l1.4-1.4A4 4 0 1 1 16 12"></path>
                    <path d="M12 10a2 2 0 0 0-2 2c0 .5.2.9.5 1.2l1.4-1.4c-.2-.1-.3-.3-.3-.6a.8.8 0 0 1 .8-.8c.2 0 .4.1.5.3l1.4-1.4A2 2 0 0 0 12 10z"></path>
                    <path d="M12 14a4 4 0 0 0 4-4c0-.5-.1-.9-.3-1.3l-1.4 1.4c.1.2.1.4.1.6a2 2 0 0 1-2 2"></path>
                    <path d="M12 18a8 8 0 0 0 8-8c0-1.1-.2-2.1-.6-3.1l-1.4 1.4c.3.5.4 1.1.4 1.7a6 6 0 0 1-6 6"></path>
                    <path d="M12 22a12 12 0 0 0 12-12c0-1.6-.3-3.2-.9-4.7l-1.4 1.4a10.03 10.03 0 0 1-9.7 15.3"></path>
                  </svg>
                )}
                {biometricsScanning && <div className="scanning-bar-v2"></div>}
              </button>
              
              <span className="scanner-status-label-v2">
                {biometricsScanning 
                  ? (language === 'es' ? 'Escaneando huella dactilar...' : 'Scanning fingerprint...')
                  : biometricsSuccess
                    ? t('login.biometricsSuccess')
                    : (language === 'es' ? 'Presione para escanear' : 'Press to scan')}
              </span>
            </div>

            <button
              type="button"
              className="submit-btn-v2 scan-trigger-btn-v2"
              onClick={handleBiometricsScan}
              disabled={biometricsScanning || biometricsSuccess}
            >
              {biometricsScanning 
                ? (language === 'es' ? 'Validando...' : 'Verifying...') 
                : biometricsSuccess 
                  ? t('login.biometricsSuccess')
                  : t('login.biometricsScan')}
            </button>
          </div>
        )}

        {/* SOCIAL SIGN IN (OAuth) */}
        <div className="social-auth-v2">
          <div className="divider-v2">
            <span>{t('login.socialTitle') || 'O inicia sesión con'}</span>
          </div>

          <div className="social-grid-v2">
            <button
              type="button"
              className="social-btn-v2 google"
              onClick={() => handleSocialLogin('Google')}
              aria-label="Google"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12.24 10.285V13.4h6.887c-.648 2.41-2.519 4.115-5.176 4.115-3.41 0-6.19-2.77-6.19-6.18 0-3.41 2.78-6.19 6.19-6.19 1.566 0 2.98.587 4.07 1.546l2.351-2.35C18.828 2.96 15.76 1.7 12.24 1.7 6.55 1.7 1.94 6.31 1.94 12s4.61 10.3 10.3 10.3c5.94 0 10.23-4.18 10.23-10.4 0-.61-.06-1.17-.18-1.615H12.24z"></path>
              </svg>
              <span>Google</span>
            </button>

            <button
              type="button"
              className="social-btn-v2 apple"
              onClick={() => handleSocialLogin('Apple')}
              aria-label="Apple"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.2.67-2.92 1.52-.63.73-1.18 1.87-1.03 2.98.92.07 2.1-.51 2.96-1.44z"></path>
              </svg>
              <span>Apple</span>
            </button>

            <button
              type="button"
              className="social-btn-v2 facebook"
              onClick={() => handleSocialLogin('Facebook')}
              aria-label="Facebook"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.8c4.56-.93 8-4.96 8-9.8z"></path>
              </svg>
              <span>Facebook</span>
            </button>

            <button
              type="button"
              className="social-btn-v2 twitter"
              onClick={() => handleSocialLogin('Twitter')}
              aria-label="Twitter"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
              </svg>
              <span>Twitter</span>
            </button>
          </div>
        </div>

        {/* Demo hints to guide Capstone evaluators */}
        <p className="login-help-v2">
          <strong>Demo:</strong> {t('login.demoUsers')}
        </p>

        {/* Bypass link */}
        <div className="login-footer-links-v2">
          <Link to="/home" className="enter-system-link-v2">
            <span>{t('login.enterSystem')}</span>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </Link>
        </div>
      </section>

      {/* Sleek Floating Password Recovery Modal */}
      {showRecoveryModal && (
        <div className="modal-backdrop-v2" onClick={() => setShowRecoveryModal(false)}>
          <div className="modal-content-v2" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-v2">
              <h2>{t('login.forgotPassword')}</h2>
              <button
                type="button"
                className="close-modal-btn-v2"
                onClick={() => setShowRecoveryModal(false)}
                aria-label="Cerrar modal"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleRecoverySubmit}>
              <p className="modal-desc-v2">
                {language === 'es'
                  ? 'Ingresa tu correo electrónico registrado y te enviaremos las instrucciones de recuperación de forma segura.'
                  : 'Enter your registered email address and we will send you the recovery instructions securely.'}
              </p>

              <div className="form-group-v2">
                <label htmlFor="recovery-email-input">{language === 'es' ? 'Correo electrónico' : 'Email Address'}</label>
                <input
                  id="recovery-email-input"
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  placeholder="ejemplo@empresa.com"
                  required
                />
              </div>

              {recoveryError && <p className="form-error-v2" role="alert">{recoveryError}</p>}
              {recoveryMessage && <p className="form-success-v2" role="status">{recoveryMessage}</p>}

              <div className="modal-footer-v2">
                <button
                  type="button"
                  className="secondary-btn-v2"
                  onClick={() => setShowRecoveryModal(false)}
                >
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="submit-btn-v2"
                  disabled={isSendingRecovery}
                >
                  {isSendingRecovery 
                    ? (language === 'es' ? 'Enviando...' : 'Sending...') 
                    : (language === 'es' ? 'Enviar enlace' : 'Send link')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;

