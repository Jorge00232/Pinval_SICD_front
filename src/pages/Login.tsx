import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import {
  isTwoFactorRequired,
  login,
  loginWithGoogle,
  saveSession,
  setupTOTP,
  verifyTOTP,
} from '../api/authApi';
import type { AuthUser } from '../api/authApi';
import { useTheme } from '../state/useTheme';
import { useLanguage } from '../language/useLanguage';
import { useEffect, useState } from 'react';

type LoginStep = 'credentials' | 'twofa';

type TwoFactorState = {
  challengeId: string;
  user: AuthUser;
  qrDataUrl: string;
  secret: string;
};

function Login() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const [loginStep, setLoginStep] = useState<LoginStep>('credentials');

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('sicd-remember-me') === 'true';
  });

  const [twoFactorState, setTwoFactorState] = useState<TwoFactorState | null>(
    null,
  );

  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);

  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [isSendingRecovery, setIsSendingRecovery] = useState(false);

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  useEffect(() => {
    if (rememberMe) {
      const savedUser = localStorage.getItem('sicd-saved-user');
      if (savedUser) {
        setIdentifier(savedUser);
      }
    }
  }, [rememberMe]);

  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  const startTwoFactor = async (challengeId: string, user: AuthUser) => {
    setError('');
    setIsSubmitting(true);

    try {
      const setup = await setupTOTP(challengeId);

      setTwoFactorState({
        challengeId,
        user,
        qrDataUrl: setup.qrDataUrl,
        secret: setup.secret,
      });

      setOtpCode(['', '', '', '', '', '']);
      setLoginStep('twofa');
    } catch (setupError) {
      setError(
        setupError instanceof Error
          ? setupError.message
          : 'No se pudo iniciar la verificación en 2 pasos.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    const inputUser = identifier.trim();
    const inputPass = password;
    const lowerIdent = inputUser.toLowerCase();

    try {
      let username = inputUser;

      if (lowerIdent === 'admin@pinval.cl') {
        username = 'admin';
      } else if (lowerIdent === 'stock@pinval.cl') {
        username = 'inventario';
      } else if (lowerIdent === 'inventario@pinval.cl') {
        username = 'inventario';
      } else if (lowerIdent === 'consulta@pinval.cl') {
        username = 'consulta';
      }

      const response = await login({
        username,
        password: inputPass,
      });

      if (rememberMe) {
        localStorage.setItem('sicd-remember-me', 'true');
        localStorage.setItem('sicd-saved-user', inputUser);
      } else {
        localStorage.removeItem('sicd-remember-me');
        localStorage.removeItem('sicd-saved-user');
      }

      if (isTwoFactorRequired(response)) {
        await startTwoFactor(response.challengeId, response.user);
        return;
      }

      saveSession(response);

      setSuccessToast(
        language === 'es'
          ? '¡Inicio de sesión exitoso!'
          : 'Login successful!',
      );

      setTimeout(() => {
        navigate('/home');
      }, 800);
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

  const handleGoogleSuccess = async (credential?: string) => {
    setError('');

    if (!credential) {
      setError(
        language === 'es'
          ? 'Google no entregó una credencial válida.'
          : 'Google did not return a valid credential.',
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await loginWithGoogle(credential);

      if (isTwoFactorRequired(response)) {
        await startTwoFactor(response.challengeId, response.user);
        return;
      }

      saveSession(response);

      setSuccessToast(
        language === 'es'
          ? '¡Inicio de sesión con Google exitoso!'
          : 'Google login successful!',
      );

      setTimeout(() => {
        navigate('/home');
      }, 800);
    } catch (googleError) {
      setError(
        googleError instanceof Error
          ? googleError.message
          : 'No se pudo iniciar sesión con Google.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!twoFactorState) {
      setError('No existe una verificación 2FA activa.');
      return;
    }

    const code = otpCode.join('');

    if (code.length !== 6) {
      setError(
        language === 'es'
          ? 'Ingrese el código completo de 6 dígitos.'
          : 'Please enter the full 6-digit code.',
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const session = await verifyTOTP(twoFactorState.challengeId, code);

      saveSession(session);

      setSuccessToast(
        language === 'es'
          ? '¡Verificación exitosa!'
          : 'Verification successful!',
      );

      setTimeout(() => {
        navigate('/home');
      }, 800);
    } catch (verifyError) {
      setError(
        verifyError instanceof Error
          ? verifyError.message
          : 'Código 2FA incorrecto.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpInputChange = (value: string, index: number) => {
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);

    if (value !== '' && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handleOtpKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (event.key === 'Backspace' && otpCode[index] === '' && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) {
        prevInput.focus();

        const newOtp = [...otpCode];
        newOtp[index - 1] = '';
        setOtpCode(newOtp);
      }
    }
  };

  const handleBackToCredentials = () => {
    setLoginStep('credentials');
    setTwoFactorState(null);
    setOtpCode(['', '', '', '', '', '']);
    setError('');
  };

  const handleRecoverySubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setRecoveryError('');
    setRecoveryMessage('');

    if (!recoveryEmail.trim()) {
      setRecoveryError(
        language === 'es' ? 'Ingrese su correo' : 'Please enter your email',
      );
      return;
    }

    setIsSendingRecovery(true);

    setTimeout(() => {
      setIsSendingRecovery(false);
      setRecoveryMessage(
        language === 'es'
          ? 'Recuperación de contraseña todavía no está conectada al backend.'
          : 'Password recovery is not connected to the backend yet.',
      );
    }, 800);
  };

  return (
    <div className="login-page-v2">
      <div className="decor-blob decor-blob-1"></div>
      <div className="decor-blob decor-blob-2"></div>
      <div className="decor-blob decor-blob-3"></div>

      {successToast && (
        <div className="floating-toast success" role="status">
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>{successToast}</span>
        </div>
      )}

      <section className="login-card-v2" aria-labelledby="login-title">
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
                className={`language-toggle-button ${
                  language === 'es' ? 'active' : ''
                }`}
                onClick={() => setLanguage('es')}
                aria-label="Español"
              >
                {t('language.es')}
              </button>

              <button
                type="button"
                className={`language-toggle-button ${
                  language === 'en' ? 'active' : ''
                }`}
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
              aria-label={
                theme === 'dark'
                  ? t('layout.changeToLight')
                  : t('layout.changeToDark')
              }
            >
              {theme === 'dark' ? (
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
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
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </button>
          </div>
        </div>

        {loginStep === 'credentials' && (
          <>
            <div className="login-intro-v2">
              <p className="eyebrow">{t('login.eyebrow')}</p>
              <h1 id="login-title">{t('login.title')}</h1>
              <p>{t('login.description')}</p>
            </div>

            <form className="login-form-v2" onSubmit={handlePasswordSubmit}>
              <div className="form-group-v2">
                <label htmlFor="identifier-input">
                  {t('login.identifier') || 'Usuario o Correo'}
                </label>

                <div className="input-with-icon-v2">
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="input-icon-left"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>

                  <input
                    id="identifier-input"
                    type="text"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    placeholder={
                      t('login.identifierPlaceholder') ||
                      t('login.userPlaceholder')
                    }
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
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="input-icon-left"
                  >
                    <rect
                      x="3"
                      y="11"
                      width="18"
                      height="11"
                      rx="2"
                      ry="2"
                    ></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>

                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={t('login.passwordPlaceholder')}
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle-btn-v2"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                    }
                  >
                    {showPassword ? (
                      <svg
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
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
                    onChange={(event) => setRememberMe(event.target.checked)}
                  />
                  <span className="checkbox-checkmark-v2"></span>
                  <span className="checkbox-label-v2">
                    {t('login.rememberMe') || 'Recordarme'}
                  </span>
                </label>
              </div>

              {error && (
                <p className="form-error-v2" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="submit-btn-v2"
                disabled={isSubmitting}
              >
                {isSubmitting ? t('login.submitting') : t('login.submit')}
              </button>
            </form>

            <div className="social-auth-v2">
              <div className="divider-v2">
                <span>{t('login.socialTitle') || 'O inicia sesión con'}</span>
              </div>

              <div className="google-login-real-wrapper">
                <GoogleLogin
                  onSuccess={(credentialResponse) => {
                    void handleGoogleSuccess(credentialResponse.credential);
                  }}
                  onError={() => {
                    setError(
                      language === 'es'
                        ? 'El inicio de sesión con Google falló.'
                        : 'Google login failed.',
                    );
                  }}
                  text="continue_with"
                  shape="pill"
                  size="large"
                  width="100%"
                />
              </div>
            </div>

            <p className="login-help-v2">
              <strong>Usuarios backend:</strong>{' '}
              admin/admin123 · inventario/stock123 · consulta/consulta123
            </p>
          </>
        )}

        {loginStep === 'twofa' && (
          <>
            <div className="login-intro-v2">
              <p className="eyebrow">
                {language === 'es' ? 'Paso 2 de 2' : 'Step 2 of 2'}
              </p>

              <h1 id="login-title">
                {language === 'es'
                  ? 'Verificación en 2 pasos'
                  : 'Two-Step Verification'}
              </h1>

              <p>
                {language === 'es'
                  ? `Hola, ${twoFactorState?.user.name ?? 'usuario'}. Escanea el QR y escribe el código de 6 dígitos.`
                  : `Hi, ${twoFactorState?.user.name ?? 'user'}. Scan the QR and enter the 6-digit code.`}
              </p>
            </div>

            <div className="passwordless-container-v2">
              {twoFactorState?.qrDataUrl && (
                <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                  <img
                    src={twoFactorState.qrDataUrl}
                    alt="Código QR 2FA"
                    style={{
                      width: '180px',
                      height: '180px',
                      background: '#ffffff',
                      padding: '10px',
                      borderRadius: '16px',
                    }}
                  />

                  <p className="tab-description-v2" style={{ marginTop: '10px' }}>
                    {language === 'es'
                      ? 'Escanéalo con Google Authenticator, Microsoft Authenticator o Authy.'
                      : 'Scan it with Google Authenticator, Microsoft Authenticator or Authy.'}
                  </p>

                  <p
                    className="tab-description-v2"
                    style={{
                      fontSize: '12px',
                      wordBreak: 'break-all',
                      opacity: 0.8,
                    }}
                  >
                    Secret: {twoFactorState.secret}
                  </p>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="login-form-v2">
                <div className="form-group-v2">
                  <label>
                    {language === 'es'
                      ? 'Código de verificación'
                      : 'Verification code'}
                  </label>

                  <div className="otp-code-grid-v2">
                    {otpCode.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-input-${index}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(event) =>
                          handleOtpInputChange(event.target.value, index)
                        }
                        onKeyDown={(event) => handleOtpKeyDown(event, index)}
                        className="otp-digit-input-v2"
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="form-error-v2" role="alert">
                    {error}
                  </p>
                )}

                <div className="button-group-v2">
                  <button
                    type="button"
                    className="secondary-btn-v2"
                    onClick={handleBackToCredentials}
                  >
                    {language === 'es' ? 'Volver' : 'Back'}
                  </button>

                  <button
                    type="submit"
                    className="submit-btn-v2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? language === 'es'
                        ? 'Verificando...'
                        : 'Verifying...'
                      : language === 'es'
                        ? 'Verificar'
                        : 'Verify'}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </section>

      {showRecoveryModal && (
        <div
          className="modal-backdrop-v2"
          onClick={() => setShowRecoveryModal(false)}
        >
          <div
            className="modal-content-v2"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header-v2">
              <h2>{t('login.forgotPassword')}</h2>

              <button
                type="button"
                className="close-modal-btn-v2"
                onClick={() => setShowRecoveryModal(false)}
                aria-label="Cerrar modal"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <form onSubmit={handleRecoverySubmit}>
              <p className="modal-desc-v2">
                {language === 'es'
                  ? 'Ingresa tu correo electrónico registrado.'
                  : 'Enter your registered email address.'}
              </p>

              <div className="form-group-v2">
                <label htmlFor="recovery-email-input">
                  {language === 'es' ? 'Correo electrónico' : 'Email Address'}
                </label>

                <input
                  id="recovery-email-input"
                  type="email"
                  value={recoveryEmail}
                  onChange={(event) => setRecoveryEmail(event.target.value)}
                  placeholder="ejemplo@empresa.com"
                  required
                />
              </div>

              {recoveryError && (
                <p className="form-error-v2" role="alert">
                  {recoveryError}
                </p>
              )}

              {recoveryMessage && (
                <p className="form-success-v2" role="status">
                  {recoveryMessage}
                </p>
              )}

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
                    ? language === 'es'
                      ? 'Enviando...'
                      : 'Sending...'
                    : language === 'es'
                      ? 'Enviar enlace'
                      : 'Send link'}
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