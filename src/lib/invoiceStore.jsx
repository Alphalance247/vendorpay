import { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'vendorpay.invoices';

const SEED_INVOICES = [
  { id: 'INV-2024-001', date: '2024-10-14', dueDate: '2024-10-28', amount: 52400, currency: 'USD', status: 'Paid', paymentDate: '2024-10-28', fileName: 'acme-oct.pdf' },
  { id: 'INV-2024-005', date: '2024-10-31', dueDate: '2024-11-15', amount: 4200, currency: 'USD', status: 'InProgress', paymentDate: 'Est. Nov 14', fileName: 'consulting-q4.pdf' },
  { id: 'INV-2024-008', date: '2024-10-28', dueDate: '2024-11-27', amount: 19900, currency: 'USD', status: 'Submitted', paymentDate: '—', fileName: 'services-oct.pdf' },
  { id: 'INV-2024-009', date: '2024-10-15', dueDate: '2024-10-29', amount: 8320, currency: 'USD', status: 'Flagged', paymentDate: 'Payment Delayed', fileName: 'materials.pdf' },
  { id: 'INV-2024-006', date: '2024-09-02', dueDate: '2024-09-16', amount: 33000, currency: 'USD', status: 'Paid', paymentDate: '2024-09-15', fileName: 'design-sept.pdf' },
];

const InvoiceContext = createContext(null);

function loadInitial() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fall through
  }
  return SEED_INVOICES;
}

export function InvoiceProvider({ children }) {
  const [invoices, setInvoices] = useState(loadInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
    } catch {
      // ignore quota errors
    }
  }, [invoices]);

  function addInvoice(invoice) {
    setInvoices((list) => [
      {
        status: 'Submitted',
        paymentDate: '—',
        currency: 'USD',
        ...invoice,
      },
      ...list,
    ]);
  }

  return (
    <InvoiceContext.Provider value={{ invoices, addInvoice }}>
      {children}
    </InvoiceContext.Provider>
  );
}

export function useInvoices() {
  const ctx = useContext(InvoiceContext);
  if (!ctx) throw new Error('useInvoices must be used inside InvoiceProvider');
  return ctx;
}
