import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../ui/Spinner';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner size="lg" />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function AdminRoute({ children }) {
  const { user, loading, hasRole } = useAuth();
  if (loading) return <Spinner size="lg" />;
  if (!user) return <Navigate to="/login" replace />;
  if (!hasRole('ADMIN')) return <Navigate to="/admin" replace />;
  return children;
}