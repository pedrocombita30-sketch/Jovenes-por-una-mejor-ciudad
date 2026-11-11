import { Link } from 'react-router-dom';
import SocialLinks from './SocialLinks';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="h-1 w-full bg-gradient-to-r from-primary-500 via-primary-400 to-secondary-500" />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="h-8 w-8 rounded-full object-cover" />
              <div className="text-sm font-bold text-white">
                Fundación Jóvenes por una<br />Mejor Ciudad
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-400">
              Fundación JIMC
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Enlaces</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-primary-400">Inicio</Link></li>
              <li><Link to="/quienes-somos" className="hover:text-primary-400">Quiénes Somos</Link></li>
              <li><Link to="/actividades" className="hover:text-primary-400">Actividades</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Recursos</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/cursos" className="hover:text-primary-400">Cursos</Link></li>
              <li><Link to="/contacto" className="hover:text-primary-400">Contacto</Link></li>
              <li><Link to="/login" className="hover:text-primary-400">Acceso de usuarios</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Más Información</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/informacion-corporativa" className="hover:text-primary-400">Información corporativa</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center border-t border-gray-800 pt-6">
          <h4 className="mb-3 text-sm font-semibold text-white">Síguenos</h4>
          <SocialLinks />
        </div>
        <div className="mt-8 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Fundación Jóvenes por una Mejor Ciudad. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}