import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../lib/authContext';

export default function ProtectedRoute({ children, role: requiredRole }) {
  const { role, loading, isOnboarded } = useAuth();
  const token = localStorage.getItem('access_token');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-emerald" />
      </div>
    );
  }

  if (!token || !role) {
    return <Navigate to="/login" replace />;
  }

  if (role !== requiredRole) {
    const fallback = role === 'admin'
      ? '/admin/dashboard'
      : '/vendor/dashboard';
    return <Navigate to={fallback} replace />;
  }

  if (requiredRole === 'vendor' && isOnboarded === false) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}
