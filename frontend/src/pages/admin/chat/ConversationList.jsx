import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import Spinner from '../../../components/ui/Spinner';
import Badge from '../../../components/ui/Badge';
import Alert from '../../../components/ui/Alert';
import Modal from '../../../components/ui/Modal';
import Select from '../../../components/ui/Select';

const senderStyles = {
  USUARIO: 'bg-blue-50 text-blue-900',
  BOT: 'bg-gray-100 text-gray-800',
  COLABORADOR: 'bg-blue-50 text-blue-900',
};

const senderLabels = { USUARIO: 'Usuario', BOT: 'Asistente IA', COLABORADOR: 'Colaborador' };

export default function ConversationList() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');

  const fetchConversations = (silent = false) => {
    if (!silent) setLoading(true);
    const params = status ? `?status=${status}` : '';
    api.get(`/chat/conversations${params}`)
      .then((r) => setConversations(r.data.data))
      .catch((e) => { if (!silent) setError(e.response?.data?.message || 'Error al cargar conversaciones.'); })
      .finally(() => { if (!silent) setLoading(false); });
  };

  useEffect(() => { fetchConversations(); }, [status]);

  useEffect(() => {
    const timer = setInterval(() => {
      fetchConversations(true);
      if (selected) openConversation(selected, true);
    }, 5000);
    return () => clearInterval(timer);
  }, [status, selected]);

  const escalatedCount = conversations.filter((c) => c.status === 'ESCALADA').length;

  const openConversation = async (conv, silent = false) => {
    try {
      const { data } = await api.get(`/chat/conversations/${conv.id}`);
      setSelected(data.data);
      if (!silent) setReply('');
    } catch (e) {
      if (!silent) setError(e.response?.data?.message || 'Error al abrir la conversación.');
    }
  };

  const sendReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    try {
      await api.post(`/chat/conversations/${selected.id}/reply`, { message: reply });
      setReply('');
      openConversation(selected);
      fetchConversations();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo enviar la respuesta.');
    }
  };

  const escalate = async (conv) => {
    try {
      await api.post(`/chat/conversations/${conv.id}/escalate`);
      fetchConversations();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo escalar.');
    }
  };

  const close = async (conv) => {
    try {
      await api.put(`/chat/conversations/${conv.id}/close`);
      setSelected(null);
      fetchConversations();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cerrar.');
    }
  };

  return (
    <div>
      {error && <div className="mb-4"><Alert type="error" onClose={() => setError('')}>{error}</Alert></div>}

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="w-52">
          <Select
            label="Filtrar por estado"
            options={[{ value: '', label: 'Todas' }, ...['ACTIVA', 'ESCALADA', 'CERRADA'].map((s) => ({ value: s, label: s }))]}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          />
        </div>
        {escalatedCount > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2 text-sm font-medium text-orange-700">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
              {escalatedCount}
            </span>
            Conversaciones escaladas por atender
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <Spinner />
        ) : conversations.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-500">No hay conversaciones.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {conversations.map((c) => (
              <div key={c.id} className={`flex items-center justify-between p-4 hover:bg-gray-50 ${c.status === 'ESCALADA' ? 'bg-orange-50/60' : ''}`}>
                <button onClick={() => openConversation(c)} className="flex flex-1 items-center gap-3 text-left">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                    {c.user ? `${c.user.firstName[0]}${c.user.lastName[0]}` : '?'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {c.user ? `${c.user.firstName} ${c.user.lastName}` : 'Visitante anónimo'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {c._count.messages} mensajes · {new Date(c.updatedAt).toLocaleString('es-ES')}
                      {c.assignedCollaborator && <> · Resp.: {c.assignedCollaborator.firstName}</>}
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-2">
                  <Badge variant={c.status}>{c.status}</Badge>
                  {c.status === 'ACTIVA' && (
                    <button onClick={() => escalate(c)} className="rounded bg-orange-100 px-2 py-1 text-xs text-orange-700 hover:bg-orange-200">
                      Escalar
                    </button>
                  )}
                  {c.status !== 'CERRADA' && (
                    <button onClick={() => close(c)} className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200">
                      Cerrar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Conversación" size="xl">
        {selected && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                ID #{selected.id} · {selected.user ? `${selected.user.firstName} ${selected.user.lastName}` : 'Anónimo'}
              </span>
              <Badge variant={selected.status}>{selected.status}</Badge>
            </div>

            <div className="mb-4 max-h-96 space-y-3 overflow-y-auto rounded-lg bg-gray-50 p-4">
              {selected.messages.map((m) => (
                <div key={m.id} className={`rounded-lg p-3 text-sm ${senderStyles[m.sender] || senderStyles.BOT}`}>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-60">
                    {senderLabels[m.sender]} · {new Date(m.createdAt).toLocaleTimeString('es-ES')}
                  </p>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              ))}
            </div>

            {selected.status !== 'CERRADA' && (
              <form onSubmit={sendReply} className="flex gap-2">
                <input
                  className="input-field flex-1"
                  placeholder="Escribe una respuesta al usuario..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                />
                <button type="submit" className="btn-primary">Enviar</button>
              </form>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}