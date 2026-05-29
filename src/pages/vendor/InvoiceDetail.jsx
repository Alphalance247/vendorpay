import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, ZoomIn, ZoomOut, RotateCw, RefreshCw, Check, CheckCircle, Send } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusChip from '../../components/ui/StatusChip';

const AUDIT_LOG = [
  { time: '11:24 AM', user: 'System', action: 'Status changed to Reviewed' },
  { time: '10:58 AM', user: 'Sarah M.', action: 'Document verified by OCR' },
  { time: '09:41 AM', user: 'System', action: 'Invoice Uploaded' },
];

const LINE_ITEMS = [
  { description: 'International Freight Shipping', qty: 1, unitPrice: 8200, total: 8200 },
  { description: 'Customs Clearance Fees', qty: 1, unitPrice: 1290, total: 1290 },
  { description: 'Warehousing & Distribution', qty: 1, unitPrice: 2960, total: 2960 },
];

export default function InvoiceDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');

  const invoiceId = id || 'INV-2024-0082';
  const isAdmin = window.location.pathname.startsWith('/admin');

  return (
    <AppLayout role={isAdmin ? 'admin' : 'vendor'}>
      <div className="space-y-4">
        {/* Back + breadcrumb */}
        <button
          onClick={() => navigate(isAdmin ? '/admin/invoices' : '/vendor/invoices')}
          className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <ArrowLeft size={15} /> Back to Invoices
        </button>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wide">Invoice #{invoiceId}</p>
            <h1 className="text-2xl font-semibold text-on-surface mt-0.5">Nexus Global Logistics</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm">
              Request Changes
            </Button>
            {isAdmin ? (
              <>
                <Button variant="secondary" size="sm">Approve Invoice</Button>
                <Button size="sm">Mark as Paid</Button>
              </>
            ) : (
              <Button variant="secondary" size="sm">
                <Download size={14} /> Download
              </Button>
            )}
          </div>
        </div>

        {/* Approval workflow */}
        <Card className="py-4">
          <div className="flex items-center gap-0">
            {[
              { label: 'Submitted', date: 'Oct 10, 2024', user: 'By Alex Sterling', done: true, active: false },
              { label: 'Reviewed', date: 'Oct 12, 2024', user: 'By Sarah Jenkins GM', done: true, active: false },
              { label: 'Awaiting Payment', date: 'Est. Oct 21, 2024', user: '', done: false, active: true },
              { label: 'Disbursed', date: 'Payment Oct 28, 2024', user: '', done: false, active: false },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex items-center flex-1">
                <div className="flex flex-col items-center text-center min-w-[100px]">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1.5 border-2 ${step.done ? 'bg-emerald border-emerald' : step.active ? 'bg-white border-emerald' : 'bg-white border-outline-variant'}`}>
                    {step.done ? <Check size={13} className="text-white" /> : <span className={`w-2 h-2 rounded-full ${step.active ? 'bg-emerald' : 'bg-outline-variant'}`} />}
                  </div>
                  <p className={`text-xs font-semibold ${step.done || step.active ? 'text-on-surface' : 'text-outline'}`}>{step.label}</p>
                  {step.date && <p className="text-xs text-on-surface-variant">{step.date}</p>}
                  {step.user && <p className="text-xs text-outline">{step.user}</p>}
                </div>
                {i < arr.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mb-6 ${step.done ? 'bg-emerald' : 'bg-outline-variant'}`} />
                )}
              </div>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-4">
          {/* Invoice viewer */}
          <div className="col-span-2 space-y-4">
            {/* Meta */}
            <Card>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-on-surface-variant uppercase tracking-wide">Invoice From</p>
                  <p className="text-sm font-semibold text-on-surface mt-0.5">Nexus Global Logistics</p>
                  <p className="text-xs text-on-surface-variant">ID: VND-92311</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant uppercase tracking-wide">Invoice Date</p>
                  <p className="text-sm font-medium text-on-surface mt-0.5">Oct 10, 2024</p>
                  <p className="text-xs text-on-surface-variant">Due: Nov 10, 2024</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant uppercase tracking-wide">Amount</p>
                  <p className="text-xl font-bold tnum text-on-surface mt-0.5">$12,450.00</p>
                  <StatusChip status="Awaiting Payment" className="mt-1" />
                </div>
              </div>
            </Card>

            {/* PDF Viewer mock */}
            <Card className="p-0 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-outline-variant bg-surface-low">
                <span className="text-xs font-medium text-on-surface-variant">INV-2024-0082.pdf</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="p-1.5"><ZoomOut size={14} /></Button>
                  <span className="text-xs text-on-surface-variant">100%</span>
                  <Button variant="ghost" size="sm" className="p-1.5"><ZoomIn size={14} /></Button>
                  <Button variant="ghost" size="sm" className="p-1.5"><RotateCw size={14} /></Button>
                  <Button variant="ghost" size="sm" className="p-1.5"><Download size={14} /></Button>
                </div>
              </div>
              <div className="p-8 bg-surface-low">
                <div className="bg-white rounded border border-outline-variant p-8 max-w-lg mx-auto shadow-card">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <p className="text-xl font-bold text-on-surface">INVOICE</p>
                      <p className="text-xs text-on-surface-variant">Nexus Global Logistics</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-on-surface">INV-2024-0082</p>
                      <p className="text-xs text-on-surface-variant">Date: Oct 10, 2024</p>
                      <p className="text-xs text-on-surface-variant">Due: Nov 10, 2024</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 mb-8 text-xs">
                    <div>
                      <p className="font-semibold text-on-surface-variant uppercase tracking-wide mb-1">Bill From</p>
                      <p className="font-semibold">Nexus Global Logistics</p>
                      <p className="text-on-surface-variant">1121 Logistics Way</p>
                      <p className="text-on-surface-variant">Chicago, IL 60607</p>
                    </div>
                    <div>
                      <p className="font-semibold text-on-surface-variant uppercase tracking-wide mb-1">Bill To</p>
                      <p className="font-semibold">VendorPay Enterprise</p>
                      <p className="text-on-surface-variant">One Financial Plaza</p>
                      <p className="text-on-surface-variant">New York, NY 10004</p>
                    </div>
                  </div>

                  <table className="w-full text-xs mb-6">
                    <thead>
                      <tr className="border-b border-outline-variant">
                        <th className="text-left py-2 text-on-surface-variant font-semibold uppercase tracking-wide">Description</th>
                        <th className="text-right py-2 text-on-surface-variant font-semibold uppercase tracking-wide">Qty</th>
                        <th className="text-right py-2 text-on-surface-variant font-semibold uppercase tracking-wide">Unit Price</th>
                        <th className="text-right py-2 text-on-surface-variant font-semibold uppercase tracking-wide">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {LINE_ITEMS.map((item) => (
                        <tr key={item.description}>
                          <td className="py-2">{item.description}</td>
                          <td className="py-2 text-right tnum">{item.qty}</td>
                          <td className="py-2 text-right tnum">${item.unitPrice.toLocaleString()}.00</td>
                          <td className="py-2 text-right tnum font-semibold">${item.total.toLocaleString()}.00</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-outline-variant">
                        <td colSpan={3} className="py-2 text-right font-semibold">Subtotal</td>
                        <td className="py-2 text-right tnum font-semibold">$12,450.00</td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="py-1 text-right text-on-surface-variant">Tax 0%</td>
                        <td className="py-1 text-right tnum">$0.00</td>
                      </tr>
                      <tr className="border-t-2 border-on-surface">
                        <td colSpan={3} className="py-2 text-right font-bold">Total:</td>
                        <td className="py-2 text-right tnum font-bold text-base">$12,450.00</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </Card>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Internal notes */}
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-3">Internal Notes</p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a private note for internal teams..."
                rows={3}
                className="w-full rounded border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface placeholder:text-outline resize-none focus:outline-none focus:ring-2 focus:ring-emerald text-xs"
              />
              <Button variant="secondary" size="sm" className="mt-2 w-full">
                Save Note
              </Button>
            </Card>

            {/* Audit log */}
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-3">Audit Log</p>
              <div className="space-y-3">
                {AUDIT_LOG.map(({ time, user, action }) => (
                  <div key={action} className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-on-surface">{action}</p>
                      <p className="text-xs text-outline">{user} · {time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Messages */}
            <Card className="p-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-outline-variant">
                <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Messages</p>
              </div>
              <div className="p-4 space-y-3 max-h-48 overflow-y-auto">
                <div className="bg-navy rounded-lg rounded-tl-none p-3 max-w-[85%]">
                  <p className="text-xs text-slate-300 mb-1">Sam Jenkins · 11:30 AM</p>
                  <p className="text-xs text-white">Can you confirm the freight charge breakdown? The total looks different from the quote.</p>
                </div>
                <div className="bg-surface-container rounded-lg rounded-tr-none p-3 max-w-[85%] ml-auto">
                  <p className="text-xs text-on-surface-variant mb-1">You · 11:35 AM</p>
                  <p className="text-xs text-on-surface">Yes — I've attached the revised breakdown in the notes section. The fuel surcharge was added by NCL.</p>
                </div>
              </div>
              <div className="flex gap-2 px-4 py-3 border-t border-outline-variant">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 text-xs border border-outline-variant rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald"
                />
                <Button size="sm" className="p-1.5">
                  <Send size={14} />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
