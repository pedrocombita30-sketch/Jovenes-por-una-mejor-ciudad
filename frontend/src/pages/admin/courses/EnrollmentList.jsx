import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import Spinner from '../../../components/ui/Spinner';
import Alert from '../../../components/ui/Alert';
import Select from '../../../components/ui/Select';

const statusConfig = {
  PENDIENTE: { label: 'Pendiente', chip: 'bg-amber-100 text-amber-800' },
  ACEPTADA: { label: 'Aprobada', chip: 'bg-blue-100 text-blue-800' },
  RECHAZADA: { label: 'Rechazada', chip: 'bg-red-100 text-red-700' },
};

export default function EnrollmentList() {
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('PENDIENTE');
  const [working, setWorking] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [e, c] = await Promise.all([
        api.get(`/courses/enrollments/all${filter ? `?status=${filter}` : ''}`),
        api.get('/courses/manage/all'),
      ]);
      setEnrollments(e.data.data || []);
      setCourses(c.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron cargar las inscripciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter]);

  const review = async (enrollment, status) => {
    if (status === 'RECHAZADA' && !window.confirm(`¿Rechazar la inscripción de ${enrollment.user.firstName} ${enrollment.user.lastName}?`)) {
      return;
    }

    setWorking(enrollment.id);
    setError('');
    setSuccess('');
    try {
      const r = await api.put(`/courses/enrollments/${enrollment.id}`, { status });
      setSuccess(r.data.message || 'Inscripción actualizada.');
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo actualizar la inscripción.');
    } finally {
      setWorking(null);
    }
  };

  const handleDelete = async (enrollment) => {
    if (!window.confirm(`¿Eliminar la inscripción de ${enrollment.user.firstName} ${enrollment.user.lastName}?`)) return;
    try {
      await api.delete(`/courses/enrollments/${enrollment.id}`);
      setSuccess('Inscripción eliminada.');
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo eliminar.');
    }
  };

  const counts = courses.reduce(
    (acc, c) => {
      acc.pendientes += c.pendingCount || 0;
      return acc;
    },
    { pendientes: 0 }
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inscripciones</h1>
          <p className="text-sm text-gray-500">
            Aprueba o rechaza las solicitudes. Solo las aprobadas accede al aula extendida.
          </p>
          {counts.pendientes > 0 && (
            <p className="mt-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              {counts.pendientes} solicitud(es) esperando respuesta
            </p>
          )}
        </div>

        <div className="w-52">
          <Select
            label="Filtrar por estado"
            options={[
              { value: 'PENDIENTE', label: 'Pendientes' },
              { value: 'ACEPTADA', label: 'Aprobadas' },
              { value: 'RECHAZADA', label: 'Rechazadas' },
              { value: '', label: 'Todas' },
            ]}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="mb-4"><Alert type="error" onClose={() => setError('')}>{error}</Alert></div>}
      {success && <div className="mb-4"><Alert type="success" onClose={() => setSuccess('')}>{success}</Alert></div>}

      {loading ? (
        <Spinner />
      ) : enrollments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
          <p className="text-gray-500">
            {filter === 'PENDIENTE'
              ? 'No hay solicitudes pendientes.'
              : 'No hay inscripciones con este estado.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {enrollments.map((e) => {
            const cfg = statusConfig[e.status] || statusConfig.PENDIENTE;
            return (
              <div key={e.id} className="card flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${cfg.chip}`}>
                      {cfg.label}
                    </span>
                    <span className="text-xs text-gray-400">
                      Solicitada el{' '}
                      {new Date(e.createdAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-800">
                    {e.user.firstName} {e.user.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{e.user.email}</p>
                  <p className="mt-1 text-sm text-primary-700">
                    Curso: <span className="font-semibold">{e.course?.name || 'eliminado'}</span>
                  </p>
                  {e.reviewer && (
                    <p className="mt-1 text-xs text-gray-400">
                      Revisada por {e.reviewer.firstName} {e.reviewer.lastName}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  {e.status !== 'ACEPTADA' && (
                    <button
                      onClick={() => review(e, 'ACEPTADA')}
                      disabled={working === e.id}
                      className="btn-primary text-xs"
                    >
                      Aceptar
                    </button>
                  )}
                  {e.status !== 'RECHAZADA' && (
                    <button
                      onClick={() => review(e, 'RECHAZADA')}
                      disabled={working === e.id}
                      className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                    >
                      Rechazar
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(e)}
                    className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}