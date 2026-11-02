import { useState, useRef, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing, open]);

  useEffect(() => {
    if (!open || !conversationId) return;
    let lastId = 0;
    const timer = setInterval(async () => {
      try {
        const { data } = await api.get(`/chat/conversations/${conversationId}/poll?after=${lastId}`);
        const incoming = (data.data?.messages || []).filter((m) => m.sender !== 'USUARIO');
        if (incoming.length) {
          setMessages((prev) => {
            const known = new Set(prev.map((m) => m.id));
            const fresh = incoming.filter((m) => !known.has(m.id));
            return fresh.length ? [...prev, ...fresh] : prev;
          });
          lastId = Math.max(...incoming.map((m) => m.id));
        }
      } catch {
        /* silencioso */
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [open, conversationId]);

  const sendMessage = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || typing) return;

    setMessages((prev) => [...prev, { id: Date.now(), sender: 'USUARIO', content: text }]);
    setInput('');
    setTyping(true);
    setError('');

    try {
      const { data } = await api.post('/chat', {
        message: text,
        conversationId: conversationId || undefined,
      });
      setConversationId(data.data.conversationId);
      setMessages((prev) => [...prev, { id: Date.now() + 1, sender: 'BOT', content: data.data.botMessage.content }]);
      if (data.data.escalated) {
        setMessages((prev) => [...prev, {
          id: Date.now() + 2,
          sender: 'BOT',
          content: 'Un colaborador humano se hará cargo de tu conversación por este canal. Puedes responder aquí y te atenderá nuestro equipo.',
        }]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo enviar el mensaje.');
      setMessages((prev) => prev.slice(0, -1));
      setInput(text);
    } finally {
      setTyping(false);
    }
  };

  const welcome = user
    ? `Hola ${user.firstName}! Soy el asistente de Jóvenes por una Mejor Ciudad. ¿En qué puedo ayudarte hoy?`
    : '¡Hola! Soy el asistente virtual de Jóvenes por una Mejor Ciudad. ¿En qué puedo ayudarte?';

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {open && (
        <div className="mb-3 flex h-[480px] w-[92vw] max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200">
          <div className="flex items-center justify-between bg-gradient-to-r from-primary-600 to-secondary-600 px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <img src="/logo.png" alt="Bot" className="h-6 w-6 rounded-full object-cover" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-blue-400 ring-2 ring-white" />
              </div>
              <div>
                <p className="text-sm font-bold">Asistente virtual</p>
                <p className="text-[10px] text-white/80">En línea · Jóvenes por una Mejor Ciudad</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-white/20">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4">
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-white p-3 text-sm text-gray-800 shadow-sm ring-1 ring-gray-100">
                {welcome}
              </div>
            </div>

            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === 'USUARIO' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] whitespace-pre-wrap rounded-2xl p-3 text-sm shadow-sm ${
                    m.sender === 'USUARIO'
                      ? 'rounded-br-sm bg-primary-600 text-white'
                      : 'rounded-bl-sm bg-white text-gray-800 ring-1 ring-gray-100'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-white p-3 shadow-sm ring-1 ring-gray-100">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0.1s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0.2s]" />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 p-2 text-xs text-red-600">{error}</div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={sendMessage} className="flex gap-2 border-t border-gray-100 bg-white p-3">
            <input
              className="input-field flex-1"
              placeholder="Escribe tu mensaje..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={typing}
            />
            <button
              type="submit"
              disabled={typing || !input.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="shadow-lg transition-transform hover:scale-105"
        aria-label="Asistente virtual"
      >
        {open ? (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-800 text-white">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        ) : (
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-secondary-600 text-white">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 11.5a8.4 8.4 0 01-9 8.4 8.6 8.6 0 01-3.1-.6L3 21l1.7-5.8A8.4 8.4 0 014.5 5.1a8.4 8.4 0 0110-6.4" />
            </svg>
            <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full bg-blue-500 ring-2 ring-white" />
          </div>
        )}
      </button>
    </div>
  );
}