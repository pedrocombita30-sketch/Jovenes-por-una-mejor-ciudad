import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Alert from '../../../components/ui/Alert';

// Crea o edita un material. Si se indica curso, el material queda asignado a un módulo.
export default function ResourceForm({
  courses,
  initialCourseId = '',
  initialModuleId = '',
  resource = null,
  onSuccess,
}) {
  const [form, setForm] = useState({
    title: resource?.title || '',
    description: resource?.description || '',
    type: resource?.type || 'DOCUMENTO',
    externalUrl: resource?.externalUrl || '',
    courseId: resource?.courseId ? String(resource.courseId) : String(initialCourseId || ''),
    moduleId: resource?.moduleId ? String(resource.moduleId) : String(initialModuleId || ''),
  });
  const [modules, setModules] = useState([]);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Carga los módulos del curso seleccionado y garantiza un módulo válido.
  useEffect(() => {
    if (!form.courseId) {
      setModules([]);
      return;
    }
    api
      .get(`/courses/manage/${form.courseId}/structure`)
      .then((r) => {
        const list = r.data.data.modules || [];
        setModules(list);
        setForm((f) =>
          list.some((m) => String(m.id) === f.moduleId)
            ? f
            : { ...f, moduleId: list[0] ? String(list[0].id) : '' }
        );
      })
      .catch(() => setModules([]));
  }, [form.courseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.courseId && !form.moduleId) {
      setError('Selecciona el módulo al que pertenece el material.');
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('externalUrl', form.externalUrl);
      fd.append('courseId', form.courseId);
      if (form.courseId) fd.append('moduleId', form.moduleId);
      if (file) fd.append('file', file);

      if (resource) {
        await api.put(`/resources/${resource.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        fd.append('type', form.type);
        await api.post('/resources', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar el material.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

      <Input
        label="Título"
        required
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />

      <div>
        <label className="label-field">Descripción</label>
        <textarea
          className="input-field"
          rows="2"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      {!resource && (
        <Select
          label="Tipo de recurso"
          options={['DOCUMENTO', 'PRESENTACION', 'ENLACE'].map((t) => ({
            value: t,
            label: { DOCUMENTO: 'Documento', PRESENTACION: 'Presentación', ENLACE: 'Enlace externo' }[t],
          }))}
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value, externalUrl: '' })}
        />
      )}

      {form.type === 'ENLACE' ? (
        <Input
          label="Enlace externo"
          type="url"
          required={!resource}
          placeholder="https://..."
          value={form.externalUrl}
          onChange={(e) => setForm({ ...form, externalUrl: e.target.value })}
        />
      ) : (
        <div>
          <label className="label-field">
            {resource ? 'Reemplazar archivo (opcional)' : 'Archivo'}
          </label>
          <input
            type="file"
            required={!resource}
            onChange={(e) => setFile(e.target.files[0])}
            className="input-field file:mr-3 file:rounded file:border-0 file:bg-primary-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-primary-700"
          />
        </div>
      )}

      <Select
        label="Curso"
        options={
          [{ value: '', label: 'Sin curso (no visible en el aula)' }]
            .concat(
              [...courses]
                .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                .map((c) => ({ value: String(c.id), label: c.name }))
            )
        }
        value={form.courseId}
        onChange={(e) => setForm({ ...form, courseId: e.target.value, moduleId: '' })}
      />

      {form.courseId && (
        <Select
          label="Módulo"
          options={modules.map((m) => ({ value: String(m.id), label: `Módulo ${m.position}: ${m.title}` }))}
          value={form.moduleId}
          onChange={(e) => setForm({ ...form, moduleId: e.target.value })}
        />
      )}

      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Guardando...' : 'Guardar material'}
        </button>
      </div>
    </form>
  );
}
