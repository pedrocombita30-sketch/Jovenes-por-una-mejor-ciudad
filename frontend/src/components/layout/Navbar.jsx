import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/', label: 'Inicio' },
  { to: '/quienes-somos', label: 'Quiénes Somos' },
  { to: '/temas', label: 'Temas' },
  { to: '/actividades', label: 'Actividades' },
  { to: '/cursos', label: 'Cursos' },
  { to: '/contacto', label: 'Contacto' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const adminPath = user && user.role !== 'CLIENTE' ? '/admin' : null;

  return (
    <header className="sticky top-0 z-40 bg-white/90 shadow-sm backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <img src="/logo.png" alt="Logo" className="h-9 w-9 rounded-full object-cover" />
          <div className="leading-tight">
            <span className="block text-sm font-extrabold text-primary-600">
              Fundación Jóvenes por una
            </span>
            <span className="block text-sm font-extrabold text-secondary-700">
              Mejor Ciudad
            </span>
          </div>
        </Link>

        <div className="hidden items-center gap-6 lg:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive ? 'text-primary-600' : 'text-gray-600 hover:text-primary-600'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <>
              {adminPath && (
                <Link to={adminPath} className="btn-secondary text-xs">
                  Panel de gestión
                </Link>
              )}
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                  {user.firstName[0]}
                  {user.lastName[0]}
                </div>
                <div className="hidden leading-tight md:block">
                  <span className="block text-xs font-semibold text-gray-700">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="block text-[10px] uppercase tracking-wide text-gray-400">
                    {user.role}
                  </span>
                </div>
              </div>
              <button onClick={handleLogout} className="btn-secondary text-xs">
                Salir
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-primary text-xs">
              Ingresar
            </Link>
          )}
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
          aria-label="Menú"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="border-t border-gray-100 bg-white px-4 py-3 lg:hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <div className="mt-3 border-t border-gray-100 pt-3">
            {user ? (
              <div className="flex flex-col gap-2">
                {adminPath && (
                  <Link to={adminPath} onClick={() => setOpen(false)} className="btn-secondary text-sm">
                    Panel de gestión
                  </Link>
                )}
                <button onClick={handleLogout} className="btn-secondary text-sm">
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)} className="btn-primary w-full text-sm">
                Ingresar
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}