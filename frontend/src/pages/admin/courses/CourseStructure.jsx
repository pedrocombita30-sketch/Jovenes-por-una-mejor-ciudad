import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../../api/axios';
import Spinner from '../../../components/ui/Spinner';
import Alert from '../../../components/ui/Alert';
import Modal from '../../../components/ui/Modal';
import ResourceForm from '../resources/ResourceForm';

const typeLabels = { DOCUMENTO: 'Documento', PRESENTACION: 'Presentación', ENLACE: 'Enlace' };
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

export default function CourseStructure() {
  const { id } = useParams();
  const courseId = Number(id);

  const [data, setData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [editingModule, setEditingModule] = useState(null);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [materialCtx, setMaterialCtx] = useState(null); // { module, resource }
  const [questionCtx, setQuestionCtx] = useState(null); // { module, question }
  const [collapsed, setCollapsed] = useState(() => new Set());

  const toggleCollapsed = (moduleId) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });

  const load = useCallback(() => {
    return Promise.all([api.get(`/courses/manage/${courseId}/structure`), api.get('/courses/manage/all')])
      .then(([s, c]) => {
        setData(s.data.data);
        setCourses(c.data.data || []);
      })
      .catch((e) => setError(e.response?.data?.message || 'No se pudo cargar el curso.'))
      .finally(() => setLoading(false));
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const deleteMaterial = async (r) => {
    if (!window.confirm(`¿Eliminar el material "${r.title}"?`)) return;
    try {
      await api.delete(`/resources/${r.id}`);
      flash('Material eliminado.');
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo eliminar el material.');
    }
  };

  const deleteQuestion = async (q) => {
    if (!window.confirm(`¿Eliminar la pregunta "${q.text}"?`)) return;
    try {
      await api.delete(`/courses/manage/questions/${q.id}`);
      flash('Pregunta eliminada.');
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo eliminar la pregunta.');
    }
  };

  if (loading) return <Spinner />;

  if (!data) {
    return (
      <div>
        {error && <Alert type="error">{error}</Alert>}
        <Link to="/admin/cursos" className="btn-secondary mt-4 inline-block">Volver a cursos</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/cursos" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
          ← Volver a cursos
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-800">{data.course.name}</h1>
        <p className="text-sm text-gray-500">
          Organiza los materiales de cada módulo y gestiona su cuestionario. Los alumnos avanzan de
          módulo en módulo al aprobar cada evaluación.
        </p>
      </div>

      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

      {data.modules.map((m) => (
        <section key={m.id} className="card overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 bg-gray-50 px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Módulo {m.position}</p>
              <h2 className="text-lg font-bold text-gray-800">{m.title}</h2>
              {m.description && <p className="mt-1 text-sm text-gray-600">{m.description}</p>}
            </div>
            <div className="flex shrink-0 gap-2">
              <button onClick={() => setEditingModule(m)} className="btn-secondary text-xs">
                Editar título y descripción
              </button>
              <button
                onClick={() => toggleCollapsed(m.id)}
                aria-expanded={!collapsed.has(m.id)}
                className="btn-secondary text-xs"
              >
                {collapsed.has(m.id) ? 'Desplegar' : 'Contraer'}
              </button>
            </div>
          </div>

          {!collapsed.has(m.id) && (
          <div className="grid gap-6 p-5 lg:grid-cols-2">
            {/* Materiales del módulo */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Materiales ({m.resources.length})</h3>
                <button
                  onClick={() => setMaterialCtx({ module: m, resource: null })}
                  className="rounded bg-primary-100 px-2 py-1 text-xs font-medium text-primary-700 hover:bg-primary-200"
                >
                  + Agregar material
                </button>
              </div>

              {m.resources.length === 0 ? (
                <p className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-400">
                  Sin materiales. El módulo no podrá avanzar hasta que tenga contenido.
                </p>
              ) : (
                <ul className="space-y-2">
                  {m.resources.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-800">{r.title}</p>
                        <p className="text-xs text-gray-500">
                          {typeLabels[r.type] || r.type}
                          {r.description ? ` · ${r.description}` : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => setMaterialCtx({ module: m, resource: { ...r, courseId, moduleId: m.id } })}
                          className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 hover:bg-blue-200"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => deleteMaterial(r)}
                          className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200"
                        >
                          Eliminar
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Cuestionario del módulo */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Cuestionario</h3>
                <button onClick={() => setEditingQuiz(m)} className="btn-secondary text-xs">
                  Configurar
                </button>
              </div>

              {m.quiz && (
                <div className="mb-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                  <p className="font-semibold text-gray-800">{m.quiz.title}</p>
                  <p>Porcentaje mínimo para aprobar: {m.quiz.passingScore}%</p>
                  {m.quiz.instructions && <p className="mt-1 whitespace-pre-line">{m.quiz.instructions}</p>}
                </div>
              )}

              <ol className="space-y-3">
                {m.quiz?.questions.map((q, index) => (
                  <li key={q.id} className="rounded-lg border border-gray-100 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-800">
                        {index + 1}. {q.text}
                      </p>
                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => setQuestionCtx({ module: m, question: q })}
                          className="text-xs font-semibold text-primary-600"
                        >
                          Editar
                        </button>
                        <button onClick={() => deleteQuestion(q)} className="text-xs font-semibold text-red-600">
                          Eliminar
                        </button>
                      </div>
                    </div>
                    <ul className="mt-2 space-y-1">
                      {q.options.map((o) => (
                        <li key={o.id} className={`text-xs ${o.isCorrect ? 'font-semibold text-green-700' : 'text-gray-500'}`}>
                          {o.isCorrect ? '✓ ' : '· '}
                          {o.text}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>

              {(!m.quiz || m.quiz.questions.length === 0) && (
                <p className="mb-3 rounded-lg border border-dashed border-gray-300 px-4 py-4 text-center text-sm text-gray-400">
                  Este cuestionario aún no tiene preguntas.
                </p>
              )}

              <button
                onClick={() => setQuestionCtx({ module: m, question: null })}
                className="btn-primary mt-3 text-xs"
              >
                + Agregar pregunta
              </button>
            </div>
          </div>
          )}
        </section>
      ))}

      {editingModule && (
        <Modal isOpen onClose={() => setEditingModule(null)} title={`Editar Módulo ${editingModule.position}`} size="md">
          <ModuleForm
            module={editingModule}
            onSaved={() => { setEditingModule(null); flash('Módulo actualizado.'); load(); }}
          />
        </Modal>
      )}

      {editingQuiz && (
        <Modal isOpen onClose={() => setEditingQuiz(null)} title="Configurar cuestionario" size="md">
          <QuizForm
            module={editingQuiz}
            onSaved={() => { setEditingQuiz(null); flash('Cuestionario actualizado.'); load(); }}
          />
        </Modal>
      )}

      {questionCtx && (
        <Modal
          isOpen
          onClose={() => setQuestionCtx(null)}
          title={questionCtx.question ? 'Editar pregunta' : 'Nueva pregunta'}
          size="lg"
        >
          <QuestionForm
            module={questionCtx.module}
            question={questionCtx.question}
            onSaved={() => { setQuestionCtx(null); flash('Pregunta guardada.'); load(); }}
          />
        </Modal>
      )}

      {materialCtx && (
        <Modal
          isOpen
          onClose={() => setMaterialCtx(null)}
          title={materialCtx.resource ? 'Editar material' : 'Nuevo material'}
          size="lg"
        >
          <ResourceForm
            courses={courses}
            initialCourseId={courseId}
            initialModuleId={materialCtx.module.id}
            resource={materialCtx.resource}
            onSuccess={() => { setMaterialCtx(null); flash('Material guardado.'); load(); }}
          />
        </Modal>
      )}
    </div>
  );
}

function ModuleForm({ module, onSaved }) {
  const [title, setTitle] = useState(module.title);
  const [description, setDescription] = useState(module.description || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('El título es obligatorio.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.put(`/courses/manage/modules/${module.id}`, { title, description });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar el módulo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
      <div>
        <label className="label-field">Título del módulo</label>
        <input className="input-field" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label className="label-field">Descripción</label>
        <textarea className="input-field" rows="3" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}

function QuizForm({ module, onSaved }) {
  const quiz = module.quiz || {};
  const [title, setTitle] = useState(quiz.title || '');
  const [instructions, setInstructions] = useState(quiz.instructions || '');
  const [passingScore, setPassingScore] = useState(quiz.passingScore ?? 70);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const score = Number(passingScore);
    if (!title.trim()) return setError('El título es obligatorio.');
    if (!Number.isInteger(score) || score < 1 || score > 100) {
      return setError('El porcentaje mínimo debe ser un número entero entre 1 y 100.');
    }
    setSaving(true);
    try {
      await api.put(`/courses/manage/modules/${module.id}/quiz`, {
        title,
        instructions,
        passingScore: score,
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar el cuestionario.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
      <div>
        <label className="label-field">Título del cuestionario</label>
        <input className="input-field" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label className="label-field">Instrucciones para el alumno</label>
        <textarea className="input-field" rows="3" value={instructions} onChange={(e) => setInstructions(e.target.value)} />
      </div>
      <div>
        <label className="label-field">Porcentaje mínimo para aprobar (%)</label>
        <input
          type="number"
          min="1"
          max="100"
          className="input-field"
          value={passingScore}
          onChange={(e) => setPassingScore(e.target.value)}
        />
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}

function QuestionForm({ module, question, onSaved }) {
  const [text, setText] = useState(question?.text || '');
  const [options, setOptions] = useState(
    question?.options?.length
      ? question.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect }))
      : [
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
        ]
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const updateOption = (index, value) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, text: value } : o)));
  };

  const markCorrect = (index) => {
    setOptions((prev) => prev.map((o, i) => ({ ...o, isCorrect: i === index })));
  };

  const addOption = () => {
    if (options.length >= MAX_OPTIONS) return;
    setOptions((prev) => [...prev, { text: '', isCorrect: false }]);
  };

  const removeOption = (index) => {
    if (options.length <= MIN_OPTIONS) return;
    setOptions((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (!next.some((o) => o.isCorrect)) next[0] = { ...next[0], isCorrect: true };
      return next;
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!text.trim()) return setError('Escribe el enunciado de la pregunta.');
    if (options.some((o) => !o.text.trim())) return setError('Todas las opciones deben tener texto.');
    if (options.filter((o) => o.isCorrect).length !== 1) {
      return setError('Marca exactamente una respuesta correcta.');
    }

    const payload = { text, options: options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })) };

    setSaving(true);
    try {
      if (question) {
        await api.put(`/courses/manage/questions/${question.id}`, payload);
      } else {
        await api.post(`/courses/manage/modules/${module.id}/quiz/questions`, payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar la pregunta.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

      <div>
        <label className="label-field">Enunciado</label>
        <textarea className="input-field" rows="2" value={text} onChange={(e) => setText(e.target.value)} />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="label-field !mb-0">Opciones de respuesta</label>
          <span className="text-xs text-gray-500">Marca la única respuesta correcta</span>
        </div>
        <div className="space-y-2">
          {options.map((o, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct-option"
                checked={o.isCorrect}
                onChange={() => markCorrect(index)}
                className="h-4 w-4 text-green-600"
                title="Respuesta correcta"
              />
              <input
                className="input-field"
                placeholder={`Opción ${index + 1}`}
                value={o.text}
                onChange={(e) => updateOption(index, e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeOption(index)}
                disabled={options.length <= MIN_OPTIONS}
                className="shrink-0 rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-40"
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addOption}
          disabled={options.length >= MAX_OPTIONS}
          className="mt-3 text-xs font-semibold text-primary-600 disabled:opacity-40"
        >
          + Agregar opción ({options.length}/{MAX_OPTIONS})
        </button>
      </div>

      <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Guardando...' : 'Guardar pregunta'}
        </button>
      </div>
    </form>
  );
}
