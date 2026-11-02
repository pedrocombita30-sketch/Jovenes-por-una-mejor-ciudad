import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import Spinner from '../../../components/ui/Spinner';
import Badge from '../../../components/ui/Badge';
import Alert from '../../../components/ui/Alert';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Table from '../../../components/ui/Table';

const roleLabels = { ADMIN: 'Administrador', COLABORADOR: 'Colaborador', CLIENTE: 'Usuario/Cliente' };

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchUsers = () => {
    setLoading(true);
    setError('');
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    api.get(`/users${params}`)
      .then((r) => setUsers(r.data.data))
      .catch((e) => setError(e.response?.data?.message || 'Error al cargar usuarios.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [search]);

  const handleToggle = async (user) => {
    if (user.isActive) {
      if (!window.confirm(`¿Desactivar a ${user.firstName} ${user.lastName}?`)) return;
      try { await api.delete(`/users/${user.id}`); fetchUsers(); }
      catch (e) { setError(e.response?.data?.message || 'Error.'); }
    } else {
      try { await api.put(`/users/${user.id}`, { isActive: true }); fetchUsers(); }
      catch (e) { setError(e.response?.data?.message || 'Error.'); }
    }
  };

  const columns = [
    { key: 'name', label: 'Usuario', render: (u) => (
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
          {u.firstName[0]}{u.lastName[0]}
        </div>
        <span className="font-medium text-gray-800">{u.firstName} {u.lastName}</span>
      </div>
    ) },
    { key: 'email', label: 'Correo', render: (u) => u.email },
    { key: 'role', label: 'Rol', render: (u) => <Badge variant={u.role.name}>{roleLabels[u.role.name]}</Badge> },
    { key: 'phone', label: 'Teléfono', render: (u) => u.phone || '—' },
    { key: 'status', label: 'Estado', render: (u) => (
      <Badge variant={u.isActive ? 'ACTIVA' : 'CERRADA'}>{u.isActive ? 'Activo' : 'Inactivo'}</Badge>
    ) },
    { key: 'actions', label: 'Acciones', render: (u) => (
      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => setEditing(u)} className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 hover:bg-blue-200">Editar</button>
        <button onClick={() => handleToggle(u)} className={`rounded px-2 py-1 text-xs ${u.isActive ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}>
          {u.isActive ? 'Desactivar' : 'Activar'}
        </button>
      </div>
    ) },
  ];

  return (
    <div>
      {error && <div className="mb-4"><Alert type="error" onClose={() => setError('')}>{error}</Alert></div>}

      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <Input
            label="Buscar usuario"
            placeholder="Nombre, correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">+ Nuevo usuario</button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <Spinner />
        ) : users.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-500">No hay usuarios.</p>
        ) : (
          <Table columns={columns} data={users} />
        )}
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nuevo usuario" size="lg">
        <UserForm onSuccess={() => { setShowCreate(false); fetchUsers(); }} />
      </Modal>

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Editar usuario" size="lg">
        {editing && <UserForm user={editing} onSuccess={() => { setEditing(null); fetchUsers(); }} />}
      </Modal>
    </div>
  );
}

function UserForm({ user, onSuccess }) {
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role?.name || 'CLIENTE',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const assignableRoles = user?.role?.name === 'ADMIN' ? ['ADMIN', 'COLABORADOR', 'CLIENTE'] : ['COLABORADOR', 'CLIENTE'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (user) {
        const payload = { firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone, role: form.role };
        if (form.password) payload.password = form.password;
        await api.put(`/users/${user.id}`, payload);
      } else {
        if (form.password.length < 8) {
          setError('La contraseña debe tener al menos 8 caracteres.');
          setLoading(false);
          return;
        }
        await api.post('/users', form);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar el usuario.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
      <div className="grid grid-cols-2 gap-3">
        <Input label="Nombre" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
        <Input label="Apellido" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
      </div>
      <Input label="Correo electrónico" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      <Select
        label="Rol"
        options={assignableRoles.map((r) => ({ value: r, label: roleLabels[r] }))}
        value={form.role}
        onChange={(e) => setForm({ ...form, role: e.target.value })}
      />
      <Input
        label={user ? 'Nueva contraseña (opcional)' : 'Contraseña'}
        type="password"
        required={!user}
        placeholder="Mínimo 8 caracteres"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}