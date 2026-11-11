import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Spinner from '../../components/ui/Spinner';

function formatSize(bytes) {
  if (!bytes) return '';
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function InformacionCorporativa() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/corporate')
      .then((r) => setDocuments(r.data.data || []))
      .catch((e) => setError(e.response?.data?.message || 'No se pudieron cargar los documentos.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h1 className="text-3xl font-bold sm:text-4xl">Información Corporativa</h1>
          <p className="mt-3 max-w-2xl text-sm text-white/90">
            Documentos oficiales y publicaciones de Fundación Jóvenes por una Mejor Ciudad.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {loading ? (
          <Spinner />
        ) : error ? (
          <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>
        ) : documents.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-500">
            Todavía no hay documentos publicados.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>

                <h3 className="mb-2 text-base font-bold text-primary-600">{doc.title}</h3>

                {doc.description && (
                  <p className="mb-4 flex-1 text-sm leading-relaxed text-gray-600">{doc.description}</p>
                )}

                <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4">
                  <div className="text-xs text-gray-500">
                    <p>{formatDate(doc.createdAt)}</p>
                    {doc.fileSize ? <p>{formatSize(doc.fileSize)}</p> : null}
                  </div>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={doc.originalName || undefined}
                    className="btn-primary text-xs"
                  >
                    Ver archivo
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}