import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Spinner from '../../components/ui/Spinner';

const TEMAS = [
  {
    id: 'social',
    title: 'Social',
    description:
      'Promover la inclusión, la equidad y el bienestar emocional de las comunidades vulnerables.',
  },
  {
    id: 'ambiental',
    title: 'Ambiental',
    description:
      'Fomentar la conciencia ecológica y la acción ambiental desde la juventud.',
  },
  {
    id: 'deportivo',
    title: 'Deportivo',
    description:
      'Utilizar el deporte como herramienta de integración, disciplina y liderazgo.',
  },
  {
    id: 'liderazgo',
    title: 'Liderazgo y democracia',
    description:
      'Formar jóvenes líderes comprometidos con la participación ciudadana y la transformación social.',
  },
  {
    id: 'emprendimientos',
    title: 'Emprendimientos',
    description:
      'Impulsar la creación y fortalecimiento de ideas de negocio sostenibles lideradas por jóvenes.',
  },
  {
    id: 'educacion',
    title: 'Educación',
    description:
      'Fortalecer las competencias académicas y socioemocionales de los jóvenes mediante estrategias educativas inclusivas.',
  },
];

const INTRO =
  'En Jóvenes por una Mejor Ciudad creemos que el verdadero cambio nace de una juventud formada, consciente y comprometida con su entorno. Por eso, abordamos de manera integral seis temas fundamentales: liderazgo juvenil, educación, desarrollo social, deporte, medio ambiente y emprendimiento, que se conectan entre sí y fortalecen la transformación de nuestras comunidades.';

export default function Temas() {
  const [images, setImages] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/content/temas')
      .then((r) => {
        try {
          const data = JSON.parse(r.data.data?.content || '{}');
          setImages(data && typeof data === 'object' ? data : {});
        } catch {
          setImages({});
        }
      })
      .catch(() => setImages({}))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h1 className="mb-6 text-3xl font-bold text-gray-800">Temas</h1>
        <p className="whitespace-pre-wrap leading-relaxed text-gray-600">{INTRO}</p>
      </div>

      <div className="bg-gray-100 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {TEMAS.map((tema) => (
              <div
                key={tema.id}
                className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-lg"
              >
                {images[tema.id] ? (
                  <img
                    src={images[tema.id]}
                    alt={tema.title}
                    className="h-56 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-56 w-full items-center justify-center bg-gray-200 text-sm text-gray-500">
                    Sin imagen
                  </div>
                )}
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="mb-3 text-lg font-bold text-primary-600">{tema.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-600">{tema.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}