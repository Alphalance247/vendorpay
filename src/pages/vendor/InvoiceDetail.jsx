import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Check, Send, Bot, User, Loader2, MessageSquare } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import TutorialCard from '../../components/ui/TutorialCard';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusChip from '../../components/ui/StatusChip';
import RejectModal from '../../components/ui/RejectModal';
import DisputeModal from '../../components/ui/DisputeModal';
import { useAuth } from '../../lib/authContext';
import { invoiceService, adminInvoiceService, vendorInvoiceService, invoiceMessageService } from '../../lib/services/invoiceService';
import { supportService } from '../../lib/services/supportService';
import { formatCurrency, formatDate } from '../../lib/utils';

// Old audit records stored emails — convert to display name if needed
function displayActor(performedBy) {
  if (!performedBy) return 'Unknown';
  if (performedBy.includes('@')) {
    const local = performedBy.split('@')[0];
    return local.replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return performedBy;
}
import { useConfirm } from '../../hooks/useConfirm';

export default function InvoiceDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const [aiMessages, setAiMessages] = useState([
    { role: 'ai', text: `Hi! I can answer questions about this invoice — status, payment timing, rejection reasons, or anything else.` }
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

  useEffect(() => {
    if (!invoice) return;
    let url;
    setPdfLoading(true);
    const loader = isAdmin
      ? invoiceService.getAdminInvoicePdfUrl(id)
      : invoiceService.getInvoicePdfUrl(id);
    loader
      .then((blobUrl) => { url = blobUrl; setPdfUrl(blobUrl); })
      .catch(() => {})
      .finally(() => setPdfLoading(false));
    return () => { if (url) window.URL.revokeObjectURL(url); };
  }, [invoice, id, isAdmin]);

  const [actionError, setActionError] = useState('');
  const { confirm, confirmEl } = useConfirm();

  // Rejection modal
  const [rejectOpen, setRejectOpen] = useState(false);
  // Dispute modal
  const [disputeOpen, setDisputeOpen] = useState(false);

  // Per-invoice messaging
  const [messages, setMessages]   = useState([]);
  const [msgInput, setMsgInput]   = useState('');
  const [msgSending, setMsgSend]  = useState(false);
  const msgBottomRef = useRef(null);

  const loadMessages = useCallback(() => {
    invoiceMessageService.getMessages(id).then((data) => {
      setMessages((prev) => {
        // Only update when a new message has arrived — avoids re-render on unchanged data
        if (prev.length === data.length) return prev;
        return data;
      });
    }).catch(() => {});
  }, [id]);

  useEffect(() => { if (invoice) loadMessages(); }, [invoice, loadMessages]);

  // Poll for new invoice messages every 5 seconds
  useEffect(() => {
    if (!invoice) return;
    const timer = setInterval(loadMessages, 5000);
    return () => clearInterval(timer);
  }, [invoice, loadMessages]);

  useEffect(() => { msgBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function runAction(key, fn) {
    setActionLoading(key);
    setActionError('');
    try {
      await fn();
      const updated = await invoiceService.getAdminInvoiceDetail(id);
      setInvoice(updated);
    } catch (err) {
      setActionError(err?.response?.data?.detail ?? 'Action failed. Please try again.');
    } finally {
      setActionLoading('');
    }
  }

  const handleApprove = () => runAction('approve', () => adminInvoiceService.approveInvoice(id));
  const handleFund    = () => runAction('fund',    () => adminInvoiceService.fundInvoice(id));
  const handleMarkPaid = () => runAction('paid',  () => adminInvoiceService.markPaid(id));
  async function refreshInvoice() {
    const updated = await (isAdmin
      ? invoiceService.getAdminInvoiceDetail(id)
      : invoiceService.getMyInvoiceDetail(id));
    setInvoice(updated);
  }

  const handleConfirmPayment = async () => {
    const ok = await confirm({
      title: 'Confirm Payment Receipt',
      message: 'Confirm that you have received the payment for this invoice?',
      confirmLabel: 'Confirm Receipt',
      variant: 'warning',
    });
    if (!ok) return;
    setActionLoading('confirm-payment');
    setActionError('');
    try {
      await vendorInvoiceService.confirmPayment(id);
      await refreshInvoice();
    } catch (err) {
      setActionError(err?.response?.data?.detail ?? 'Action failed.');
    } finally {
      setActionLoading('');
    }
  };

  const handleDisputePayment = () => setDisputeOpen(true);

  const handleDisputeConfirm = async (reason) => {
    setDisputeOpen(false);
    setActionLoading('dispute-payment');
    setActionError('');
    try {
      await vendorInvoiceService.disputePayment(id, reason);
      await refreshInvoice();
    } catch (err) {
      setActionError(err?.response?.data?.detail ?? 'Action failed.');
    } finally {
      setActionLoading('');
    }
  };

  const handleReject = () => setRejectOpen(true);

  const handleRejectConfirm = (reason) => {
    setRejectOpen(false);
    runAction('reject', () => adminInvoiceService.rejectInvoice(id, reason));
  };

  async function sendMessage() {
    if (!msgInput.trim() || msgSending) return;
    setMsgSend(true);
    try {
      const msg = await invoiceMessageService.sendMessage(id, msgInput.trim());
      setMsgInput('');
      setMessages((prev) => [...prev, msg]);
    } catch { /* ignore */ }
    finally { setMsgSend(false); }
  }

  function handleDownload() {
    if (isAdmin) {
      invoiceService.downloadAdminInvoicePdf(id);
    } else {
      invoiceService.downloadInvoicePdf(id);
    }
  }

  async function sendAiMessage() {
    const text = aiInput.trim();
    if (!text || aiTyping || !invoice) return;

    const userMsg = { role: 'user', text };
    setAiMessages((prev) => [...prev, userMsg]);
    setAiInput('');
    setAiTyping(true);

    try {
      // Build history in Claude API format (role: user|assistant, content: string)
      // Prepend full invoice context including audit log so Claude can answer specifically
      const auditLines = (invoice.audit_logs ?? [])
        .map((l) => `  - ${l.action} by ${displayActor(l.performed_by)} on ${formatDate(l.timestamp)}${l.notes ? `: "${l.notes}"` : ''}`)
        .join('\n');

      const invoiceContext =
        `The user is viewing invoice ${invoice.invoice_number}.\n` +
        `Amount: ${formatCurrency(invoice.amount, invoice.currency)}\n` +
        `Status: ${invoice.status}\n` +
        `Submitted: ${formatDate(invoice.submitted_at)}\n` +
        `Due date: ${invoice.due_date ? formatDate(invoice.due_date) : 'N/A'}\n` +
        (invoice.notes ? `Vendor notes: ${invoice.notes}\n` : '') +
        `Audit history:\n${auditLines || '  (none)'}`;


      const history = [
        { role: 'user', content: invoiceContext },
        { role: 'assistant', content: 'Understood. I have the context for this invoice and will answer questions about it.' },
        ...[...aiMessages.slice(1), userMsg].map((m) => ({
          role: m.role === 'ai' ? 'assistant' : 'user',
          content: m.text,
        })),
      ];

      const reply = await supportService.chat(history);
      setAiMessages((prev) => [...prev, { role: 'ai', text: reply }]);
    } catch {
      setAiMessages((prev) => [...prev, {
        role: 'ai',
        text: "I'm having trouble connecting right now. Please try again or raise a support ticket.",
      }]);
    } finally {
      setAiTyping(false);
    }
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

  const statusMap = { submitted: 'Submitted', reviewed: 'Reviewed', funding: 'Awaiting Payment', paid: 'Paid', payment_confirmed: 'Payment Confirmed', payment_disputed: 'Payment Disputed', rejected: 'Rejected', flagged: 'Flagged' };
  const displayStatus = statusMap[invoice.status] ?? invoice.status;

  const terminalStatuses = ['payment_confirmed', 'payment_disputed'];
  const postPaid = terminalStatuses.includes(invoice.status);
  const workflowSteps = [
    { label: 'Submitted',        done: true,  active: false, date: formatDate(invoice.submitted_at), user: 'By Vendor' },
    { label: 'Reviewed',         done: ['reviewed', 'funding', 'paid', ...terminalStatuses].includes(invoice.status), active: invoice.status === 'submitted', date: '', user: '' },
    { label: 'Awaiting Payment', done: ['funding', 'paid', ...terminalStatuses].includes(invoice.status), active: invoice.status === 'reviewed', date: '', user: '' },
    { label: 'Disbursed',        done: ['paid', ...terminalStatuses].includes(invoice.status), active: invoice.status === 'funding', date: invoice.payment_date ? formatDate(invoice.payment_date) : '', user: '' },
    { label: postPaid && invoice.status === 'payment_disputed' ? 'Disputed' : 'Confirmed', done: postPaid, active: invoice.status === 'paid', date: '', user: postPaid ? 'By Vendor' : '' },
  ];

  const rejectionLog = invoice.status === 'rejected'
    ? invoice.audit_logs?.findLast?.((l) => l.action === 'rejected') ?? invoice.audit_logs?.filter((l) => l.action === 'rejected').at(-1)
    : null;

  return (
    <AppLayout role={isAdmin ? 'admin' : 'vendor'}>
      {confirmEl}
      <RejectModal
        open={rejectOpen}
        invoiceNumber={invoice.invoice_number}
        onConfirm={handleRejectConfirm}
        onCancel={() => setRejectOpen(false)}
      />
      <DisputeModal
        open={disputeOpen}
        invoiceNumber={invoice.invoice_number}
        onConfirm={handleDisputeConfirm}
        onCancel={() => setDisputeOpen(false)}
      />
      <div className="space-y-4">
        <button
          onClick={() => navigate(backPath)}
          className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <ArrowLeft size={15} /> Back to Invoices
        </button>

        <TutorialCard
          id="invoice-detail"
          title="Invoice Details & Communication"
          description="Track the full lifecycle of this invoice and communicate with the finance team."
          tips={[
            "The status badge at the top shows exactly where this invoice is in the approval and payment process.",
            "Download the original PDF using the Download button in the top-right.",
            "Use the Messages section to ask questions or provide additional information to the finance team.",
            "Once payment is disbursed you can Confirm Receipt or raise a Dispute if the amount is incorrect.",
            "The Audit Log at the bottom records every action taken on this invoice with timestamps.",
          ]}
        />

        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wide">Invoice #{invoice.invoice_number}</p>
            <h1 className="text-2xl font-semibold text-on-surface mt-0.5">Invoice Details</h1>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <>
                {invoice.status === 'submitted' && (
                  <>
                    <Button variant="secondary" size="sm" onClick={handleApprove} disabled={!!actionLoading}>
                      {actionLoading === 'approve' ? <Loader2 size={14} className="animate-spin" /> : 'Approve'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleReject} disabled={!!actionLoading} className="text-error hover:bg-red-50">
                      {actionLoading === 'reject' ? <Loader2 size={14} className="animate-spin" /> : 'Reject'}
                    </Button>
                  </>
                )}
                {invoice.status === 'reviewed' && (
                  <>
                    <Button size="sm" onClick={handleFund} disabled={!!actionLoading}>
                      {actionLoading === 'fund' ? <Loader2 size={14} className="animate-spin" /> : 'Initiate Funding'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleReject} disabled={!!actionLoading} className="text-error hover:bg-red-50">
                      {actionLoading === 'reject' ? <Loader2 size={14} className="animate-spin" /> : 'Reject'}
                    </Button>
                  </>
                )}
                {invoice.status === 'funding' && (
                  <Button size="sm" onClick={handleMarkPaid} disabled={!!actionLoading}>
                    {actionLoading === 'paid' ? <Loader2 size={14} className="animate-spin" /> : 'Mark as Paid'}
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={handleDownload} className="p-1.5">
                  <Download size={14} />
                </Button>
              </>
            ) : (
              <>
                {invoice.status === 'paid' && (
                  <>
                    <Button size="sm" onClick={handleConfirmPayment} disabled={!!actionLoading}>
                      {actionLoading === 'confirm-payment' ? <Loader2 size={14} className="animate-spin" /> : 'Confirm Receipt'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleDisputePayment} disabled={!!actionLoading} className="text-error hover:bg-red-50">
                      {actionLoading === 'dispute-payment' ? <Loader2 size={14} className="animate-spin" /> : 'Dispute'}
                    </Button>
                  </>
                )}
                <Button variant="secondary" size="sm" onClick={handleDownload}>
                  <Download size={14} /> Download
                </Button>
              </>
            )}
          </div>
        </div>

        {actionError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm flex items-center justify-between">
            {actionError}
            <button onClick={() => setActionError('')} className="ml-2 underline text-xs">Dismiss</button>
          </div>
        )}

        {rejectionLog && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <span className="text-error text-sm font-bold">!</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-error">Invoice Rejected</p>
              <p className="text-sm text-red-700 mt-0.5">{rejectionLog.notes}</p>
              <p className="text-xs text-red-400 mt-1">By {displayActor(rejectionLog.performed_by)} · {formatDate(rejectionLog.timestamp)}</p>
            </div>
          </div>
        )}

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
              {pdfLoading ? (
                <div className="flex items-center justify-center min-h-[400px] bg-surface-low">
                  <Loader2 size={24} className="animate-spin text-emerald" />
                </div>
              ) : pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="w-full border-0"
                  style={{ height: '600px' }}
                  title="Invoice Document"
                />
              ) : (
                <div className="p-8 bg-surface-low min-h-[200px] flex items-center justify-center">
                  <div className="text-center">
                    <FileText size={48} className="text-outline mx-auto mb-3" />
                    <p className="text-sm text-on-surface-variant">Document unavailable</p>
                  </div>
                </div>
              )}
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
                      <p className="text-xs text-outline">{displayActor(log.performed_by)} · {formatDate(log.timestamp)}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-on-surface-variant">No audit events yet.</p>
                )}
              </div>
            </Card>

            {/* Per-invoice messaging panel */}
            <Card className="p-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-outline-variant flex items-center gap-2">
                <MessageSquare size={14} className="text-on-surface-variant" />
                <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                  Messages {messages.length > 0 && `(${messages.length})`}
                </p>
              </div>
              <div className="p-3 space-y-3 max-h-[260px] overflow-y-auto bg-surface-low/20">
                {messages.length === 0 ? (
                  <p className="text-xs text-center text-on-surface-variant py-4">
                    No messages yet. {isAdmin ? 'Send a message to the vendor.' : 'Send a message to the admin team.'}
                  </p>
                ) : messages.map((msg) => {
                  const isOwn = isAdmin ? msg.sender_role === 'admin' : msg.sender_role === 'vendor';
                  return (
                    <div key={msg.id} className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${msg.sender_role === 'admin' ? 'bg-navy text-white' : 'bg-emerald/10 text-emerald'}`}>
                        {msg.sender_name.charAt(0).toUpperCase()}
                      </div>
                      <div className={`max-w-[75%] flex flex-col gap-0.5 ${isOwn ? 'items-end' : ''}`}>
                        <span className="text-[10px] text-outline px-1">{msg.sender_name} · {formatDate(msg.created_at)}</span>
                        <div className={`rounded-lg px-2.5 py-1.5 text-xs leading-relaxed ${isOwn ? 'bg-navy text-white' : 'bg-surface-container text-on-surface'}`}>
                          {msg.body}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={msgBottomRef} />
              </div>
              <div className="px-3 py-2 border-t border-outline-variant flex gap-2">
                <input
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder={isAdmin ? 'Message vendor...' : 'Message admin team...'}
                  className="flex-1 text-xs rounded border border-outline-variant px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald"
                />
                <button
                  onClick={sendMessage}
                  disabled={msgSending || !msgInput.trim()}
                  className="p-1.5 rounded bg-navy text-white disabled:opacity-40 hover:bg-navy/90 transition-colors"
                >
                  {msgSending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                </button>
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
