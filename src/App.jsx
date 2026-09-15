import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import AcceptInvite from './pages/auth/AcceptInvite';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/auth/Login';
import { useAuth } from './lib/authContext';
import { resolveTenant } from './lib/tenantResolver';
import WorkspaceNotFound from './pages/marketing/WorkspaceNotFound';
import Onboarding from './pages/onboarding/Onboarding';
import VendorDashboard from './pages/vendor/VendorDashboard';
import InvoiceHistory from './pages/vendor/InvoiceHistory';
import SubmitInvoice from './pages/vendor/SubmitInvoice';
import InvoiceDetail from './pages/vendor/InvoiceDetail';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminInvoiceManagement from './pages/admin/AdminInvoiceManagement';
import AdminVendors from './pages/admin/AdminVendors';
import AdminPayments from './pages/admin/AdminPayments';
import TeamRoles from './pages/admin/TeamRoles';
import Billing from './pages/admin/Billing';
import { InvoiceProvider } from './lib/invoiceStore';
import { ToastProvider } from './components/ui/Toast';
import VendorPayments from './pages/vendor/VendorPayments';
import Support from './pages/vendor/Support';  // used for both vendor & admin support
import VendorDetail from './pages/admin/VendorDetail';
import VendorProfile from './pages/vendor/VendorProfile';
import Landing from './pages/marketing/Landing';
import CompanySignup from './pages/signup/CompanySignup';

export default function App() {
  const tenant = useMemo(() => resolveTenant(), []);
  const { role, loading } = useAuth();

  if (tenant.status === 'not_found') {
    return <WorkspaceNotFound slug={tenant.slug} rootDomain={tenant.rootDomain} />;
  }

  const token = localStorage.getItem('access_token');
  const homeElement =
    tenant.status !== 'found' ? <Landing /> :
    loading ? (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-emerald" />
      </div>
    ) :
    token && role ? <Navigate to={role === 'admin' ? '/admin/dashboard' : '/vendor/dashboard'} replace /> :
    <Navigate to="/login" replace />;

  return (
    <ToastProvider>
    <InvoiceProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={homeElement} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/signup-company" element={<CompanySignup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Vendor routes */}
          <Route path="/vendor/dashboard" element={<ProtectedRoute role="vendor"><VendorDashboard /></ProtectedRoute>} />
          <Route path="/vendor/invoices" element={<ProtectedRoute role="vendor"><InvoiceHistory /></ProtectedRoute>} />
          <Route path="/vendor/invoices/new" element={<ProtectedRoute role="vendor"><SubmitInvoice /></ProtectedRoute>} />
          <Route path="/vendor/invoices/:id" element={<ProtectedRoute role="vendor"><InvoiceDetail /></ProtectedRoute>} />
          <Route path="/vendor/payments" element={<ProtectedRoute role="vendor"><VendorPayments /></ProtectedRoute>} />
          <Route path="/vendor/support" element={<ProtectedRoute role="vendor"><Support /></ProtectedRoute>} />
          <Route path="/vendor/profile" element={<ProtectedRoute role="vendor"><VendorProfile /></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/support" element={<ProtectedRoute role="admin"><Support admin /></ProtectedRoute>} />
          <Route path="/admin/vendors" element={<ProtectedRoute role="admin"><AdminVendors /></ProtectedRoute>} />
          <Route path="/admin/vendors/:id" element={<ProtectedRoute role="admin"><VendorDetail /></ProtectedRoute>} />
          <Route path="/admin/invoices" element={<ProtectedRoute role="admin"><AdminInvoiceManagement /></ProtectedRoute>} />
          <Route path="/admin/invoices/:id" element={<ProtectedRoute role="admin"><InvoiceDetail /></ProtectedRoute>} />
          <Route path="/admin/payments" element={<ProtectedRoute role="admin"><AdminPayments /></ProtectedRoute>} />
          <Route path="/admin/team" element={<ProtectedRoute role="admin"><TeamRoles /></ProtectedRoute>} />
          <Route path="/admin/billing" element={<ProtectedRoute role="admin"><Billing /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </InvoiceProvider>
    </ToastProvider>
  );
}