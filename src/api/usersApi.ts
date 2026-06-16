import { getAccessToken, type UserRole } from './authApi';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export type SystemUser = {
  id: string;
  username: string | null;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  allowGoogle: boolean;
  hasPassword: boolean;
  hasTwoFactor: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateUserInput = {
  username?: string;
  email: string;
  name: string;
  role: UserRole;
  password?: string;
  allowGoogle: boolean;
  isActive: boolean;
};

export type UpdateUserInput = Partial<CreateUserInput>;

function getAuthHeaders() {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Sesión no disponible. Inicia sesión nuevamente.');
  }

  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

async function parseError(response: Response, fallbackMessage: string) {
  const errorBody = await response.json().catch(() => null);
  const message = errorBody?.message;

  if (Array.isArray(message)) {
    return message.join(' ');
  }

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  return fallbackMessage;
}

export async function fetchUsers(): Promise<SystemUser[]> {
  const response = await fetch(`${apiBaseUrl}/users`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      await parseError(response, 'No se pudieron cargar los usuarios.'),
    );
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data)) {
    throw new Error('La respuesta de usuarios no tiene el formato esperado.');
  }

  return data as SystemUser[];
}

export async function createUser(input: CreateUserInput): Promise<SystemUser> {
  const response = await fetch(`${apiBaseUrl}/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(
      await parseError(response, 'No se pudo crear el usuario.'),
    );
  }

  return (await response.json()) as SystemUser;
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
): Promise<SystemUser> {
  const response = await fetch(`${apiBaseUrl}/users/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(
      await parseError(response, 'No se pudo actualizar el usuario.'),
    );
  }

  return (await response.json()) as SystemUser;
}

export async function resetUserTwoFactor(id: string): Promise<SystemUser> {
  const response = await fetch(
    `${apiBaseUrl}/users/${encodeURIComponent(id)}/reset-2fa`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error(
      await parseError(response, 'No se pudo resetear el 2FA del usuario.'),
    );
  }

  return (await response.json()) as SystemUser;
}
