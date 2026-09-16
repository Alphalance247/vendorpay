import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../lib/authContext';
import { isVendorRole, dashboardPathForRole } from '../../lib/utils';

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

  // Vendor is the only role gated to /vendor/*; every other role (admin,
  // owner, staff, member, ...) belongs on /admin/*.
  const hasAccess = isVendorRole(role)
    ? requiredRole === 'vendor'
    : requiredRole === 'admin';
  if (!hasAccess) {
    return <Navigate to={dashboardPathForRole(role)} replace />;
  }

  if (requiredRole === 'vendor' && isOnboarded === false) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}
