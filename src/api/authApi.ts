const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const sessionStorageKey = 'sicd-auth-session';

export type AuthSession = {
  accessToken: string;
  user: {
    id: string;
    username: string;
    name: string;
    role: 'ADMIN' | 'STOCK' | 'VIEWER';
  };
};

type LoginInput = {
  username: string;
  password: string;
};

export async function login(credentials: LoginInput) {
  const response = await fetch(`${apiBaseUrl}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw new Error('Usuario o contrasena incorrectos.');
  }

  return (await response.json()) as AuthSession;
}

export function saveSession(session: AuthSession) {
  window.localStorage.setItem(sessionStorageKey, JSON.stringify(session));
}

export function getSession() {
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

export function getCurrentRole() {
  return getSession()?.user.role ?? null;
}

export function canManageData() {
  const role = getCurrentRole();
  return role === 'ADMIN' || role === 'STOCK';
}
