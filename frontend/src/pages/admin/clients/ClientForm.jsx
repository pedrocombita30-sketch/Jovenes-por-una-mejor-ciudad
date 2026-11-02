import { useState } from 'react';
import api from '../../../api/axios';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Alert from '../../../components/ui/Alert';

const statusOptions = ['NUEVO', 'CONTACTADO', 'EN_SEGUIMIENTO', 'ATENDIDO', 'FINALIZADO'];

export default function ClientForm({ client, collaborators, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    firstName: client?.firstName || '',
    lastName: client?.lastName || '',
    email: client?.email || '',
    phone: client?.phone || '',
    address: client?.address || '',
    birthDate: client?.birthDate || '',
    status: client?.status || 'NUEVO',
    notes: client?.notes || '',
    assignedTo: client?.assignedTo ? String(client.assignedTo) : '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        assignedTo: form.assignedTo ? Number(form.assignedTo) : null,
      };
      if (client) {
        await api.put(`/clients/${client.id}`, payload);
      } else {
        await api.post('/clients', payload);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar el cliente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Nombre"
          required
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
        />
        <Input
          label="Apellido"
          required
          value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Correo electrónico"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Input
          label="Teléfono"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
      </div>

      <Input
        label="Dirección"
        value={form.address}
        onChange={(e) => setForm({ ...form, address: e.target.value })}
      />

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Estado"
          options={statusOptions.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))}
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        />
        <Select
          label="Responsable de seguimiento"
          options={[{ value: '', label: 'Sin asignar' }, ...(collaborators || []).map((u) => ({ value: String(u.id), label: `${u.firstName} ${u.lastName}` }))]}
          value={form.assignedTo}
          onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
        />
      </div>

      <div>
        <label className="label-field">Observaciones</label>
        <textarea
          className="input-field"
          rows="3"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>}
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Guardando...' : client ? 'Guardar cambios' : 'Crear cliente'}
        </button>
      </div>
    </form>
  );
}