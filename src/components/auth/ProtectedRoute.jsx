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
    return <Navigate to="/vendorpay/login" replace />;
  }

  if (role !== requiredRole) {
    const fallback = role === 'admin'
      ? '/vendorpay/admin/dashboard'
      : '/vendorpay/vendor/dashboard';
    return <Navigate to={fallback} replace />;
  }

  if (requiredRole === 'vendor' && isOnboarded === false) {
    return <Navigate to="/vendorpay/onboarding" replace />;
  }

  return children;
}
