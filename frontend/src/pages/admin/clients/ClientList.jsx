import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import Spinner from '../../../components/ui/Spinner';
import Badge from '../../../components/ui/Badge';
import Alert from '../../../components/ui/Alert';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Table from '../../../components/ui/Table';
import ClientForm from './ClientForm';

const statusOptions = ['NUEVO', 'CONTACTADO', 'EN_SEGUIMIENTO', 'ATENDIDO', 'FINALIZADO'];

export default function ClientList() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ search: '', status: '', assignedTo: '' });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [showCreate, setShowCreate] = useState(false);

  const fetchClients = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (filters.search) params.set('search', filters.search);
      if (filters.status) params.set('status', filters.status);
      if (filters.assignedTo) params.set('assignedTo', filters.assignedTo);

      const { data } = await api.get(`/clients?${params.toString()}`);
      setClients(data.data);
      setPagination(data.pagination);
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar los clientes.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchClients(1);
  }, [fetchClients]);

  useEffect(() => {
    api.get('/users', { params: { role: 'COLABORADOR' } })
      .then((r) => setCollaborators(r.data.data))
      .catch(() => {});
  }, []);

  const columns = [
    { key: 'name', label: 'Cliente', render: (c) => <span className="font-medium text-gray-800">{c.firstName} {c.lastName}</span> },
    { key: 'email', label: 'Correo', render: (c) => c.email || '—' },
    { key: 'phone', label: 'Teléfono', render: (c) => c.phone || '—' },
    { key: 'status', label: 'Estado', render: (c) => <Badge variant={c.status}>{c.status.replace(/_/g, ' ')}</Badge> },
    { key: 'assigned', label: 'Responsable', render: (c) => c.assignedUser ? `${c.assignedUser.firstName} ${c.assignedUser.lastName}` : '—' },
    { key: 'interactions', label: 'Interacciones', render: (c) => c._count.interactions },
  ];

  return (
    <div>
      {error && <div className="mb-4"><Alert type="error" onClose={() => setError('')}>{error}</Alert></div>}

      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <Input
            label="Buscar cliente"
            placeholder="Nombre, correo o teléfono..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <div className="w-44">
          <Select
            label="Estado"
            options={[{ value: '', label: 'Todos' }, ...statusOptions.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))]}
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          />
        </div>
        <div className="w-44">
          <Select
            label="Responsable"
            options={[{ value: '', label: 'Todos' }, ...collaborators.map((u) => ({ value: String(u.id), label: `${u.firstName} ${u.lastName}` }))]}
            value={filters.assignedTo}
            onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}
          />
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          + Nuevo cliente
        </button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <Spinner />
        ) : clients.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-500">No se encontraron clientes.</p>
        ) : (
          <Table columns={columns} data={clients} onRowClick={(c) => navigate(`/admin/clientes/${c.id}`)} />
        )}

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-sm">
            <p className="text-gray-500">
              Página {pagination.page} de {pagination.pages} · {pagination.total} clientes
            </p>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchClients(pagination.page - 1)}
                className="btn-secondary text-xs"
              >
                Anterior
              </button>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchClients(pagination.page + 1)}
                className="btn-secondary text-xs"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nuevo cliente" size="lg">
        <ClientForm
          collaborators={collaborators}
          onSuccess={() => { setShowCreate(false); fetchClients(1); }}
        />
      </Modal>
    </div>
  );
}