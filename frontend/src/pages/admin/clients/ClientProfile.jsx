import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import Spinner from '../../../components/ui/Spinner';
import Badge from '../../../components/ui/Badge';
import Alert from '../../../components/ui/Alert';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Card, CardBody, CardHeader, CardTitle } from '../../../components/ui/Card';
import ClientForm from './ClientForm';

const interactionTypes = ['LLAMADA', 'CORREO', 'PRESENCIAL', 'CHAT', 'OTRO'];
const followUpStatuses = ['PENDIENTE', 'EN_PROGRESO', 'COMPLETADO', 'CANCELADO'];

export default function ClientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('interactions');

  const [showEdit, setShowEdit] = useState(false);
  const [showInteraction, setShowInteraction] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);

  const [interactionForm, setInteractionForm] = useState({ type: 'LLAMADA', description: '' });
  const [followUpForm, setFollowUpForm] = useState({ status: 'PENDIENTE', description: '', dueDate: '', userId: '' });

  const fetchClient = () => {
    api.get(`/clients/${id}`)
      .then((r) => setClient(r.data.data))
      .catch((e) => setError(e.response?.data?.message || 'Error al cargar el cliente.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchClient(); }, [id]);

  useEffect(() => {
    api.get('/users', { params: { role: 'COLABORADOR' } })
      .then((r) => setCollaborators(r.data.data))
      .catch(() => {});
  }, []);

  const submitInteraction = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/clients/${id}/interactions`, interactionForm);
      setShowInteraction(false);
      setInteractionForm({ type: 'LLAMADA', description: '' });
      fetchClient();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo registrar la interacción.');
    }
  };

  const submitFollowUp = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/clients/${id}/followups`, followUpForm);
      setShowFollowUp(false);
      setFollowUpForm({ status: 'PENDIENTE', description: '', dueDate: '', userId: '' });
      fetchClient();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo crear el seguimiento.');
    }
  };

  const updateFollowUpStatus = async (followUpId, status) => {
    try {
      await api.put(`/clients/followups/${followUpId}`, { status });
      fetchClient();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo actualizar el seguimiento.');
    }
  };

  if (loading) return <Spinner size="lg" />;
  if (!client) return <div className="text-center text-gray-500">{error || 'Cliente no encontrado.'}</div>;

  return (
    <div className="space-y-6">
      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-xl font-bold text-primary-700">
              {client.firstName[0]}{client.lastName[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{client.firstName} {client.lastName}</h1>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant={client.status}>{client.status.replace(/_/g, ' ')}</Badge>
                <span className="text-xs text-gray-500">
                  Creado el {new Date(client.createdAt).toLocaleDateString('es-ES')}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowEdit(true)} className="btn-secondary">Editar ficha</button>
          <button onClick={() => navigate('/admin/clientes')} className="btn-secondary">← Volver</button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Información del cliente</CardTitle></CardHeader>
          <CardBody className="space-y-3 text-sm">
            <div>
              <p className="font-semibold text-gray-500">Correo electrónico</p>
              <p className="text-gray-800">{client.email || '—'}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-500">Teléfono</p>
              <p className="text-gray-800">{client.phone || '—'}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-500">Dirección</p>
              <p className="text-gray-800">{client.address || '—'}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-500">Responsable asignado</p>
              <p className="text-gray-800">
                {client.assignedUser ? `${client.assignedUser.firstName} ${client.assignedUser.lastName}` : 'Sin asignar'}
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-500">Registrado por</p>
              <p className="text-gray-800">{client.creator.firstName} {client.creator.lastName}</p>
            </div>
            {client.notes && (
              <div>
                <p className="font-semibold text-gray-500">Observaciones</p>
                <p className="whitespace-pre-wrap text-gray-800">{client.notes}</p>
              </div>
            )}
          </CardBody>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <div className="flex gap-2">
            <button
              onClick={() => setTab('interactions')}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'interactions' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
            >
              Interacciones ({client.interactions.length})
            </button>
            <button
              onClick={() => setTab('followups')}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'followups' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
            >
              Seguimientos ({client.followUps.length})
            </button>
          </div>

          {tab === 'interactions' ? (
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Historial de interacciones</CardTitle>
                <button onClick={() => setShowInteraction(true)} className="btn-primary text-xs">+ Registrar</button>
              </CardHeader>
              <CardBody>
                {client.interactions.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-500">No hay interacciones registradas.</p>
                ) : (
                  <ul className="space-y-4">
                    {client.interactions.map((i) => (
                      <li key={i.id} className="rounded-lg border border-gray-100 p-4">
                        <div className="flex items-center justify-between">
                          <Badge variant={i.type}>{i.type}</Badge>
                          <span className="text-xs text-gray-400">
                            {new Date(i.createdAt).toLocaleString('es-ES')} · {i.user.firstName} {i.user.lastName}
                          </span>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{i.description}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Seguimientos</CardTitle>
                <button onClick={() => setShowFollowUp(true)} className="btn-primary text-xs">+ Nuevo seguimiento</button>
              </CardHeader>
              <CardBody>
                {client.followUps.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-500">No hay seguimientos registrados.</p>
                ) : (
                  <ul className="space-y-4">
                    {client.followUps.map((f) => (
                      <li key={f.id} className="rounded-lg border border-gray-100 p-4">
                        <div className="flex items-center justify-between">
                          <Badge variant={f.status}>{f.status.replace(/_/g, ' ')}</Badge>
                          <Select
                            className="w-40"
                            options={followUpStatuses.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))}
                            value={f.status}
                            onChange={(e) => updateFollowUpStatus(f.id, e.target.value)}
                          />
                        </div>
                        <p className="mt-2 text-sm text-gray-700">{f.description}</p>
                        <p className="mt-2 text-xs text-gray-400">
                          Responsable: {f.user.firstName} {f.user.lastName} · Creado {new Date(f.createdAt).toLocaleDateString('es-ES')}
                          {f.dueDate && <> · Vence {new Date(f.dueDate).toLocaleDateString('es-ES')}</>}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Editar cliente" size="lg">
        <ClientForm
          client={client}
          collaborators={collaborators}
          onSuccess={() => { setShowEdit(false); fetchClient(); }}
          onCancel={() => setShowEdit(false)}
        />
      </Modal>

      <Modal isOpen={showInteraction} onClose={() => setShowInteraction(false)} title="Registrar interacción">
        <form onSubmit={submitInteraction} className="space-y-4">
          <Select
            label="Tipo"
            options={interactionTypes.map((t) => ({ value: t, label: t }))}
            value={interactionForm.type}
            onChange={(e) => setInteractionForm({ ...interactionForm, type: e.target.value })}
          />
          <div>
            <label className="label-field">Descripción</label>
            <textarea
              className="input-field"
              rows="4"
              required
              value={interactionForm.description}
              onChange={(e) => setInteractionForm({ ...interactionForm, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowInteraction(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Guardar</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showFollowUp} onClose={() => setShowFollowUp(false)} title="Nuevo seguimiento">
        <form onSubmit={submitFollowUp} className="space-y-4">
          <div>
            <label className="label-field">Descripción</label>
            <textarea
              className="input-field"
              rows="3"
              required
              value={followUpForm.description}
              onChange={(e) => setFollowUpForm({ ...followUpForm, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Estado"
              options={followUpStatuses.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))}
              value={followUpForm.status}
              onChange={(e) => setFollowUpForm({ ...followUpForm, status: e.target.value })}
            />
            <Input
              label="Fecha límite"
              type="date"
              value={followUpForm.dueDate?.split('T')[0] || ''}
              onChange={(e) => setFollowUpForm({ ...followUpForm, dueDate: e.target.value })}
            />
          </div>
          <Select
            label="Responsable"
            options={[{ value: '', label: 'Yo mismo' }, ...collaborators.map((u) => ({ value: String(u.id), label: `${u.firstName} ${u.lastName}` }))]}
            value={followUpForm.userId}
            onChange={(e) => setFollowUpForm({ ...followUpForm, userId: e.target.value })}
          />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowFollowUp(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Crear seguimiento</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}