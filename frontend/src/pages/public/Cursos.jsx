import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';

const modalityLabels = {
  PRESENCIAL: 'Presencial',
  VIRTUAL: 'Virtual',
  HIBRIDA: 'Híbrida',
};

const statusLabels = {
  PENDIENTE: 'Solicitud pendiente',
  ACEPTADA: 'Inscripción aprobada',
  RECHAZADA: 'Solicitud rechazada',
};

const statusStyles = {
  PENDIENTE: 'bg-amber-100 text-amber-800',
  ACEPTADA: 'bg-blue-100 text-blue-800',
  RECHAZADA: 'bg-red-100 text-red-700',
};

const moduleStatusStyles = {
  BLOQUEADO: 'bg-gray-100 text-gray-500',
  EN_PROGRESO: 'bg-blue-100 text-blue-800',
  PENDIENTE_CUESTIONARIO: 'bg-amber-100 text-amber-800',
  COMPLETADO: 'bg-green-100 text-green-800',
  SIN_CONTENIDO: 'bg-gray-100 text-gray-600',
};

const moduleStatusLabels = {
  BLOQUEADO: 'Bloqueado',
  EN_PROGRESO: 'En progreso',
  PENDIENTE_CUESTIONARIO: 'Pendiente de cuestionario',
  COMPLETADO: 'Completado',
  SIN_CONTENIDO: 'Sin contenido',
};

