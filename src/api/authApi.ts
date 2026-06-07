const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const sessionStorageKey = 'sicd-auth-session';

export type UserRole = 'ADMIN' | 'STOCK' | 'VIEWER';

export type AuthUser = {
  id: string;
  username: string;
  email?: string;
  name: string;
  role: UserRole;
};

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
};

export type TwoFactorRequiredResponse = {
  requires2FA: true;
  challengeId: string;
  user: AuthUser;
};

export type LoginResponse = AuthSession | TwoFactorRequiredResponse;

type LoginInput = {
  username: string;
  password: string;
};

export async function login(credentials: LoginInput): Promise<LoginResponse> {
  const response = await fetch(`${apiBaseUrl}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);

    throw new Error(
      errorBody?.message ?? 'Usuario o contraseña incorrectos.',
    );
  }

  return (await response.json()) as LoginResponse;
}

export async function loginWithGoogle(idToken: string): Promise<LoginResponse> {
  const response = await fetch(`${apiBaseUrl}/auth/google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);

    throw new Error(
      errorBody?.message ?? 'No se pudo iniciar sesión con Google.',
    );
  }

  return (await response.json()) as LoginResponse;
}

export async function setupTOTP(challengeId: string) {
  const response = await fetch(`${apiBaseUrl}/auth/2fa/setup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ challengeId }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);

    throw new Error(errorBody?.message ?? 'No se pudo preparar el 2FA.');
  }

  return (await response.json()) as {
    qrDataUrl: string;
    otpauthUrl: string;
    secret: string;
  };
}

export async function verifyTOTP(
  challengeId: string,
  token: string,
): Promise<AuthSession> {
  const response = await fetch(`${apiBaseUrl}/auth/2fa/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ challengeId, token }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);

    throw new Error(errorBody?.message ?? 'Código 2FA incorrecto.');
  }

  return (await response.json()) as AuthSession;
}

export function saveSession(session: AuthSession) {
  window.localStorage.setItem(sessionStorageKey, JSON.stringify(session));
}

export function getSession(): AuthSession | null {
  const savedSession = window.localStorage.getItem(sessionStorageKey);

  if (!savedSession) {
    return null;
  }

  try {
    return JSON.parse(savedSession) as AuthSession;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return getSession()?.accessToken ?? null;
}

export function getCurrentUser(): AuthUser | null {
  return getSession()?.user ?? null;
}

export function getCurrentRole(): UserRole | null {
  return getSession()?.user.role ?? null;
}

export function isAuthenticated(): boolean {
  return Boolean(getSession()?.accessToken);
}

export function canManageData(): boolean {
  const role = getCurrentRole();
  return role === 'ADMIN' || role === 'STOCK';
}

export function logout() {
  window.localStorage.removeItem(sessionStorageKey);
}

export function isTwoFactorRequired(
  response: LoginResponse,
): response is TwoFactorRequiredResponse {
  return 'requires2FA' in response && response.requires2FA === true;
}