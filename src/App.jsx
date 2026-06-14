import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
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
      <BrowserRouter basename="/vendorpay-fr">
        <Routes>
          <Route path="/" element={<Navigate to="/vendorpay/login" replace />} />
          <Route path="/vendorpay/login" element={<Login />} />
          <Route path="/vendorpay/register" element={<Register />} />
          <Route path="/vendorpay/forgot-password" element={<ForgotPassword />} />
          <Route path="/vendorpay/onboarding" element={<Onboarding />} />

          {/* Vendor routes */}
          <Route path="/vendorpay/vendor/dashboard" element={<VendorDashboard />} />
          <Route path="/vendorpay/vendor/invoices" element={<InvoiceHistory />} />
          <Route path="/vendorpay/vendor/invoices/new" element={<SubmitInvoice />} />
          <Route path="/vendorpay/vendor/invoices/:id" element={<InvoiceDetail />} />
          <Route path="/vendorpay/vendor/payments" element={<VendorPayments />} />
          <Route path="/vendorpay/vendor/support" element={<Support />} />

          {/* Admin routes */}
          <Route path="/vendorpay/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/vendorpay/admin/support" element={<Support admin />} />
          <Route path="/vendorpay/admin/vendors" element={<AdminVendors />} />
          <Route path="/vendorpay/admin/vendors/:id" element={<VendorDetail />} />
          <Route path="/vendorpay/admin/invoices" element={<AdminInvoiceManagement />} />
          <Route path="/vendorpay/admin/invoices/:id" element={<InvoiceDetail />} />
          <Route path="/vendorpay/admin/payments" element={<AdminPayments />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/vendorpay/login" replace />} />
        </Routes>
      </BrowserRouter>
    </InvoiceProvider>
    </ToastProvider>
  );
}