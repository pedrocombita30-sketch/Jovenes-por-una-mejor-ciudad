import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const menus = [
  {
    section: 'Gestión',
    items: [
      { to: '/admin', label: 'Dashboard', icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' },
      { to: '/admin/usuarios', label: 'Usuarios', icon: 'M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z', roles: ['ADMIN'] },
      { to: '/admin/clientes', label: 'Clientes', icon: 'M16 11c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3zm-8 0c1.7 0 3-1.3 3-3S9.7 5 8 5 5 6.3 5 8s1.3 3 3 3zm0 2c-2.3 0-7 1.2-7 3.5V20h14v-3.5C15 13.2 10.3 12 8 12zm8 0c-.3 0-.6 0-1 .1V20h2v-3.5c0-1.2-.4-2.4-1-3.5z' },
      { to: '/admin/cursos', label: 'Cursos', icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l9 5-9 5-9-5 9-5zm0-9v18' },
      { to: '/admin/inscripciones', label: 'Inscripciones', icon: 'M9 12l2 2 4-4m7 2a9 9 0 11-18 0 9 9 0 0118 0z' },
      { to: '/admin/recursos', label: 'Materiales', icon: 'M7 4h10a3 3 0 013 3v10a3 3 0 01-3 3H7a3 3 0 01-3-3V7a3 3 0 013-3zm0 8h10M7 12v4M11 12v5' },
      { to: '/admin/informacion-corporativa', label: 'Información Corporativa', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    ],
  },
  {
    section: 'Comunicación',
    items: [
      { to: '/admin/conversaciones', label: 'Chatbot', icon: 'M21 11.5a8.4 8.4 0 01-9 8.4 8.6 8.6 0 01-3.1-.6L3 21l1.7-5.8A8.4 8.4 0 014.5 5.1a8.4 8.4 0 016.5-3 8.4 8.4 0 0110 9.4z' },
      { to: '/admin/contenido', label: 'Contenido web', icon: 'M10 16L6 12l4-4M14 8l4 4-4 4M12 3a9 9 0 100 18 9 9 0 000-18z' },
    ],
  },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-gray-900 text-gray-200 transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2 border-b border-gray-800 bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-600 px-5 py-4">
          <img src="/logo.png" alt="Logo" className="h-8 w-8 rounded-full object-cover" />
          <div className="text-sm font-bold text-white drop-shadow-sm">
            Fundación Jóvenes por una<br />Mejor Ciudad
          </div>
        </div>

        <div className="flex items-center gap-3 border-b border-gray-800 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-400">{user?.role}</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {menus.map((menu) => (
            <div key={menu.section} className="mb-5">
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-secondary-400">
                {menu.section}
              </p>
              {menu.items
                .filter((item) => !item.roles || item.roles.includes(user?.role))
                .map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`
                  }
                >
                  <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d={item.icon} />
                  </svg>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="border-t border-gray-800 p-4">
          <a href="/" className="mb-2 block rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white">
            Ver sitio público
          </a>
          <button onClick={handleLogout} className="w-full rounded-lg bg-gray-800 px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-700">
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}