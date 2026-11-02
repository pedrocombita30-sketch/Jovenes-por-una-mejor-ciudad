import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import Spinner from '../../../components/ui/Spinner';
import { useAuth } from '../../../context/AuthContext';

function formatSize(bytes) {
  if (!bytes) return '';
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

const EMPTY = { title: '', description: '', file: null };

export default function CorporateDocuments() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const canEdit = user?.role === 'ADMIN' || user?.role === 'COLABORADOR';

  const load = async () => {
    try {
      const r = await api.get('/corporate');
      setDocuments(r.data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudieron cargar los documentos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const reset = () => {
    setForm(EMPTY);
    setEditingId(null);
    setMessage('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('El título es obligatorio.');
      return;
    }
    if (!editingId && !form.file) {
      setError('Debes seleccionar un archivo.');
      return;
    }

    setSaving(true);
    setMessage('');
    setError('');

    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('description', form.description);
    if (form.file) fd.append('file', form.file);

    try {
      if (editingId) {
        await api.put(`/corporate/${editingId}`, fd);
        setMessage('Documento actualizado.');
      } else {
        await api.post('/corporate', fd);
        setMessage('Documento publicado.');
      }
      reset();
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo guardar el documento.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (doc) => {
    setEditingId(doc.id);
    setForm({ title: doc.title, description: doc.description || '', file: null });
    setMessage('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`¿Eliminar "${doc.title}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/corporate/${doc.id}`);
      if (editingId === doc.id) reset();
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo eliminar.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Información Corporativa</h1>
        <p className="mt-1 text-sm text-gray-500">
          Sube los documentos oficiales que se publicarán en el sitio web.
        </p>
      </div>

      {canEdit && (
        <form onSubmit={handleSubmit} className="card space-y-4 p-6">
          <h2 className="text-lg font-bold text-gray-800">
            {editingId ? 'Editar documento' : 'Subir nuevo documento'}
          </h2>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Título *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ej. Acta de fundación 2026"
              className="input-field"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Descripción <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Breve contexto sobre el documento"
              className="input-field"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Archivo {editingId ? '' : '*'}{' '}
              <span className="font-normal text-gray-400">(PDF, Word, Excel, imágenes, ZIP — máx. 25 MB)</span>
            </label>
            <input
              type="file"
              onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })}
              className="input-field"
            />
            {form.file && <p className="mt-1 text-xs text-gray-500">Seleccionado: {form.file.name}</p>}
          </div>

          {message && <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">{message}</p>}
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Publicar documento'}
            </button>
            {editingId && (
              <button type="button" onClick={reset} className="btn-secondary">
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      <div className="card p-6">
        <h2 className="mb-4 text-lg font-bold text-gray-800">
          Documentos publicados ({documents.length})
        </h2>

        {loading ? (
          <Spinner />
        ) : documents.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">
            Todavía no hay documentos publicados.
          </p>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-800">{doc.title}</p>
                  {doc.description && <p className="mt-1 text-sm text-gray-600">{doc.description}</p>}
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(doc.createdAt).toLocaleDateString('es-ES')}
                    {doc.fileSize ? ` · ${formatSize(doc.fileSize)}` : ''}
                    {doc.originalName ? ` · ${doc.originalName}` : ''}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs">
                    Ver
                  </a>
                  {canEdit && (
                    <>
                      <button onClick={() => startEdit(doc)} className="btn-secondary text-xs">
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(doc)}
                        className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}