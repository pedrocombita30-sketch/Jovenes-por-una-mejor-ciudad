import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';

export default function Actividades() {
  const [page, setPage] = useState(null);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [temas, setTemas] = useState([]);

  useEffect(() => {
    api.get('/content/actividades').then((r) => setPage(r.data.data)).catch(() => {});

    api
      .get('/content/actividades-temas')
      .then((r) => {
        try {
          const items = JSON.parse(r.data.data?.content || '[]');
          setTemas(Array.isArray(items) ? items : []);
        } catch {
          setTemas([]);
        }
      })
      .catch(() => {});

    api
      .get('/content/actividades-realizadas')
      .then((r) => {
        let items = [];
        try {
          items = JSON.parse(r.data.data?.content || '[]');
        } catch {
          items = [];
        }
        setCompleted(Array.isArray(items) ? items : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h1 className="text-3xl font-bold sm:text-4xl">
            {page?.title || 'Actividades realizadas'}
          </h1>
          {page?.content && (
            <p className="mt-4 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-white/90">
              {page.content}
            </p>
          )}
        </div>
      </div>

      {temas.length > 0 && (
        <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
          <h2 className="mb-8 text-center text-2xl font-bold text-gray-800">Actividades</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {temas.map((t, i) => (
              <div key={t.id || `${t.title}-${i}`} className="card flex flex-col overflow-hidden p-0">
                {t.imageUrl && (
                  <div className="aspect-video w-full overflow-hidden bg-gray-100">
                    <img src={t.imageUrl} alt={t.title} className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="mb-2 text-lg font-bold text-primary-600">{t.title}</h3>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">{t.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 className="mb-2 text-center text-2xl font-bold text-gray-800">
          Actividades que hemos realizado
        </h2>
        <p className="mb-8 text-center text-sm text-gray-500">
          Aquí puedes conocer la trayectoria de la fundación.
        </p>

        {completed.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
            <p className="text-gray-500">
              Las actividades realizadas se publicarán muy pronto.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {completed.map((act, i) => (
              <button
                key={act.id || `${act.title}-${i}`}
                onClick={() => setSelected(act)}
                className="card group flex cursor-pointer flex-col overflow-hidden p-0 text-left transition-shadow hover:shadow-xl"
              >
                {act.imageUrl && (
                  <div className="aspect-video w-full overflow-hidden bg-gray-100">
                    <img
                      src={act.imageUrl}
                      alt={act.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="mb-2 text-lg font-bold text-primary-600">{act.title}</h3>
                  <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-gray-600">
                    {act.description}
                  </p>
                  <div className="mt-4 space-y-1 border-t border-gray-100 pt-3 text-xs text-gray-500">
                    {act.year && <p>{act.year}</p>}
                    {act.location && <p>{act.location}</p>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <Modal isOpen onClose={() => setSelected(null)} title={selected.title} size="lg">
          {selected.imageUrl && (
            <div className="mb-4 overflow-hidden rounded-xl">
              <img
                src={selected.imageUrl}
                alt={selected.title}
                className="max-h-96 w-full object-cover"
              />
            </div>
          )}
          <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
            {selected.description}
          </p>
          <div className="mt-4 space-y-1 border-t border-gray-100 pt-4 text-xs text-gray-500">
            {selected.year && <p>{selected.year}</p>}
            {selected.location && <p>{selected.location}</p>}
          </div>
        </Modal>
      )}
    </div>
  );
}