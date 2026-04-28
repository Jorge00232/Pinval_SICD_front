import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import '../App.css';

type AppLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
};

const navItems = [
  { to: '/home', label: 'Dashboard' },
  { to: '/sales', label: 'Ventas' },
  { to: '/purchases', label: 'Compras' },
  { to: '/inventory', label: 'Inventario' },
  { to: '/products', label: 'Productos' },
  { to: '/movements', label: 'Movimientos' },
  { to: '/customers', label: 'Clientes' },
  { to: '/suppliers', label: 'Proveedores' },
  { to: '/alerts', label: 'Alertas' },
  { to: '/reports', label: 'Reportes' },
];

function AppLayout({ title, description, children }: AppLayoutProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Navegacion principal">
        <div className="sidebar-top">
          <div className="brand">
            <span className="brand-mark">PV</span>
            <div className="brand-copy">
              <p className="brand-tag">Pinval</p>
              <strong>SICD Pinval</strong>
              <span>Control de inventario</span>
            </div>
          </div>

          <p className="sidebar-caption">Operacion interna</p>

          <div className="role-list" aria-label="Roles del sistema">
            <span>Administracion</span>
            <span>Control stock</span>
            <span>Consulta</span>
          </div>
        </div>

        <nav className="side-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <strong>Pinval</strong>
          <span>Sistema interno para inventario, compras y trazabilidad</span>
        </div>
      </aside>

      <main className="content">
        <header className="page-header">
          <div className="page-title-group">
            <p className="eyebrow">Sistema de inventario</p>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <div className="page-header-actions">
            <div className="page-context-card" aria-label="Contexto de Pinval">
              <span className="page-context-tag">Pinval</span>
              <strong>SICD interno</strong>
              <p>Operacion centralizada</p>
            </div>
            <NavLink to="/login" className="secondary-action">
              Cambiar usuario
            </NavLink>
          </div>
        </header>

        <section className="page-body">{children}</section>
      </main>
    </div>
  );
}

export default AppLayout;
