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
  { to: '/data-quality', label: 'Carga Excel' },
  { to: '/products', label: 'Productos' },
  { to: '/inventory', label: 'Inventario' },
  { to: '/purchases', label: 'Entradas' },
  { to: '/sales', label: 'Ventas POS' },
  { to: '/movements', label: 'Movimientos' },
  { to: '/alerts', label: 'Alertas' },
  { to: '/suppliers', label: 'Proveedores' },
  { to: '/customers', label: 'Clientes' },
  { to: '/reports', label: 'Reportes' },
];

function AppLayout({ title, description, children }: AppLayoutProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Navegacion principal">
        <div className="brand">
          <span className="brand-mark">P</span>
          <div>
            <strong>SICD Pinval</strong>
            <span>Control de inventario</span>
          </div>
        </div>

        <div className="role-list" aria-label="Roles del sistema">
          <span>Administracion</span>
          <span>Control stock</span>
          <span>Consulta</span>
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
      </aside>

      <main className="content">
        <header className="page-header">
          <div>
            <p className="eyebrow">Sistema de inventario</p>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <NavLink to="/login" className="secondary-action">
            Cambiar usuario
          </NavLink>
        </header>

        {children}
      </main>
    </div>
  );
}

export default AppLayout;
