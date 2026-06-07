import { useState } from 'react';

function GoogleLoginMock() {
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mockUsers = [
    {
      id: 'google-admin',
      username: 'admin',
      name: 'Jorge Silva (Admin)',
      email: 'jorge.silva@pinval.cl',
      role: 'ADMIN',
      initial: 'J',
      color: '#1a73e8'
    },
    {
      id: 'google-stock',
      username: 'inventario',
      name: 'Carolina Tapia (Stock)',
      email: 'carolina.t@pinval.cl',
      role: 'STOCK',
      initial: 'C',
      color: '#0f9d58'
    },
    {
      id: 'google-viewer',
      username: 'consulta',
      name: 'Invitado Consulta (Viewer)',
      email: 'invitado@pinval.cl',
      role: 'VIEWER',
      initial: 'I',
      color: '#f4b400'
    }
  ];

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setIsSubmitting(true);

    // Simulate authenticating with Google
    setTimeout(() => {
      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'GOOGLE_LOGIN_SUCCESS',
            user: {
              id: user.id,
              username: user.username,
              name: user.name,
              role: user.role
            }
          },
          window.location.origin
        );
      }
      window.close();
    }, 1200);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Google Logo */}
        <div style={styles.logoContainer}>
          <svg viewBox="0 0 24 24" width="36" height="36" style={{ marginBottom: 16 }}>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.7-.66-1.19-1.53-1.19-2.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <h1 style={styles.title}>Elige una cuenta</h1>
          <p style={styles.subtitle}>para continuar en <span style={{ fontWeight: 600, color: '#3c4043' }}>Pinval SICD</span></p>
        </div>

        {isSubmitting ? (
          <div style={styles.loadingContainer}>
            <div className="google-spinner" style={styles.spinner}></div>
            <p style={styles.loadingText}>Iniciando sesión con {selectedUser?.name}...</p>
          </div>
        ) : (
          <div style={styles.userList}>
            {mockUsers.map((user) => (
              <button
                key={user.id}
                style={styles.userItem}
                onClick={() => handleSelectUser(user)}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div style={{ ...styles.avatar, backgroundColor: user.color }}>
                  {user.initial}
                </div>
                <div style={styles.userInfo}>
                  <span style={styles.userName}>{user.name}</span>
                  <span style={styles.userEmail}>{user.email}</span>
                </div>
              </button>
            ))}

            <button
              style={styles.useOtherButton}
              onClick={() => alert('Para esta demo capstone, por favor seleccione una de las cuentas disponibles.')}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <div style={styles.useOtherAvatar}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style={{ color: '#5f6368' }}>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/>
                </svg>
              </div>
              <div style={styles.userInfo}>
                <span style={{ ...styles.userName, color: '#1a73e8' }}>Usar otra cuenta</span>
              </div>
            </button>
          </div>
        )}

        <div style={styles.footer}>
          <span>Para continuar, Google compartirá tu nombre, dirección de correo electrónico y foto de perfil con Pinval SICD.</span>
        </div>
      </div>

      <style>{`
        @keyframes google-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .google-spinner {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #4285F4;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          animation: google-spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f0f4f9',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    padding: '16px',
    boxSizing: 'border-box'
  },
  card: {
    width: '100%',
    maxWidth: '450px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #dadce0',
    padding: '36px 40px',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)'
  },
  logoContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '24px'
  },
  title: {
    fontSize: '24px',
    fontWeight: 400,
    color: '#202124',
    margin: '0 0 8px 0',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: '16px',
    color: '#5f6368',
    margin: 0,
    textAlign: 'center'
  },
  userList: {
    display: 'flex',
    flexDirection: 'column',
    borderTop: '1px solid #dadce0',
    borderBottom: '1px solid #dadce0',
    margin: '12px 0 24px 0',
    padding: '8px 0'
  },
  userItem: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '12px 8px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    borderRadius: '4px',
    textAlign: 'left',
    transition: 'background-color 0.15s'
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: '14px',
    marginRight: '12px',
    flexShrink: 0
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column'
  },
  userName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#3c4043'
  },
  userEmail: {
    fontSize: '12px',
    color: '#5f6368'
  },
  useOtherButton: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '12px 8px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    borderRadius: '4px',
    textAlign: 'left',
    transition: 'background-color 0.15s'
  },
  useOtherAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12px',
    flexShrink: 0
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 0',
    textAlign: 'center'
  },
  spinner: {
    marginBottom: '16px'
  },
  loadingText: {
    fontSize: '14px',
    color: '#5f6368',
    margin: 0
  },
  footer: {
    fontSize: '12px',
    color: '#5f6368',
    lineHeight: '1.5',
    textAlign: 'left'
  }
};

export default GoogleLoginMock;
