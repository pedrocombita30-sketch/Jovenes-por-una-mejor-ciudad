import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api/axios';
import Spinner from '../../../components/ui/Spinner';
import Alert from '../../../components/ui/Alert';
import Modal from '../../../components/ui/Modal';

const EMPTY = { name: '', description: '', duration: '', modality: 'PRESENCIAL', active: true };

const modalityLabels = {
  PRESENCIAL: 'Presencial',
  VIRTUAL: 'Virtual',
  HIBRIDA: 'Híbrida',
};

// Módulos por defecto de un curso nuevo. La numeración visible empieza en 0.
const blankModules = (count) =>
  Array.from({ length: count }, () => ({ id: null, number: null, title: '', description: '' }));

export default function CourseList() {
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/courses/manage/all');
      setCourses(r.data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudieron cargar los cursos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setForm(EMPTY);
    setModules(blankModules(3));
    setEditingId(null);
    setError('');
    setSuccess('');
    setShowForm(true);
  };

  const openEdit = (course) => {
    setForm({
      name: course.name,
      description: course.description || '',
      duration: course.duration || '',
      modality: course.modality || 'PRESENCIAL',
      active: course.active !== false,
    });
    setModules(
      (course.modules || []).map((m) => ({
        id: m.id,
        number: m.position - 1,
        title: m.title || '',
        description: m.description || '',
      }))
    );
    setEditingId(course.id);
    setError('');
    setSuccess('');
    setShowForm(true);
  };

  const updateModule = (index, field, value) =>
    setModules((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));

  const addModule = () => setModules((prev) => [...prev, { id: null, number: null, title: '', description: '' }]);

  const removeModule = (index) => setModules((prev) => prev.filter((_, i) => i !== index));

  // Los módulos existentes conservan su número; los nuevos continúan la secuencia.
  const lastExistingNumber = modules.reduce((max, m) => (m.id ? Math.max(max, m.number) : max), -1);
  const numberedModules = (() => {
    let next = lastExistingNumber;
    return modules.map((m) => {
      if (m.id) return { ...m, shownNumber: m.number };
      next += 1;
      return { ...m, shownNumber: next };
    });
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('El nombre del curso es obligatorio.');
      return;
    }

    setSaving(true);
    setError('');
    const payload = {
      ...form,
      modules: modules.map((m) => ({ id: m.id, title: m.title, description: m.description })),
    };

    try {
      if (editingId) {
        await api.put(`/courses/${editingId}`, payload);
        setSuccess('Curso actualizado.');
      } else {
        await api.post('/courses', payload);
        setSuccess('Curso creado.');
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar el curso.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (course) => {
    try {
      await api.put(`/courses/${course.id}`, { active: !course.active });
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo actualizar el curso.');
    }
  };

  const handleDelete = async (course) => {
    const msg =
      course.pendingCount > 0
        ? `¿Eliminar "${course.name}"? Tiene ${course.pendingCount} inscripción(es) pendiente(s) que también se borrarán.`
        : `¿Eliminar "${course.name}"? Sus materiales y inscripciones también se borrarán.`;
    if (!window.confirm(msg)) return;

    try {
      await api.delete(`/courses/${course.id}`);
      setSuccess('Curso eliminado.');
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo eliminar el curso.');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cursos</h1>
          <p className="text-sm text-gray-500">
            Programas publicados en el sitio web. Solo los cursos activos admiten inscripciones.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          + Crear curso
        </button>
      </div>

      {error && <div className="mb-4"><Alert type="error" onClose={() => setError('')}>{error}</Alert></div>}
      {success && <div className="mb-4"><Alert type="success" onClose={() => setSuccess('')}>{success}</Alert></div>}

      {loading ? (
        <Spinner />
      ) : courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
          <p className="text-gray-500">Todavía no hay cursos creados.</p>
          <button onClick={openCreate} className="btn-primary mt-4">
            Crear el primero
          </button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <div key={course.id} className={`card flex flex-col p-5 ${course.active ? '' : 'opacity-60'}`}>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary-700">
                  {modalityLabels[course.modality] || course.modality}
                </span>
                {!course.active && (
                  <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-[11px] font-semibold uppercase text-gray-600">
                    Inactivo
                  </span>
                )}
              </div>

              <h3 className="text-lg font-bold text-gray-800">{course.name}</h3>
              <p className="mt-1 line-clamp-3 flex-1 text-sm text-gray-500">{course.description}</p>

              <div className="mt-4 space-y-1 border-t border-gray-100 pt-3 text-xs text-gray-500">
                <p>Duracion: {course.duration || 'sin definir'}</p>
                <p>
                  {course._count?.resources ?? 0} material(es) · {course.acceptedCount} inscrito(s) ·{' '}
                  {course.pendingCount} pendiente(s)
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link to={`/admin/cursos/${course.id}/modulos`} className="btn-primary w-full text-center text-xs">
                  Módulos y cuestionarios
                </Link>
                <button onClick={() => openEdit(course)} className="btn-secondary flex-1 text-xs">
                  Editar
                </button>
                <button onClick={() => toggleActive(course)} className="btn-secondary flex-1 text-xs">
                  {course.active ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  onClick={() => handleDelete(course)}
                  className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Editar curso' : 'Nuevo curso'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Nombre del curso *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej. Liderazgo Juvenil"
              className="input-field"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Informacion / descripcion
            </label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="De que trata el curso, a quien va dirigido, que se aprende"
              className="input-field"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Duracion</label>
              <input
                type="text"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                placeholder="Ej. 40 horas (8 semanas)"
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Modalidad</label>
              <select
                value={form.modality}
                onChange={(e) => setForm({ ...form, modality: e.target.value })}
                className="input-field"
              >
                <option value="PRESENCIAL">Presencial</option>
                <option value="VIRTUAL">Virtual</option>
                <option value="HIBRIDA">Hibrida</option>
              </select>
            </div>
          </div>

          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-gray-700">Módulos del curso</span>
              <span className="text-xs text-gray-500">
                Los módulos existentes no se eliminan para conservar el progreso de los alumnos.
              </span>
            </div>
            <div className="space-y-3">
              {numberedModules.map((m, index) => (
                <div key={m.id ?? `nuevo-${index}`} className="rounded-lg border border-gray-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Módulo {m.shownNumber}
                      {m.id ? '' : ' (nuevo)'}
                    </span>
                    {!m.id && (
                      <button
                        type="button"
                        onClick={() => removeModule(index)}
                        className="text-xs font-semibold text-red-600"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={m.title}
                    onChange={(e) => updateModule(index, 'title', e.target.value)}
                    placeholder={`Título del Módulo ${m.shownNumber}`}
                    className="input-field mb-2"
                  />
                  <textarea
                    rows={2}
                    value={m.description}
                    onChange={(e) => updateModule(index, 'description', e.target.value)}
                    placeholder="Descripción del módulo (opcional)"
                    className="input-field"
                  />
                </div>
              ))}
            </div>
            <button type="button" onClick={addModule} className="mt-3 text-xs font-semibold text-primary-600 hover:text-primary-700">
              + Agregar módulo
            </button>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            Curso activo (visible y abierto a inscripciones)
          </label>

          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear curso'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}