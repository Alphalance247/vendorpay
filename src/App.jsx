import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import Support from './pages/vendor/Support';
import VendorDetail from './pages/admin/VendorDetail';  // ← ADD THIS LINE

export default function App() {
  return (
    <ToastProvider>
    <InvoiceProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Vendor routes */}
          <Route path="/vendor/dashboard" element={<VendorDashboard />} />
          <Route path="/vendor/invoices" element={<InvoiceHistory />} />
          <Route path="/vendor/invoices/new" element={<SubmitInvoice />} />
          <Route path="/vendor/invoices/:id" element={<InvoiceDetail />} />
          <Route path="/vendor/payments" element={<VendorPayments />} />
          <Route path="/vendor/support" element={<Support />} />

          {/* Admin routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/support" element={<Support admin />} />
          <Route path="/admin/vendors" element={<AdminVendors />} />
          <Route path="/admin/vendors/:id" element={<VendorDetail />} />  // ← ADD THIS LINE
          <Route path="/admin/invoices" element={<AdminInvoiceManagement />} />
          <Route path="/admin/invoices/:id" element={<InvoiceDetail />} />
          <Route path="/admin/payments" element={<AdminPayments />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </InvoiceProvider>
    </ToastProvider>
  );
}