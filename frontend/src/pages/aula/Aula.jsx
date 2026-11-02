import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/axios';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import QuizModal from './QuizModal';
import MaterialItem from './MaterialItem';
import { Icon, ICONS, ProgressBar, StatusPill, moduleStatusLabels } from './ui';

function toggleSet(setter, key) {
  setter((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  });
}

// Fila del cuestionario, al final de la lista del módulo
function QuizRow({ module, onPresent }) {
  const [open, setOpen] = useState(false);
  const quiz = module.quiz;
  if (!quiz) return null;

  let tone = 'locked';
  let label = 'Bloqueado';
  if (quiz.passed) {
    tone = 'done';
    label = 'Aprobado';
  } else if (quiz.available && quiz.attemptCount > 0) {
    tone = 'warn';
    label = 'Pendiente de repetir';
  } else if (quiz.available) {
    tone = 'info';
    label = 'Disponible';
  }

  return (
    <li className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-700">
          <Icon d={ICONS.QUIZ} className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-gray-800">{quiz.title}</span>
          <span className="text-xs text-gray-500">Evaluación · mínimo {quiz.passingScore}%</span>
        </span>
        <StatusPill tone={tone}>{label}</StatusPill>
        <Icon
          d={ICONS.CHEVRON}
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="space-y-3 border-t border-gray-100 px-4 py-4 text-sm text-gray-600">
          {quiz.instructions && <p className="whitespace-pre-line">{quiz.instructions}</p>}
          <p className="text-xs text-gray-500">
            {quiz.questionCount} pregunta(s)
            {quiz.attemptCount > 0 ? ` · ${quiz.attemptCount} intento(s)` : ''}
          </p>
          {quiz.lastAttempt && (
            <p className={`text-xs font-semibold ${quiz.lastAttempt.passed ? 'text-green-700' : 'text-amber-700'}`}>
              Último intento: {quiz.lastAttempt.score}% · {quiz.lastAttempt.passed ? 'Aprobado' : 'No aprobado'}
            </p>
          )}

          {quiz.passed ? (
            <p className="rounded-lg bg-green-50 p-3 font-medium text-green-800">
              Cuestionario aprobado. {module.position < 3 ? `Se desbloqueó el Módulo ${module.position + 1}.` : '¡Último módulo completado!'}
            </p>
          ) : quiz.available ? (
            <button onClick={() => onPresent(module)} className="btn-primary text-sm">
              {quiz.attemptCount > 0 ? 'Volver a presentar' : 'Presentar cuestionario'}
            </button>
          ) : (
            <p className="flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-gray-600">
              <Icon d={ICONS.LOCK} className="mt-0.5 h-4 w-4 text-gray-400" />
              <span>{quiz.blockedReason || 'Completa los materiales del módulo para habilitar el cuestionario.'}</span>
            </p>
          )}
        </div>
      )}
    </li>
  );
}

