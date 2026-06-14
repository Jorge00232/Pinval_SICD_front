const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const sessionStorageKey = 'sicd-auth-session';

export const SESSION_TIMEOUT_MS = 10 * 60 * 1000;

export type UserRole = 'ADMIN' | 'STOCK' | 'VIEWER';

export type AuthUser = {
  id: string;
  username: string;
  email?: string | null;
  name: string;
  role: UserRole;
};

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
};

export type StoredAuthSession = AuthSession & {
  createdAt: number;
  lastActivityAt: number;
  expiresAt: number;
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

export type AuditUserInfo = {
  user: string;
  detail: string;
};

function normalizeText(value: unknown) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

function normalizeUser(user: AuthUser): AuthUser {
  return {
    id: normalizeText(user.id),
    username: normalizeText(user.username),
    email: normalizeText(user.email) || null,
    name: normalizeText(user.name),
    role: user.role,
  };
}

function normalizeSession(session: AuthSession): AuthSession {
  return {
    accessToken: normalizeText(session.accessToken),
    user: normalizeUser(session.user),
  };
}

function createStoredSession(session: AuthSession): StoredAuthSession {
  const now = Date.now();
  const normalizedSession = normalizeSession(session);

  return {
    ...normalizedSession,
    createdAt: now,
    lastActivityAt: now,
    expiresAt: now + SESSION_TIMEOUT_MS,
  };
}

function isStoredSession(value: unknown): value is StoredAuthSession {
  const session = value as Partial<StoredAuthSession>;

  return (
    typeof session.accessToken === 'string' &&
    typeof session.user === 'object' &&
    session.user !== null &&
    typeof session.createdAt === 'number' &&
    typeof session.lastActivityAt === 'number' &&
    typeof session.expiresAt === 'number'
  );
}

function readStoredSession(): StoredAuthSession | null {
  const savedSession = window.localStorage.getItem(sessionStorageKey);

  if (!savedSession) {
    return null;
  }

  try {
    const parsedSession = JSON.parse(savedSession) as unknown;

    if (!isStoredSession(parsedSession)) {
      logout();
      return null;
    }

    const normalizedSession: StoredAuthSession = {
      accessToken: normalizeText(parsedSession.accessToken),
      user: normalizeUser(parsedSession.user),
      createdAt: parsedSession.createdAt,
      lastActivityAt: parsedSession.lastActivityAt,
      expiresAt: parsedSession.expiresAt,
    };

    if (Date.now() >= normalizedSession.expiresAt) {
      logout();
      return null;
    }

    return normalizedSession;
  } catch {
    logout();
    return null;
  }
}

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

  const session = (await response.json()) as AuthSession;
  return normalizeSession(session);
}

export function saveSession(session: AuthSession) {
  window.localStorage.setItem(
    sessionStorageKey,
    JSON.stringify(createStoredSession(session)),
  );
}

export function getSession(): AuthSession | null {
  const storedSession = readStoredSession();

  if (!storedSession) {
    return null;
  }

  return {
    accessToken: storedSession.accessToken,
    user: storedSession.user,
  };
}

export function getStoredSession(): StoredAuthSession | null {
  return readStoredSession();
}

export function refreshSessionActivity() {
  const storedSession = readStoredSession();

  if (!storedSession) {
    return null;
  }

  const now = Date.now();

  const updatedSession: StoredAuthSession = {
    ...storedSession,
    lastActivityAt: now,
    expiresAt: now + SESSION_TIMEOUT_MS,
  };

  window.localStorage.setItem(
    sessionStorageKey,
    JSON.stringify(updatedSession),
  );

  return updatedSession;
}

export function isSessionExpired(): boolean {
  const savedSession = window.localStorage.getItem(sessionStorageKey);

  if (!savedSession) {
    return true;
  }

  try {
    const parsedSession = JSON.parse(savedSession) as Partial<StoredAuthSession>;

    if (typeof parsedSession.expiresAt !== 'number') {
      return true;
    }

    return Date.now() >= parsedSession.expiresAt;
  } catch {
    return true;
  }
}

export function getSessionRemainingMs(): number {
  const storedSession = readStoredSession();

  if (!storedSession) {
    return 0;
  }

  return Math.max(storedSession.expiresAt - Date.now(), 0);
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

export function getCurrentUserAuditInfo(): AuditUserInfo {
  const user = getCurrentUser();

  if (!user) {
    return {
      user: 'Usuario no identificado',
      detail: 'SIN_ROL',
    };
  }

  const auditUser =
    normalizeText(user.email) ||
    normalizeText(user.username) ||
    normalizeText(user.name) ||
    normalizeText(user.id) ||
    'Usuario no identificado';

  return {
    user: auditUser,
    detail: user.role || 'SIN_ROL',
  };
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