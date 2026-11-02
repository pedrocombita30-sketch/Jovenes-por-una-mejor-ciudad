import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';

const statConfig = [
  { key: 'users', label: 'Usuarios', icon: 'M16 11c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3zm-8 0c1.7 0 3-1.3 3-3S9.7 5 8 5 5 6.3 5 8s1.3 3 3 3zm0 2c-2.3 0-7 1.2-7 3.5V20h14v-3.5C15 13.2 10.3 12 8 12z', color: 'bg-blue-100 text-blue-600' },
  { key: 'clients', label: 'Clientes', icon: 'M17 20h5v-2a4 4 0 00-4-4M9 20H4v-2a4 4 0 014-4 4 4 0 104-8 5 5 0 00-8 8M13 7a4 4 0 11-4-4M4 14a5 5 0 011-9', color: 'bg-primary-100 text-primary-600' },
  { key: 'clientsInFollowUp', label: 'En seguimiento', icon: 'M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'bg-indigo-100 text-indigo-600' },
  { key: 'courses', label: 'Cursos', icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l9 5-9 5-9-5 9-5zm0-9v18', color: 'bg-primary-100 text-primary-700' },
  { key: 'pendingEnrollmentsCount', label: 'Inscripciones pendientes', icon: 'M9 12l2 2 4-4m7 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'bg-purple-100 text-purple-600' },
  { key: 'pendingFollowUps', label: 'Seguimientos pendientes', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 14l2 2 4-4', color: 'bg-yellow-100 text-yellow-600' },
  { key: 'openConversations', label: 'Chats activos', icon: 'M4 6h16M4 10h16M4 14h10M4 18h6', color: 'bg-sky-100 text-sky-600' },
  { key: 'escalatedConversations', label: 'Chats escalados', icon: 'M12 9v2m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z', color: 'bg-red-100 text-red-600' },
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then((r) => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner size="lg" />;

  const { counts, recentInteractions, pendingEnrollments, recentConversations, charts, unreadNotifications } = data;

  const markAllRead = async () => {
    try {
      await api.put('/dashboard/notifications/read-all');
      const r = await api.get('/dashboard/stats');
      setData(r.data.data);
    } catch {
      // Sin acción
    }
  };

  return (
    <div className="space-y-6">
      {unreadNotifications.length > 0 && (
        <div className="rounded-xl border border-secondary-200 bg-secondary-50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold text-secondary-800">
              Notificaciones ({unreadNotifications.length} sin leer)
            </h3>
            <button onClick={markAllRead} className="rounded bg-secondary-200 px-2 py-1 text-xs font-medium text-secondary-800 hover:bg-secondary-300">
              Marcar todas como leídas
            </button>
          </div>
          <ul className="space-y-1 text-sm text-secondary-800">
            {unreadNotifications.map((n) => (
              <li key={n.id}>· {n.message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {statConfig.map((s) => (
          <Card key={s.key}>
            <CardBody className="flex items-center gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.color}`}>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d={s.icon} />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{counts[s.key] ?? 0}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Inscripciones pendientes</CardTitle></CardHeader>
          <CardBody>
            {pendingEnrollments.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">No hay solicitudes pendientes.</p>
            ) : (
              <ul className="space-y-3">
                {pendingEnrollments.map((e) => (
                  <li key={e.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                    <div>
                      <p className="font-medium text-gray-800">
                        {e.user.firstName} {e.user.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {e.course?.name || 'Curso eliminado'} · {new Date(e.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                      </p>
                    </div>
                    <Badge variant="PENDIENTE">Pendiente</Badge>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/admin/inscripciones" className="mt-4 inline-block text-sm font-semibold text-primary-600 hover:text-primary-700">
              Gestionar inscripciones →
            </Link>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Interacciones recientes</CardTitle></CardHeader>
          <CardBody>
            {recentInteractions.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">Sin interacciones registradas.</p>
            ) : (
              <ul className="space-y-3">
                {recentInteractions.map((i) => (
                  <li key={i.id} className="rounded-lg border border-gray-100 p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-800">
                        {i.client.firstName} {i.client.lastName}
                      </p>
                      <Badge variant={i.type}>{i.type}</Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">{i.description}</p>
                    <p className="mt-1 text-[10px] text-gray-400">
                      {i.user.firstName} {i.user.lastName} · {new Date(i.createdAt).toLocaleString('es-ES')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Clientes por estado</CardTitle></CardHeader>
          <CardBody>
            <div className="space-y-3">
              {Object.entries(charts.clientsByStatus).map(([status, count], i) => {
                const total = Object.values(charts.clientsByStatus).reduce((a, b) => a + b, 0) || 1;
                const pct = Math.round((count / total) * 100);
                const barColors = ['bg-primary-500', 'bg-secondary-500', 'bg-primary-400', 'bg-secondary-400', 'bg-gray-400'];
                return (
                  <div key={status}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium text-gray-600">{status.replace(/_/g, ' ')}</span>
                      <span className="text-gray-500">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100">
                      <div
                        className={`h-2 rounded-full transition-all ${barColors[i % barColors.length]}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Mensajes del chatbot (7 días)</CardTitle></CardHeader>
          <CardBody>
            <div className="flex h-40 items-end gap-2">
              {Object.entries(charts.chatByDay).map(([day, count]) => {
                const max = Math.max(...Object.values(charts.chatByDay), 1);
                const height = Math.max(6, Math.round((count / max) * 100));
                return (
                  <div key={day} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs font-medium text-gray-500">{count}</span>
                    <div
                      className="w-full rounded-t bg-secondary-500"
                      style={{ height: `${height}px` }}
                    />
                    <span className="text-[10px] text-gray-400">
                      {new Date(day).toLocaleDateString('es-ES', { weekday: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Conversaciones recientes del chatbot</CardTitle></CardHeader>
        <CardBody>
          {recentConversations.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">Sin conversaciones.</p>
          ) : (
            <ul className="space-y-3">
              {recentConversations.map((c) => (
                <li key={c.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                  <div>
                    <p className="font-medium text-gray-800">
                      {c.user ? `${c.user.firstName} ${c.user.lastName}` : 'Visitante anónimo'}
                    </p>
                    <p className="text-xs text-gray-500">{c._count.messages} mensajes</p>
                  </div>
                  <Badge variant={c.status}>{c.status}</Badge>
                </li>
              ))}
            </ul>
          )}
          <Link to="/admin/conversaciones" className="mt-4 inline-block text-sm font-semibold text-primary-600 hover:text-primary-700">
            Ver todas las conversaciones →
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}