// Sección desplegable de un módulo
function ModuleSection({ module, open, onToggle, onPresentQuiz, fetchBlob, onComplete, completing }) {
  const locked = !module.unlocked;

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <button
        onClick={() => !locked && onToggle()}
        disabled={locked}
        aria-expanded={open}
        className={`flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 text-left transition-colors ${
          locked ? 'cursor-not-allowed bg-gray-50' : 'hover:bg-gray-50'
        }`}
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
            locked ? 'bg-gray-200 text-gray-500' : 'bg-primary-600 text-white'
          }`}
        >
          {locked ? <Icon d={ICONS.LOCK} className="h-5 w-5" /> : module.position}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
            Módulo {module.position}
          </span>
          <span className={`block truncate text-base font-bold ${locked ? 'text-gray-500' : 'text-gray-800'}`}>
            {module.title}
          </span>
          <span className="mt-1.5 flex items-center gap-3">
            <ProgressBar percent={module.percent} className="max-w-[200px] flex-1" />
            <span className="whitespace-nowrap text-xs font-semibold text-gray-600">{module.percent}%</span>
          </span>
        </span>

        <StatusPill tone={locked ? 'locked' : module.status === 'COMPLETADO' ? 'done' : module.status === 'PENDIENTE_CUESTIONARIO' ? 'warn' : 'info'}>
          {moduleStatusLabels[module.status]}
        </StatusPill>

        {!locked && (
          <Icon
            d={ICONS.CHEVRON}
            className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {open && !locked && (
        <div className="space-y-4 border-t border-gray-100 bg-gray-50/60 px-5 py-4">
          {module.description && <p className="text-sm text-gray-600">{module.description}</p>}

          {module.materials.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-5 text-center text-sm text-gray-400">
              Este módulo todavía no tiene temas ni materiales publicados.
            </p>
          ) : (
            <ul className="space-y-2">
              {module.materials.map((m) => (
                <MaterialItem
                  key={m.id}
                  material={m}
                  fetchBlob={fetchBlob}
                  onComplete={onComplete}
                  busy={completing.has(m.id)}
                />
              ))}
            </ul>
          )}

          <ul className="space-y-2">
            <QuizRow module={module} onPresent={onPresentQuiz} />
          </ul>
        </div>
      )}

      {locked && (
        <div className="flex items-start gap-3 border-t border-gray-100 bg-white px-5 py-3 text-sm text-gray-600">
          <Icon d={ICONS.LOCK} className="mt-0.5 h-4 w-4 text-gray-400" />
          <p>{module.blockedReason}</p>
        </div>
      )}
    </section>
  );
}

export default function Aula() {
  const { id } = useParams();
  const courseId = Number(id);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [openModules, setOpenModules] = useState(() => new Set());
  const [quizModule, setQuizModule] = useState(null);
  const [completing, setCompleting] = useState(() => new Set());
  const blobCache = useRef(new Map());
  const initialized = useRef(false);

  const load = useCallback(() => {
    return api
      .get(`/courses/${courseId}/classroom`)
      .then((r) => setData(r.data.data))
      .catch((e) => setError(e.response?.data?.message || 'No se pudo cargar el aula.'))
      .finally(() => setLoading(false));
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  // Al cargar, se despliega el primer módulo disponible que aún no esté completado.
  useEffect(() => {
    if (!data || initialized.current) return;
    initialized.current = true;
    const target =
      data.modules.find((m) => m.unlocked && m.status !== 'COMPLETADO') ||
      data.modules.find((m) => m.unlocked) ||
      null;
    if (target) setOpenModules(new Set([target.id]));
  }, [data]);

  // Libera las URLs de los archivos cargados al salir de la página
  useEffect(() => {
    const cache = blobCache.current;
    return () => {
      cache.forEach((p) => p.then((b) => URL.revokeObjectURL(b.url)).catch(() => {}));
      cache.clear();
    };
  }, []);

  // Descarga el archivo una sola vez y lo reutiliza al volver a desplegarlo
  const fetchBlob = useCallback((m) => {
    if (!blobCache.current.has(m.id)) {
      const promise = api
        .get(`/resources/${m.id}/download`, { responseType: 'blob' })
        .then((resp) => {
          const mime = resp.headers['content-type'] || 'application/octet-stream';
          const disposition = resp.headers['content-disposition'] || '';
          const filename = /filename="?([^";]+)"?/.exec(disposition)?.[1] || m.title;
          return { url: window.URL.createObjectURL(new Blob([resp.data], { type: mime })), mime, filename };
        });
      promise.catch(() => blobCache.current.delete(m.id));
      blobCache.current.set(m.id, promise);
    }
    return blobCache.current.get(m.id);
  }, []);

  // Registra la finalización (idempotente en backend) y refresca el progreso sin recargar la página
  const markCompleted = useCallback(
    async (m) => {
      if (m.completed || completing.has(m.id)) return;
      setCompleting((prev) => new Set(prev).add(m.id));
      try {
        await api.post(`/courses/materials/${m.id}/complete`);
        await load();
      } catch (e) {
        setError(e.response?.data?.message || 'No se pudo registrar el avance del material.');
      } finally {
        setCompleting((prev) => {
          const next = new Set(prev);
          next.delete(m.id);
          return next;
        });
      }
    },
    [completing, load]
  );

  if (loading) {
    return (
      <div className="py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        {error && <Alert type="error">{error}</Alert>}
        <Link to="/cursos" className="btn-secondary mt-6 inline-block">Volver a cursos</Link>
      </div>
    );
  }

  const { course, overall, modules } = data;

  return (
    <div className="bg-gray-50">
      <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-secondary-600 py-10 text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Link to="/cursos" className="text-xs font-semibold uppercase tracking-wider text-secondary-200 hover:text-white">
            ← Volver a cursos
          </Link>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{course.name}</h1>
          {course.description && (
            <p className="mt-2 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-white/90">
              {course.description}
            </p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-5 px-4 py-8 sm:px-6">
        {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
        {info && <Alert type="success" onClose={() => setInfo('')}>{info}</Alert>}

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-gray-700">Progreso general</p>
              <p className="text-xs text-gray-500">
                {overall.completedModules} de {overall.totalModules} módulos completados
              </p>
            </div>
            <p className="text-2xl font-bold text-primary-700">{overall.percent}%</p>
          </div>
          <ProgressBar percent={overall.percent} tone={overall.finished ? 'green' : 'primary'} />
          {overall.finished && (
            <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-800">
              ¡Felicitaciones! Completaste todos los módulos y el curso quedó finalizado.
            </p>
          )}
        </section>

        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Contenido del curso</h2>
          <button
            onClick={() =>
              setOpenModules((prev) =>
                prev.size === modules.filter((m) => m.unlocked).length
                  ? new Set()
                  : new Set(modules.filter((m) => m.unlocked).map((m) => m.id))
              )
            }
            className="text-xs font-semibold text-primary-600 hover:text-primary-700"
          >
            {openModules.size > 0 ? 'Contraer todo' : 'Desplegar todo'}
          </button>
        </div>

        <div className="space-y-3">
          {modules.map((m) => (
            <ModuleSection
              key={m.id}
              module={m}
              open={openModules.has(m.id)}
              onToggle={() => toggleSet(setOpenModules, m.id)}
              onPresentQuiz={setQuizModule}
              fetchBlob={fetchBlob}
              onComplete={markCompleted}
              completing={completing}
            />
          ))}
        </div>
      </div>

      {quizModule && (
        <QuizModal
          courseId={courseId}
          module={quizModule}
          onClose={() => setQuizModule(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}