function AulaExtendida({ courses }) {
  if (courses.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
        <h3 className="text-lg font-semibold text-gray-700">Aún no tienes cursos aprobados</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
          Cuando un colaborador acepte tu inscripción a un curso, aquí aparecerá su aula con los
          módulos, materiales y cuestionarios.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <article key={course.courseId} className="card flex flex-col p-6">
          <h3 className="text-lg font-bold text-gray-800">{course.name}</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            {course.duration ? `${course.duration} · ` : ''}
            {modalityLabels[course.modality] || course.modality}
          </p>

          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs font-semibold text-gray-600">
              <span>Progreso general</span>
              <span>{course.overall.finished ? 'Curso finalizado' : `${course.overall.percent}%`}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-primary-600 transition-all"
                style={{ width: `${course.overall.percent}%` }}
              />
            </div>
          </div>

          <ul className="mt-4 space-y-1.5">
            {course.modules.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate text-gray-700">
                  {m.number}. {m.title}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 font-semibold ${moduleStatusStyles[m.status]}`}
                >
                  {moduleStatusLabels[m.status]}
                </span>
              </li>
            ))}
          </ul>

          <Link
            to={`/aula/${course.courseId}`}
            className="btn-primary mt-5 w-full text-center text-sm"
          >
            Entrar al aula
          </Link>
        </article>
      ))}
    </div>
  );
}

export default function Cursos() {
  const { user } = useAuth();

  const [courses, setCourses] = useState([]);
  const [classroom, setClassroom] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [working, setWorking] = useState(null);
  const [detail, setDetail] = useState(null);

  const load = async () => {
    try {
      const r = await api.get('/courses');
      setCourses(r.data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudieron cargar los cursos.');
    }

    if (user?.id) {
      try {
        const r = await api.get('/courses/mine/classroom');
        setClassroom(r.data.data || []);
      } catch {
        setClassroom([]);
      }
    } else {
      setClassroom([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  const handleEnroll = async (course) => {
    setWorking(course.id);
    setError('');
    setInfo('');
    try {
      const r = await api.post(`/courses/${course.id}/enroll`);
      setInfo(r.data.message || 'Solicitud enviada.');
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo enviar la solicitud.');
    } finally {
      setWorking(null);
    }
  };

  const handleCancel = async (course) => {
    if (!window.confirm(`¿Cancelar tu inscripción a "${course.name}"?`)) return;
    setWorking(course.id);
    setError('');
    setInfo('');
    try {
      const r = await api.delete(`/courses/${course.id}/enroll`);
      setInfo(r.data.message || 'Inscripción cancelada.');
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo cancelar.');
    } finally {
      setWorking(null);
    }
  };

  if (loading) {
    return (
      <div className="py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-secondary-600 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary-200">
            Formación
          </p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Cursos</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/90">
            Programas de formación para jóvenes de la comunidad. Solicita tu inscripción;
            un colaborador la revisará y, al aceptarla, podrás acceder al aula del curso con sus
            módulos, materiales y cuestionarios.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {info && (
          <div className="mb-6">
            <Alert type="success" onClose={() => setInfo('')}>{info}</Alert>
          </div>
        )}
        {error && (
          <div className="mb-6">
            <Alert type="error" onClose={() => setError('')}>{error}</Alert>
          </div>
        )}

        <h2 className="mb-2 text-2xl font-bold text-gray-800">Programas disponibles</h2>
        <p className="mb-8 text-sm text-gray-500">
          {courses.length} programa(s) abiertos a inscripción.
        </p>

        {courses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
            <p className="text-gray-500">Todavía no hay cursos publicados.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              const st = course.myEnrollment?.status;
              return (
                <article
                  key={course.id}
                  className="card flex flex-col overflow-hidden p-0 transition-shadow hover:shadow-xl"
                >
                  {course.imageUrl ? (
                    <div className="aspect-video w-full overflow-hidden bg-gray-100">
                      <img
                        src={course.imageUrl}
                        alt={course.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-28 items-center justify-center bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
                      <svg className="h-10 w-10 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0l9 5-9 5-9-5 9-5zm0-9v18" />
                      </svg>
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-6">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary-700">
                        {modalityLabels[course.modality] || course.modality}
                      </span>
                      {course.duration && (
                        <span className="text-xs font-medium text-gray-500">{course.duration}</span>
                      )}
                    </div>

                    <h3 className="mb-2 text-lg font-bold leading-snug text-gray-800">
                      {course.name}
                    </h3>
                    <p className="line-clamp-4 flex-1 text-sm leading-relaxed text-gray-600">
                      {course.description}
                    </p>

                    <div className="mt-4 space-y-1 border-t border-gray-100 pt-3 text-xs text-gray-500">
                      {course.duration && <p>Duracion: {course.duration}</p>}
                      <p>3 módulos con materiales y cuestionario</p>
                    </div>

                    <div className="mt-5 flex gap-2">
                      <button
                        onClick={() => setDetail(course)}
                        className="btn-secondary flex-1 text-sm"
                      >
                        Ver programa
                      </button>

                      {!user ? (
                        <Link to="/login" className="btn-primary flex-1 text-center text-sm">
                          Ingresar
                        </Link>
                      ) : st === 'ACEPTADA' ? (
                        <Link
                          to={`/aula/${course.id}`}
                          className="btn-primary flex-1 text-center text-sm"
                        >
                          Ir al aula
                        </Link>
                      ) : st === 'PENDIENTE' ? (
                        <button
                          onClick={() => handleCancel(course)}
                          disabled={working === course.id}
                          className="btn-secondary flex-1 text-sm"
                        >
                          Cancelar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEnroll(course)}
                          disabled={working === course.id}
                          className="btn-primary flex-1 text-sm"
                        >
                          {working === course.id ? 'Enviando...' : st === 'RECHAZADA' ? 'Reintentar' : 'Inscribirme'}
                        </button>
                      )}
                    </div>

                    {st && (
                      <p
                        className={`mt-2 rounded px-2 py-1 text-center text-[11px] font-semibold ${statusStyles[st]}`}
                      >
                        {statusLabels[st]}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 bg-gray-50 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-2 text-2xl font-bold text-gray-800">Mis cursos</h2>
          <p className="mb-8 text-sm text-gray-500">
            Cursos con inscripción aprobada. Completa los materiales y aprueba el cuestionario de cada
            módulo para avanzar al siguiente.
          </p>

          {!user ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center">
              <p className="text-gray-500">
                Inicia sesión para ver los cursos en los que estás inscrito.
              </p>
              <Link to="/login" className="btn-primary mt-4 inline-block">
                Iniciar sesión
              </Link>
            </div>
          ) : (
            <AulaExtendida courses={classroom} />
          )}
        </div>
      </div>

      {detail && (
        <Modal isOpen onClose={() => setDetail(null)} title={detail.name} size="lg">
          {detail.imageUrl && (
            <div className="mb-4 overflow-hidden rounded-xl">
              <img src={detail.imageUrl} alt={detail.name} className="max-h-72 w-full object-cover" />
            </div>
          )}
          <div className="mb-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-primary-50 px-3 py-1 font-semibold text-primary-700">
              {modalityLabels[detail.modality] || detail.modality}
            </span>
            {detail.duration && (
              <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-700">
                Duracion: {detail.duration}
              </span>
            )}
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
            {detail.description}
          </p>
          <p className="mt-4 border-t border-gray-100 pt-4 text-xs text-gray-500">
            El curso se organiza en tres módulos. Cada módulo incluye sus materiales y un cuestionario
            que debes aprobar para desbloquear el siguiente.
          </p>
        </Modal>
      )}
    </div>
  );
}
