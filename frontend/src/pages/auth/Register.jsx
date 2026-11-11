import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo completar el registro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-600 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <img src="/logo.png" alt="Logo" className="mx-auto mb-3 h-14 w-14 rounded-full object-cover" />
          <h1 className="text-2xl font-bold text-white">Crea tu cuenta</h1>
          <p className="text-white/80">Únete a nuestra comunidad</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-xl">
          {error && <div className="mb-4"><Alert type="error" onClose={() => setError('')}>{error}</Alert></div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Nombre"
                id="firstName"
                required
                placeholder="Nombre"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
              <Input
                label="Apellido"
                id="lastName"
                required
                placeholder="Apellido"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>
            <Input
              label="Correo electrónico"
              id="email"
              type="email"
              required
              placeholder="tu@correo.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Teléfono"
              id="phone"
              placeholder="+57-351-555-0221"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              label="Contraseña"
              id="password"
              type="password"
              required
              placeholder="Mínimo 8 caracteres"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <Input
              label="Confirmar contraseña"
              id="confirmPassword"
              type="password"
              required
              placeholder="Repite la contraseña"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            />
            <button type="submit" disabled={loading} className="btn-primary w-full text-base">
              {loading ? 'Creando cuenta...' : 'Registrarme'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-500">¿Ya tienes cuenta? </span>
            <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
              Inicia sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}