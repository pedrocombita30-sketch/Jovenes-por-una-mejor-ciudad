import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role !== 'CLIENTE' ? '/admin' : from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-600 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <img src="/logo.png" alt="Logo" className="mx-auto mb-3 h-14 w-14 rounded-full object-cover" />
          <h1 className="text-2xl font-bold text-white">Jóvenes por una Mejor Ciudad</h1>
          <p className="text-white/80">Inicia sesión en tu cuenta</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-xl">
          {error && <div className="mb-4"><Alert type="error" onClose={() => setError('')}>{error}</Alert></div>}
          <form onSubmit={handleSubmit} className="space-y-4">
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
              label="Contraseña"
              id="password"
              type="password"
              required
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button type="submit" disabled={loading} className="btn-primary w-full text-base">
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-500">¿No tienes cuenta? </span>
            <Link to="/registro" className="font-semibold text-primary-600 hover:text-primary-700">
              Regístrate aquí
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}