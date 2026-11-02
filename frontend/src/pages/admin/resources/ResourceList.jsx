import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import Spinner from '../../../components/ui/Spinner';
import Badge from '../../../components/ui/Badge';
import Alert from '../../../components/ui/Alert';
import Modal from '../../../components/ui/Modal';
import Select from '../../../components/ui/Select';
import ResourceForm from './ResourceForm';

const typeLabels = { DOCUMENTO: 'Documento', PRESENTACION: 'Presentación', ENLACE: 'Enlace' };

const fileIcon = {
  DOCUMENTO: 'M7 21h10a2 2 0 002-2V9l-6-6H7a2 2 0 00-2 2v14a2 2 0 002 2zm5-14V3l5 5h-4a1 1 0 01-1-1z',
  PRESENTACION: 'M9 17V7a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 01-2 2h-2a2 2 0 01-2-2zM5 10h3v7H5zM16 12h3v5h-3z',
  ENLACE: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6v6M10 14L20 4',
};

export default function ResourceList() {
  const [resources, setResources] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [prefillCourse, setPrefillCourse] = useState('');

  const load = () => {
    setLoading(true);
    const requests = [api.get(`/resources${filter ? `?type=${filter}` : ''}`)];
    if (!courses.length) requests.push(api.get('/courses/manage/all'));
    Promise.all(requests)
      .then(([r, c]) => {
        setResources(r.data.data || []);
        if (c) setCourses(c.data.data || []);
      })
      .catch((e) => setError(e.response?.data?.message || 'Error al cargar los materiales.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleDelete = async (r) => {
    if (!window.confirm(`¿Eliminar el material "${r.title}"?`)) return;
    try {
      await api.delete(`/resources/${r.id}`);
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo eliminar el material.');
    }
  };

  const downloadFile = async (r) => {
    try {
      const resp = await api.get(`/resources/${r.id}/download`, { responseType: 'blob' });
      const ext = (r.fileUrl || '').split('.').pop() || 'file';
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${r.title}.${ext}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo descargar el archivo.');
    }
  };

  const openCreate = (courseId = '') => {
    setPrefillCourse(courseId);
    setShowCreate(true);
  };

  const byCourse = {};
  const sinCurso = [];
  for (const r of resources) {
    if (r.courseId) {
      if (!byCourse[r.courseId]) byCourse[r.courseId] = { course: r.course, items: [] };
      byCourse[r.courseId].items.push(r);
    } else {
      sinCurso.push(r);
    }
  }

  const secciones = Object.values(byCourse).sort((a, b) =>
    (a.course?.name || '').localeCompare(b.course?.name || '')
  );

  const cursosSinMateriales = courses
    .filter((c) => !byCourse[c.id])
    .sort((a, b) => a.name.localeCompare(b.name));

  const renderRow = (r) => (
    <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={fileIcon[r.type] || fileIcon.DOCUMENTO} />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-gray-800" title={r.title}>{r.title}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <Badge variant={r.type}>{typeLabels[r.type]}</Badge>
            {r.description && <span className="truncate text-xs text-gray-400">{r.description}</span>}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {r.type === 'ENLACE' ? (
          <a href={r.externalUrl} target="_blank" rel="noreferrer" className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 hover:bg-blue-200">Abrir</a>
        ) : (
          <button onClick={() => downloadFile(r)} className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 hover:bg-blue-200">Descargar</button>
        )}
        <button onClick={() => handleDelete(r)} className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200">Eliminar</button>
      </div>
    </li>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Materiales del aula extendida</h1>
        <p className="text-sm text-gray-500">
          Los materiales solo son visibles para quienes tengan la inscripción al curso aceptada.
        </p>
      </div>

      {error && <div className="mb-4"><Alert type="error" onClose={() => setError('')}>{error}</Alert></div>}

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="w-52">
          <Select
            label="Filtrar por tipo"
            options={[{ value: '', label: 'Todos' }, ...['DOCUMENTO', 'PRESENTACION', 'ENLACE'].map((t) => ({ value: t, label: typeLabels[t] }))]}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <button onClick={() => openCreate()} className="btn-primary">+ Subir material</button>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="space-y-8">
          {secciones.map(({ course, items }) => (
            <section key={course.id} className="card overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 px-5 py-4">
                <div>
                  <h2 className="font-bold text-gray-800">{course.name}</h2>
                  <p className="text-xs text-gray-500">{items.length} material(es) visible(s) en el aula extendida</p>
                </div>
                <button onClick={() => openCreate(course.id)} className="rounded bg-primary-100 px-2 py-1 text-xs font-medium text-primary-700 hover:bg-primary-200">
                  + Agregar material
                </button>
              </div>
              <ul className="space-y-2 p-4">{items.map((r) => renderRow(r))}</ul>
            </section>
          ))}

          {cursosSinMateriales.length > 0 && (
            <section className="card overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50 px-5 py-4">
                <h2 className="font-bold text-gray-800">Cursos sin materiales</h2>
                <p className="text-xs text-gray-500">Sube el primer archivo o enlace a estos cursos</p>
              </div>
              <ul className="space-y-2 p-4">
                {cursosSinMateriales.map((c) => (
                  <li key={c.id} className="flex items-center justify-between rounded-xl border border-dashed border-gray-200 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-700">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.duration || 'sin duración definida'}</p>
                    </div>
                    <button onClick={() => openCreate(c.id)} className="rounded bg-primary-100 px-2 py-1 text-xs font-medium text-primary-700 hover:bg-primary-200">
                      + Agregar material
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {sinCurso.length > 0 && (
            <section className="card overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50 px-5 py-4">
                <h2 className="font-bold text-gray-800">Sin curso</h2>
                <p className="text-xs text-gray-500">
                  Estos materiales no se muestran a ningún alumno. Asignales un curso.
                </p>
              </div>
              <ul className="space-y-2 p-4">{sinCurso.map((r) => renderRow(r))}</ul>
            </section>
          )}

          {secciones.length === 0 && sinCurso.length === 0 && cursosSinMateriales.length === 0 && (
            <p className="py-12 text-center text-sm text-gray-500">
              No hay cursos ni materiales. Crea un curso y sube su primer material.
            </p>
          )}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nuevo material" size="lg">
        <ResourceForm
          courses={courses}
          initialCourseId={prefillCourse}
          onSuccess={() => { setShowCreate(false); load(); }}
        />
      </Modal>
    </div>
  );
}