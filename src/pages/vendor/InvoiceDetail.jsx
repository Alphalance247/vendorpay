import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Check, Send, Bot, User, Loader2 } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusChip from '../../components/ui/StatusChip';
import { useAuth } from '../../lib/authContext';
import { invoiceService, adminInvoiceService } from '../../lib/services/invoiceService';
import { formatCurrency, formatDate } from '../../lib/utils';

export default function InvoiceDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const [aiMessages, setAiMessages] = useState([
    { role: 'ai', text: `Hi! I can help you with invoice ${id}. Ask me about payment status, due dates, or any concerns.` }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiTyping, setAiTyping] = useState(false);

  useEffect(() => {
    const fetch = isAdmin
      ? invoiceService.getAdminInvoiceDetail(id)
      : invoiceService.getMyInvoiceDetail(id);

    fetch
      .then(setInvoice)
      .catch(() => setError('Invoice not found.'))
      .finally(() => setLoading(false));
  }, [id, isAdmin]);

  async function handleApprove() {
    setActionLoading('approve');
    try {
      await adminInvoiceService.approveInvoice(id);
      const updated = await invoiceService.getAdminInvoiceDetail(id);
      setInvoice(updated);
    } catch {
      // error handled silently — user sees unchanged status
    } finally {
      setActionLoading('');
    }
  }

  async function handleMarkPaid() {
    setActionLoading('paid');
    try {
      await adminInvoiceService.markPaid(id);
      const updated = await invoiceService.getAdminInvoiceDetail(id);
      setInvoice(updated);
    } catch {
      // error handled silently
    } finally {
      setActionLoading('');
    }
  }

  function handleDownload() {
    if (isAdmin) {
      invoiceService.downloadAdminInvoicePdf(id);
    } else {
      invoiceService.downloadInvoicePdf(id);
    }
  }

  function sendAiMessage() {
    if (!aiInput.trim() || !invoice) return;
    setAiMessages(prev => [...prev, { role: 'user', text: aiInput }]);
    const question = aiInput.toLowerCase();
    setAiInput('');
    setAiTyping(true);
    setTimeout(() => {
      let response = '';
      if (question.includes('payment') || question.includes('when') || question.includes('paid')) {
        response = invoice.status === 'paid'
          ? `This invoice was paid on ${formatDate(invoice.payment_date)}.`
          : invoice.status === 'funding'
          ? `Payment is in progress. Expected disbursement within 5-7 business days.`
          : `This invoice is ${invoice.status}. Payment will be processed after approval.`;
      } else if (question.includes('status')) {
        response = `Current status: ${invoice.status}.`;
      } else if (question.includes('amount') || question.includes('money') || question.includes('how much')) {
        response = `Amount: ${formatCurrency(invoice.amount, invoice.currency)}.`;
      } else if (question.includes('date') || question.includes('due')) {
        response = `Submitted: ${formatDate(invoice.submitted_at)}. Due: ${invoice.due_date ? formatDate(invoice.due_date) : 'Not specified'}.`;
      } else {
        response = `I can help with payment timing, invoice status, amount details, or due dates. What would you like to know about invoice ${invoice.invoice_number}?`;
      }
      setAiMessages(prev => [...prev, { role: 'ai', text: response }]);
      setAiTyping(false);
    }, 800);
  }

  const backPath = isAdmin ? '/vendorpay/admin/invoices' : '/vendorpay/vendor/invoices';

  if (loading) {
    return (
      <AppLayout role={isAdmin ? 'admin' : 'vendor'}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={28} className="animate-spin text-emerald" />
        </div>
      </AppLayout>
    );
  }

  if (error || !invoice) {
    return (
      <AppLayout role={isAdmin ? 'admin' : 'vendor'}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <FileText size={48} className="text-outline" />
          <p className="text-lg text-on-surface">Invoice not found</p>
          <p className="text-sm text-on-surface-variant">ID: {id}</p>
          <Button onClick={() => navigate(backPath)}>Back to Invoices</Button>
        </div>
      </AppLayout>
    );
  }

  const statusMap = { submitted: 'Submitted', reviewed: 'Reviewed', funding: 'Awaiting Payment', paid: 'Paid', rejected: 'Rejected', flagged: 'Flagged' };
  const displayStatus = statusMap[invoice.status] ?? invoice.status;

  const workflowSteps = [
    { label: 'Submitted', date: formatDate(invoice.submitted_at), user: 'By Vendor', done: true, active: false },
    { label: 'Reviewed', date: ['reviewed', 'funding', 'paid'].includes(invoice.status) ? formatDate(invoice.submitted_at) : '', user: ['reviewed', 'funding', 'paid'].includes(invoice.status) ? 'By Finance Team' : '', done: ['reviewed', 'funding', 'paid'].includes(invoice.status), active: invoice.status === 'submitted' },
    { label: 'Awaiting Payment', date: ['funding', 'paid'].includes(invoice.status) && invoice.due_date ? 'Est. ' + formatDate(invoice.due_date) : '', user: '', done: ['funding', 'paid'].includes(invoice.status), active: invoice.status === 'reviewed' },
    { label: 'Disbursed', date: invoice.payment_date ? 'Payment ' + formatDate(invoice.payment_date) : '', user: '', done: invoice.status === 'paid', active: invoice.status === 'funding' },
  ];

  return (
    <AppLayout role={isAdmin ? 'admin' : 'vendor'}>
      <div className="space-y-4">
        <button
          onClick={() => navigate(backPath)}
          className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <ArrowLeft size={15} /> Back to Invoices
        </button>

        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wide">Invoice #{invoice.invoice_number}</p>
            <h1 className="text-2xl font-semibold text-on-surface mt-0.5">Invoice Details</h1>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <>
                {invoice.status === 'submitted' && (
                  <Button variant="secondary" size="sm" onClick={handleApprove} disabled={!!actionLoading}>
                    {actionLoading === 'approve' ? <Loader2 size={14} className="animate-spin" /> : 'Approve Invoice'}
                  </Button>
                )}
                {invoice.status === 'funding' && (
                  <Button size="sm" onClick={handleMarkPaid} disabled={!!actionLoading}>
                    {actionLoading === 'paid' ? <Loader2 size={14} className="animate-spin" /> : 'Mark as Paid'}
                  </Button>
                )}
              </>
            ) : (
              <Button variant="secondary" size="sm" onClick={handleDownload}>
                <Download size={14} /> Download
              </Button>
            )}
          </div>
        </div>

        <Card className="py-4">
          <div className="flex items-center gap-0">
            {workflowSteps.map((step, i, arr) => (
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
          <div className="col-span-2 space-y-4">
            <Card>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-on-surface-variant uppercase tracking-wide">Invoice #</p>
                  <p className="text-sm font-semibold text-on-surface mt-0.5">{invoice.invoice_number}</p>
                  <p className="text-xs text-on-surface-variant">ID: {invoice.id}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant uppercase tracking-wide">Invoice Date</p>
                  <p className="text-sm font-medium text-on-surface mt-0.5">{formatDate(invoice.submitted_at)}</p>
                  <p className="text-xs text-on-surface-variant">Due: {invoice.due_date ? formatDate(invoice.due_date) : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant uppercase tracking-wide">Amount</p>
                  <p className="text-xl font-bold tnum text-on-surface mt-0.5">
                    {formatCurrency(invoice.amount, invoice.currency)}
                  </p>
                  <StatusChip status={displayStatus} className="mt-1" />
                </div>
              </div>
              {invoice.notes && (
                <div className="mt-4 pt-4 border-t border-outline-variant">
                  <p className="text-xs text-on-surface-variant uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-sm text-on-surface">{invoice.notes}</p>
                </div>
              )}
            </Card>

            <Card className="p-0 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-outline-variant bg-surface-low">
                <span className="text-xs font-medium text-on-surface-variant">Invoice Document</span>
                <Button variant="ghost" size="sm" className="p-1.5" onClick={handleDownload}>
                  <Download size={14} />
                </Button>
              </div>
              <div className="p-8 bg-surface-low min-h-[200px] flex items-center justify-center">
                <div className="text-center">
                  <FileText size={48} className="text-outline mx-auto mb-3" />
                  <p className="text-sm text-on-surface-variant">Click download to view the PDF</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-3">Audit Log</p>
              <div className="space-y-3">
                {invoice.audit_logs?.length > 0 ? invoice.audit_logs.map((log, i) => (
                  <div key={i} className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-on-surface">{log.action}{log.notes ? ` — ${log.notes}` : ''}</p>
                      <p className="text-xs text-outline">{log.performed_by} · {formatDate(log.timestamp)}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-on-surface-variant">No audit events yet.</p>
                )}
              </div>
            </Card>

            <Card className="p-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-outline-variant bg-navy">
                <div className="flex items-center gap-2">
                  <Bot size={14} className="text-emerald" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald">AI Support</p>
                  <span className="ml-auto text-xs text-emerald bg-emerald/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-emerald animate-pulse" />
                    Online
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-3 max-h-[200px] overflow-y-auto bg-surface-low/30">
                {aiMessages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'ai' ? 'bg-emerald/10' : 'bg-navy'}`}>
                      {msg.role === 'ai' ? <Bot size={12} className="text-emerald" /> : <User size={12} className="text-white" />}
                    </div>
                    <div className={`max-w-[80%] rounded-lg p-2 text-xs ${msg.role === 'ai' ? 'bg-white border border-outline-variant text-on-surface' : 'bg-navy text-white'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {aiTyping && (
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald/10 flex items-center justify-center">
                      <Bot size={12} className="text-emerald" />
                    </div>
                    <div className="bg-white border border-outline-variant rounded-lg p-2">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-bounce" />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-bounce delay-100" />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="px-4 py-3 border-t border-outline-variant bg-white">
                <p className="text-xs text-on-surface-variant mb-2">Ask about this invoice:</p>
                <div className="flex gap-2">
                  <input
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendAiMessage()}
                    placeholder="e.g. When will this be paid?"
                    className="flex-1 text-xs border border-outline-variant rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald"
                  />
                  <Button size="sm" onClick={sendAiMessage} className="p-1.5" disabled={!aiInput.trim() || aiTyping}>
                    <Send size={14} />
                  </Button>
                </div>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {['Payment status?', 'Why pending?', 'Download receipt'].map(q => (
                    <button
                      key={q}
                      onClick={() => setAiInput(q)}
                      className="text-xs px-2 py-1 rounded bg-surface-low text-on-surface-variant hover:bg-emerald/10 hover:text-emerald transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
