import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';

// Cuestionario de un módulo. La calificación la calcula el backend.
export default function QuizModal({ courseId, module, onClose, onChanged }) {
  const [stage, setStage] = useState('loading'); // loading | answering | review | submitting | result | error
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const loadQuiz = () => {
    setStage('loading');
    setError('');
    api
      .get(`/courses/${courseId}/modules/${module.id}/quiz`)
      .then((r) => {
        setQuiz(r.data.data.quiz);
        setAnswers({});
        setResult(null);
        setStage('answering');
      })
      .catch((e) => {
        setError(e.response?.data?.message || 'No se pudo cargar el cuestionario.');
        setStage('error');
      });
  };

  useEffect(() => {
    loadQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module.id]);

  const total = quiz?.questions.length || 0;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = total > 0 && answeredCount === total;

  const select = (questionId, optionId) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const submit = async () => {
    setStage('submitting');
    setError('');
    try {
      const r = await api.post(`/courses/${courseId}/modules/${module.id}/quiz/attempts`, { answers });
      setResult(r.data.data);
      setStage('result');
      onChanged();
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo enviar el cuestionario.');
      setStage('review');
    }
  };

  const optionText = (question, optionId) =>
    question.options.find((o) => o.id === optionId)?.text || '';

  return (
    <Modal isOpen onClose={onClose} title={quiz?.title || `Cuestionario · ${module.title}`} size="lg">
      {stage === 'loading' && <Spinner />}

      {stage === 'error' && (
        <div className="space-y-4">
          <Alert type="error">{error}</Alert>
          <button onClick={onClose} className="btn-secondary">Cerrar</button>
        </div>
      )}

      {(stage === 'answering' || stage === 'review' || stage === 'submitting') && quiz && (
        <div className="space-y-5">
          {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

          <div className="rounded-lg bg-primary-50 p-4 text-sm text-primary-900">
            <p className="font-semibold">Porcentaje mínimo para aprobar: {quiz.passingScore}%</p>
            {quiz.instructions && <p className="mt-1 whitespace-pre-line text-primary-800">{quiz.instructions}</p>}
          </div>

          {stage === 'answering' && (
            <>
              {quiz.questions.map((q, index) => (
                <fieldset key={q.id} className="rounded-xl border border-gray-200 p-4">
                  <legend className="px-1 text-sm font-semibold text-gray-800">
                    {index + 1}. {q.text}
                  </legend>
                  <div className="mt-2 space-y-2">
                    {q.options.map((o) => (
                      <label
                        key={o.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors ${
                          answers[q.id] === o.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${q.id}`}
                          checked={answers[q.id] === o.id}
                          onChange={() => select(q.id, o.id)}
                          className="mt-0.5 h-4 w-4 text-primary-600"
                        />
                        <span className="text-gray-700">{o.text}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-500">
                  {answeredCount} de {total} preguntas respondidas
                </p>
                <div className="flex gap-2">
                  <button onClick={onClose} className="btn-secondary">Cancelar</button>
                  <button onClick={() => setStage('review')} disabled={!allAnswered} className="btn-primary">
                    Revisar respuestas
                  </button>
                </div>
              </div>
            </>
          )}

          {(stage === 'review' || stage === 'submitting') && (
            <>
              <p className="text-sm text-gray-600">
                Revisa tus respuestas antes de enviar. Una vez enviado, el intento queda registrado.
              </p>
              <ol className="space-y-3">
                {quiz.questions.map((q, index) => (
                  <li key={q.id} className="rounded-lg border border-gray-200 p-3 text-sm">
                    <p className="font-medium text-gray-800">
                      {index + 1}. {q.text}
                    </p>
                    <p className="mt-1 text-primary-700">
                      Tu respuesta: {optionText(q, answers[q.id]) || <span className="text-red-600">Sin responder</span>}
                    </p>
                  </li>
                ))}
              </ol>

              <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  onClick={() => setStage('answering')}
                  disabled={stage === 'submitting'}
                  className="btn-secondary"
                >
                  Volver a responder
                </button>
                <button onClick={submit} disabled={stage === 'submitting'} className="btn-primary">
                  {stage === 'submitting' ? 'Enviando...' : 'Enviar evaluación'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {stage === 'result' && result && (
        <div className="space-y-5 text-center">
          <div
            className={`mx-auto flex h-24 w-24 flex-col items-center justify-center rounded-full text-white ${
              result.passed ? 'bg-green-600' : 'bg-amber-500'
            }`}
          >
            <span className="text-2xl font-bold">{result.score}%</span>
          </div>

          <div>
            <p className="text-lg font-bold text-gray-800">
              {result.passed ? '¡Cuestionario aprobado!' : 'Aún no alcanzas el mínimo'}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Respondiste {result.correctCount} de {result.totalQuestions} preguntas correctamente.
              Porcentaje mínimo: {result.passingScore}%.
            </p>
            <p className="mt-3 text-sm text-gray-600">
              {result.passed
                ? module.isLast
                  ? 'Completaste el último módulo y el curso queda finalizado.'
                  : `Se desbloqueó el Módulo ${module.number + 1}.`
                : 'Puedes volver a presentar el cuestionario cuando quieras.'}
            </p>
          </div>

          <div className="flex justify-center gap-2 border-t border-gray-100 pt-4">
            {!result.passed && (
              <button onClick={loadQuiz} className="btn-primary">Volver a presentar</button>
            )}
            <button onClick={onClose} className="btn-secondary">Cerrar</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
