import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/auth/Login';
import Onboarding from './pages/onboarding/Onboarding';
import VendorDashboard from './pages/vendor/VendorDashboard';
import InvoiceHistory from './pages/vendor/InvoiceHistory';
import SubmitInvoice from './pages/vendor/SubmitInvoice';
import InvoiceDetail from './pages/vendor/InvoiceDetail';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminInvoiceManagement from './pages/admin/AdminInvoiceManagement';
import AdminVendors from './pages/admin/AdminVendors';
import AdminPayments from './pages/admin/AdminPayments';
import { InvoiceProvider } from './lib/invoiceStore';
import { ToastProvider } from './components/ui/Toast';
import VendorPayments from './pages/vendor/VendorPayments';
import Support from './pages/vendor/Support';  // used for both vendor & admin support
import VendorDetail from './pages/admin/VendorDetail';
import VendorProfile from './pages/vendor/VendorProfile';

export default function App() {
  return (
    <ToastProvider>
    <InvoiceProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
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

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </InvoiceProvider>
    </ToastProvider>
  );
}