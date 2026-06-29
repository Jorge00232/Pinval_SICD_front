import { useEffect, useMemo, useState, type FormEvent } from 'react';
import AppLayout from '../components/AppLayout';
import {
  createUser,
  fetchUsers,
  resetUserTwoFactor,
  updateUser,
  type CreateUserInput,
  type SystemUser,
} from '../api/usersApi';
import type { UserRole } from '../api/authApi';
import { getCurrentUser } from '../api/authApi';

type UserFormState = {
  username: string;
  email: string;
  name: string;
  role: UserRole;
  password: string;
  allowGoogle: boolean;
  isActive: boolean;
};

const emptyForm: UserFormState = {
  username: '',
  email: '',
  name: '',
  role: 'VIEWER',
  password: '',
  allowGoogle: true,
  isActive: true,
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Sin fecha';
  }

  return date.toLocaleString('es-CL', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function getRoleLabel(role: UserRole) {
  if (role === 'ADMIN') {
    return 'Administrador';
  }

  if (role === 'STOCK') {
    return 'Inventario';
  }

  return 'Consulta';
}

function getUserStatusLabel(user: SystemUser) {
  return user.isActive ? 'Activo' : 'Inactivo';
}

function toCreatePayload(form: UserFormState): CreateUserInput {
  return {
    username: form.username.trim() || undefined,
    email: form.email.trim().toLowerCase(),
    name: form.name.trim(),
    role: form.role,
    password: form.password.trim() || undefined,
    allowGoogle: form.allowGoogle,
    isActive: form.isActive,
  };
}

function Users() {
  const currentUser = getCurrentUser();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isUsersListOpen, setIsUsersListOpen] = useState(false);
  const [isUserFormOpen, setIsUserFormOpen] = useState(true);

  const editingUser = useMemo(() => {
    if (!editingUserId) {
      return null;
    }

    return users.find((user) => user.id === editingUserId) ?? null;
  }, [editingUserId, users]);

  const activeUsers = users.filter((user) => user.isActive).length;
  const googleUsers = users.filter((user) => user.allowGoogle).length;
  const adminUsers = users.filter((user) => user.role === 'ADMIN').length;

  async function loadUsers() {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const loadedUsers = await fetchUsers();
      setUsers(loadedUsers);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'No se pudieron cargar los usuarios.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  function updateForm<K extends keyof UserFormState>(
    key: K,
    value: UserFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function clearFeedback() {
    setMessage('');
    setErrorMessage('');
  }

  function resetForm(options?: { collapse?: boolean }) {
    setForm(emptyForm);
    setEditingUserId(null);

    if (options?.collapse) {
      setIsUserFormOpen(false);
    }
  }

  function startEdit(user: SystemUser) {
    clearFeedback();
    setEditingUserId(user.id);
    setForm({
      username: user.username ?? '',
      email: user.email,
      name: user.name,
      role: user.role,
      password: '',
      allowGoogle: user.allowGoogle,
      isActive: user.isActive,
    });
    setIsUserFormOpen(true);

    window.requestAnimationFrame(() => {
      document
        .querySelector('.users-admin-form-panel')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    clearFeedback();

    if (!form.email.trim() || !form.name.trim()) {
      setErrorMessage('Nombre y correo son obligatorios.');
      return;
    }

    setIsSaving(true);

    try {
      if (editingUser) {
        const payload = toCreatePayload(form);
        const updatedUser = await updateUser(editingUser.id, payload);

        setUsers((current) =>
          current.map((user) =>
            user.id === updatedUser.id ? updatedUser : user,
          ),
        );
        setMessage('Usuario actualizado correctamente.');
      } else {
        const createdUser = await createUser(toCreatePayload(form));
        setUsers((current) => [createdUser, ...current]);
        setMessage('Usuario creado correctamente.');
      }

      resetForm();
      setIsUserFormOpen(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar el usuario.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleStatus(user: SystemUser) {
    clearFeedback();

    if (user.id === currentUser?.id && user.isActive) {
      setErrorMessage(
        'No puedes desactivar tu propio usuario mientras estás en sesión.',
      );
      return;
    }

    try {
      const updatedUser = await updateUser(user.id, {
        isActive: !user.isActive,
      });

      setUsers((current) =>
        current.map((item) =>
          item.id === updatedUser.id ? updatedUser : item,
        ),
      );

      setMessage(
        updatedUser.isActive
          ? 'Usuario activado correctamente.'
          : 'Usuario desactivado correctamente.',
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'No se pudo cambiar el estado del usuario.',
      );
    }
  }

  async function handleToggleGoogle(user: SystemUser) {
    clearFeedback();

    try {
      const updatedUser = await updateUser(user.id, {
        allowGoogle: !user.allowGoogle,
      });

      setUsers((current) =>
        current.map((item) =>
          item.id === updatedUser.id ? updatedUser : item,
        ),
      );

      setMessage(
        updatedUser.allowGoogle
          ? 'Acceso con Google habilitado.'
          : 'Acceso con Google deshabilitado.',
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'No se pudo cambiar el acceso con Google.',
      );
    }
  }

  async function handleResetTwoFactor(user: SystemUser) {
    clearFeedback();

    const confirmed = window.confirm(
      `¿Resetear 2FA para ${user.name}? La próxima vez deberá escanear un QR nuevo.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      const updatedUser = await resetUserTwoFactor(user.id);

      setUsers((current) =>
        current.map((item) =>
          item.id === updatedUser.id ? updatedUser : item,
        ),
      );

      setMessage('2FA reseteado correctamente.');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'No se pudo resetear el 2FA.',
      );
    }
  }

  return (
    <AppLayout
      title="Administración de usuarios"
      description="Agrega, edita y controla quién puede acceder a SICD."
    >
      <div className="users-admin-layout">
        <section className="metric-grid users-admin-metrics">
          <article className="metric-card compact-metric blue">
            <span className="metric-icon">US</span>
            <span>Total usuarios</span>
            <strong>{users.length}</strong>
            <p>Registrados en base de datos</p>
          </article>

          <article className="metric-card compact-metric green">
            <span className="metric-icon">AC</span>
            <span>Activos</span>
            <strong>{activeUsers}</strong>
            <p>Con acceso habilitado</p>
          </article>

          <article className="metric-card compact-metric amber">
            <span className="metric-icon">GG</span>
            <span>Google</span>
            <strong>{googleUsers}</strong>
            <p>Autorizados con Google</p>
          </article>

          <article className="metric-card compact-metric red">
            <span className="metric-icon">AD</span>
            <span>Admins</span>
            <strong>{adminUsers}</strong>
            <p>Con permisos de administración</p>
          </article>
        </section>

        {message ? (
          <p className="form-message success users-admin-feedback">{message}</p>
        ) : null}
        {errorMessage ? (
          <p className="form-message error users-admin-feedback">{errorMessage}</p>
        ) : null}

        <details
          className="panel users-admin-disclosure users-admin-form-panel"
          open={isUserFormOpen}
          onToggle={(event) => setIsUserFormOpen(event.currentTarget.open)}
        >
          <summary className="users-admin-disclosure-summary">
            <div className="users-admin-summary-main">
              <h2>{editingUser ? 'Editar usuario' : 'Agregar usuario'}</h2>
              <span>
                {editingUser
                  ? 'Actualiza los datos del usuario seleccionado.'
                  : 'Autoriza un nuevo correo para ingresar al sistema.'}
              </span>
            </div>

            <div className="users-admin-summary-actions">
              {editingUser ? (
                <button
                  type="button"
                  className="ghost-button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    resetForm();
                  }}
                >
                  Nuevo usuario
                </button>
              ) : null}

              <span className="users-admin-toggle-indicator" aria-hidden="true">
                {isUserFormOpen ? '−' : '+'}
              </span>
            </div>
          </summary>

          <div className="users-admin-disclosure-body">
            <form className="grid-form users-admin-form" onSubmit={handleSubmit}>
              <label>
                Nombre
                <input
                  value={form.name}
                  onChange={(event) => updateForm('name', event.target.value)}
                  placeholder="Ej: Constanza Arce"
                  required
                />
              </label>

              <label>
                Correo autorizado
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateForm('email', event.target.value)}
                  placeholder="correo@empresa.cl"
                  required
                />
              </label>

              <label>
                Usuario
                <input
                  value={form.username}
                  onChange={(event) => updateForm('username', event.target.value)}
                  placeholder="Ej: co.arce"
                />
              </label>

              <label>
                Rol
                <select
                  value={form.role}
                  onChange={(event) =>
                    updateForm('role', event.target.value as UserRole)
                  }
                >
                  <option value="ADMIN">ADMIN - Administrador</option>
                  <option value="STOCK">STOCK - Inventario</option>
                  <option value="VIEWER">VIEWER - Consulta</option>
                </select>
              </label>

              <label>
                Contraseña inicial
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => updateForm('password', event.target.value)}
                  placeholder={
                    editingUser
                      ? 'Dejar vacío para mantener contraseña'
                      : 'Opcional si usará Google'
                  }
                />
              </label>

              <div className="users-admin-switches">
                <label className="users-admin-checkbox">
                  <input
                    type="checkbox"
                    checked={form.allowGoogle}
                    onChange={(event) =>
                      updateForm('allowGoogle', event.target.checked)
                    }
                  />
                  <span>Permitir ingreso con Google</span>
                </label>

                <label className="users-admin-checkbox">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) =>
                      updateForm('isActive', event.target.checked)
                    }
                  />
                  <span>Usuario activo</span>
                </label>
              </div>

              <div className="users-admin-submit-row">
                <button type="submit" disabled={isSaving}>
                  {isSaving
                    ? 'Guardando...'
                    : editingUser
                      ? 'Guardar cambios'
                      : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </details>

        <details
          className="panel users-admin-disclosure users-admin-list-panel"
          open={isUsersListOpen}
          onToggle={(event) => setIsUsersListOpen(event.currentTarget.open)}
        >
          <summary className="users-admin-disclosure-summary">
            <div className="users-admin-summary-main">
              <h2>Usuarios autorizados</h2>
              <span>
                Correos habilitados para ingresar a SICD según rol y estado.
              </span>
            </div>

            <div className="users-admin-summary-actions">
              <button
                type="button"
                className="ghost-button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  void loadUsers();
                }}
              >
                Actualizar
              </button>

              <span className="users-admin-toggle-indicator" aria-hidden="true">
                {isUsersListOpen ? '−' : '+'}
              </span>
            </div>
          </summary>

          <div className="users-admin-disclosure-body">
            {isLoading ? (
              <p className="empty-state">Cargando usuarios...</p>
            ) : users.length === 0 ? (
              <p className="empty-state">
                No hay usuarios registrados. Agrega el primer usuario desde el formulario.
              </p>
            ) : (
              <div className="table-wrap users-admin-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Rol</th>
                      <th>Estado</th>
                      <th>Google</th>
                      <th>2FA</th>
                      <th>Actualizado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="users-admin-user-cell">
                            <strong>{user.name}</strong>
                            <span>{user.email}</span>
                            <small>@{user.username ?? 'sin_usuario'}</small>
                          </div>
                        </td>

                        <td>
                          <span className={`status users-role-${user.role.toLowerCase()}`}>
                            {getRoleLabel(user.role)}
                          </span>
                        </td>

                        <td>
                          <span className={user.isActive ? 'status ok' : 'status danger'}>
                            {getUserStatusLabel(user)}
                          </span>
                        </td>

                        <td>
                          <span className={user.allowGoogle ? 'status ok' : 'status warning'}>
                            {user.allowGoogle ? 'Permitido' : 'Bloqueado'}
                          </span>
                        </td>

                        <td>
                          <span className={user.hasTwoFactor ? 'status ok' : 'status warning'}>
                            {user.hasTwoFactor ? 'Configurado' : 'Pendiente'}
                          </span>
                        </td>

                        <td>{formatDate(user.updatedAt)}</td>

                        <td>
                          <div className="table-actions users-admin-actions">
                            <button type="button" onClick={() => startEdit(user)}>
                              Editar
                            </button>

                            <button
                              type="button"
                              className="ghost-button"
                              onClick={() => void handleToggleStatus(user)}
                            >
                              {user.isActive ? 'Desactivar' : 'Activar'}
                            </button>

                            <button
                              type="button"
                              className="ghost-button"
                              onClick={() => void handleToggleGoogle(user)}
                            >
                              {user.allowGoogle ? 'Bloquear Google' : 'Permitir Google'}
                            </button>

                            <button
                              type="button"
                              className="danger-button"
                              onClick={() => void handleResetTwoFactor(user)}
                            >
                              Reset 2FA
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </details>

      </div>
    </AppLayout>
  );
}

export default Users;
