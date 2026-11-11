import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Modal from '../../components/ui/Modal';
import { ordenarActividades } from '../../utils/actividades';

// Número máximo de actividades realizadas que se muestran en el inicio.
const MAX_INICIO = 9;

export default function Home() {
  const [content, setContent] = useState(null);
  const [completed, setCompleted] = useState([]);
  const [selectedAct, setSelectedAct] = useState(null);

  useEffect(() => {
    api.get('/content/inicio').then((r) => setContent(r.data.data)).catch(() => {});
    api
      .get('/content/actividades-realizadas')
      .then((r) => {
        const page = r.data.data;
        let items = [];
        try { items = JSON.parse(page?.content || '[]'); } catch { items = []; }
        setCompleted(Array.isArray(items) ? items : []);
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-600 px-4 py-20 text-center text-white sm:px-6">
        <div className="relative z-10 mx-auto max-w-4xl">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Fundación Jóvenes por una<br />
            <span className="text-secondary-200">Mejor Ciudad</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/90">
            {content?.content ||
              'Organización juvenil dedicada a transformar nuestra ciudad a través de la participación ciudadana, la educación y el voluntariado social.'}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/actividades" className="rounded-lg bg-white px-6 py-3 font-semibold text-primary-700 shadow-lg transition-colors hover:bg-gray-50">
              Ver actividades
            </Link>
            <Link to="/contacto" className="rounded-lg border-2 border-white px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10">
              Contáctanos
            </Link>
          </div>
        </div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxLjUiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wOCkiLz48L3N2Zz4=')] opacity-60" />
      </section>


      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="mb-3 text-center text-2xl font-bold text-gray-800">Actividades que hemos realizado</h2>
        <p className="mb-8 text-center text-sm text-gray-500">
          Nuestra trayectoria en la comunidad.
        </p>

        {completed.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
            <p className="text-gray-500">Aquí mostraremos las actividades que ya hemos realizado.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ordenarActividades(completed).slice(0, MAX_INICIO).map((act) => (
              <button
                key={act.id}
                onClick={() => setSelectedAct(act)}
                className="card flex cursor-pointer flex-col p-5 text-left transition-shadow hover:shadow-lg"
              >
                {act.imageUrl && (
                  <div className="mb-3 aspect-video overflow-hidden rounded-xl">
                    <img
                      src={act.imageUrl}
                      alt={act.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <h3 className="mb-1 text-lg font-semibold text-gray-800">{act.title}</h3>
                <p className="line-clamp-2 flex-1 text-sm text-gray-500">{act.description}</p>
                <div className="mt-4 space-y-1 text-xs text-gray-500">
                  <p>📅 {act.year}</p>
                  {act.location && <p>📍 {act.location}</p>}
                </div>
              </button>
            ))}
          </div>
        )}
        {completed.length > MAX_INICIO && (
          <div className="mt-10 text-center">
            <Link to="/actividades" className="btn-secondary">
              Ver todas las actividades
            </Link>
          </div>
        )}
      </section>


      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <div className="rounded-2xl bg-gradient-to-r from-primary-600 to-secondary-600 p-8 shadow-lg sm:p-10">
          <h2 className="mb-4 text-2xl font-bold text-white">¿Quieres participar?</h2>
          <p className="mb-8 text-white/90">Regístrate en nuestra plataforma y forma parte del cambio.</p>
          <Link to="/registro" className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-primary-700 shadow-lg transition-colors hover:bg-gray-50">
            Crear mi cuenta
          </Link>
        </div>
      </section>

      {selectedAct && (
        <Modal isOpen onClose={() => setSelectedAct(null)} title={selectedAct.title} size="lg">
          {selectedAct.imageUrl && (
            <div className="mb-4 overflow-hidden rounded-xl">
              <img
                src={selectedAct.imageUrl}
                alt={selectedAct.title}
                className="max-h-96 w-full object-cover"
              />
            </div>
          )}
          <p className="mb-4 whitespace-pre-line text-sm leading-relaxed text-gray-600">
            {selectedAct.description}
          </p>
          <div className="space-y-1 border-t border-gray-100 pt-4 text-xs text-gray-500">
            <p>📅 {selectedAct.year}</p>
            {selectedAct.location && <p>📍 {selectedAct.location}</p>}
          </div>
        </Modal>
      )}
    </div>
  );
}
