import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, ZoomIn, ZoomOut, RotateCw, FileText, Check, Send, Bot, User } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusChip from '../../components/ui/StatusChip';
import { useInvoices } from '../../lib/invoiceStore';
import { formatCurrency, formatDate } from '../../lib/utils';

const AUDIT_LOG = [
  { time: '11:24 AM', user: 'System', action: 'Status changed to Reviewed' },
  { time: '10:58 AM', user: 'Sarah M.', action: 'Document verified by OCR' },
  { time: '09:41 AM', user: 'System', action: 'Invoice Uploaded' },
];

export default function InvoiceDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { invoices } = useInvoices();
  const [note, setNote] = useState('');

  // AI Support state
  const [aiMessages, setAiMessages] = useState([
    { role: 'ai', text: `Hi! I can help you with invoice ${id}. Ask me about payment status, due dates, or any concerns.` }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiTyping, setAiTyping] = useState(false);

  // Find the actual invoice by ID
  const invoice = invoices.find((inv) => inv.id === id);

  const isAdmin = window.location.pathname.startsWith('/admin');

  // AI Support function
  function sendAiMessage() {
    if (!aiInput.trim()) return;
    
    setAiMessages(prev => [...prev, { role: 'user', text: aiInput }]);
    const question = aiInput;
    setAiInput('');
    setAiTyping(true);

    setTimeout(() => {
      let response = '';
      
      if (question.toLowerCase().includes('payment') || question.toLowerCase().includes('when') || question.toLowerCase().includes('paid')) {
        response = invoice.status === 'Paid' 
          ? `This invoice was paid on ${invoice.paymentDate}.`
          : invoice.status === 'Awaiting Payment'
          ? `Payment is scheduled. Expected disbursement: ${invoice.dueDate || 'within 5-7 business days'}.`
          : `This invoice is ${invoice.status.toLowerCase()}. Payment will be processed after approval.`;
      } else if (question.toLowerCase().includes('status')) {
        response = `Current status: ${invoice.status}. ${invoice.status === 'Submitted' ? 'Under review by finance team.' : ''}`;
      } else if (question.toLowerCase().includes('amount') || question.toLowerCase().includes('money') || question.toLowerCase().includes('how much')) {
        response = `Amount: ${formatCurrency(invoice.amount, invoice.currency)}. Currency: ${invoice.currency}.`;
      } else if (question.toLowerCase().includes('date') || question.toLowerCase().includes('due')) {
        response = `Invoice date: ${formatDate(invoice.date)}. Due date: ${invoice.dueDate ? formatDate(invoice.dueDate) : 'Not specified'}.`;
      } else if (question.toLowerCase().includes('file') || question.toLowerCase().includes('pdf') || question.toLowerCase().includes('download')) {
        response = invoice.fileName 
          ? `File uploaded: ${invoice.fileName}. You can download it from the preview section above.`
          : 'No file was uploaded with this invoice.';
      } else {
        response = `I can help with: payment timing, invoice status, amount details, due dates, or file downloads. What would you like to know about invoice ${invoice.id}?`;
      }
      
      setAiMessages(prev => [...prev, { role: 'ai', text: response }]);
      setAiTyping(false);
    }, 800);
  }

  // If no invoice found, show error
  if (!invoice) {
    return (
      <AppLayout role={isAdmin ? 'admin' : 'vendor'}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <FileText size={48} className="text-outline" />
          <p className="text-lg text-on-surface">Invoice not found</p>
          <p className="text-sm text-on-surface-variant">ID: {id}</p>
          <Button onClick={() => navigate(isAdmin ? '/vendorpay/admin/invoices' : '/vendorpay/vendor/invoices')}>
            Back to Invoices
          </Button>
        </div>
      </AppLayout>
    );
  }

  // Workflow steps based on actual status
  const workflowSteps = [
    { label: 'Submitted', date: formatDate(invoice.date), user: 'By Vendor', done: true, active: false },
    { label: 'Reviewed', date: invoice.status !== 'Submitted' ? formatDate(invoice.date) : '', user: invoice.status !== 'Submitted' ? 'By Finance Team' : '', done: invoice.status !== 'Submitted', active: invoice.status === 'Submitted' },
    { label: 'Awaiting Payment', date: (invoice.status === 'Awaiting Payment' || invoice.status === 'Paid') && invoice.dueDate ? 'Est. ' + formatDate(invoice.dueDate) : '', user: '', done: invoice.status === 'Awaiting Payment' || invoice.status === 'Paid', active: invoice.status === 'Awaiting Payment' },
    { label: 'Disbursed', date: invoice.paymentDate && invoice.paymentDate !== '—' ? 'Payment ' + invoice.paymentDate : '', user: '', done: invoice.status === 'Paid', active: false },
  ];

  return (
    <AppLayout role={isAdmin ? 'admin' : 'vendor'}>
      <div className="space-y-4">
        {/* Back */}
        <button
          onClick={() => navigate(isAdmin ? '/vendorpay/admin/invoices' : '/vendorpay/vendor/invoices')}
          className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <ArrowLeft size={15} /> Back to Invoices
        </button>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wide">Invoice #{invoice.id}</p>
            <h1 className="text-2xl font-semibold text-on-surface mt-0.5">
              {invoice.fileName ? invoice.fileName.replace(/\.[^/.]+$/, '') : 'Invoice Details'}
            </h1>
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

        {/* Workflow */}
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
          {/* Invoice details */}
          <div className="col-span-2 space-y-4">
            <Card>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-on-surface-variant uppercase tracking-wide">Invoice From</p>
                  <p className="text-sm font-semibold text-on-surface mt-0.5">Vendor Profile</p>
                  <p className="text-xs text-on-surface-variant">ID: {invoice.id}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant uppercase tracking-wide">Invoice Date</p>
                  <p className="text-sm font-medium text-on-surface mt-0.5">{formatDate(invoice.date)}</p>
                  <p className="text-xs text-on-surface-variant">Due: {formatDate(invoice.dueDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant uppercase tracking-wide">Amount</p>
                  <p className="text-xl font-bold tnum text-on-surface mt-0.5">
                    {formatCurrency(invoice.amount, invoice.currency)}
                  </p>
                  <StatusChip status={invoice.status === 'InProgress' ? 'Awaiting Payment' : invoice.status} className="mt-1" />
                </div>
              </div>
            </Card>

            {/* File preview */}
            <Card className="p-0 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-outline-variant bg-surface-low">
                <span className="text-xs font-medium text-on-surface-variant">{invoice.fileName || 'No file uploaded'}</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="p-1.5"><ZoomOut size={14} /></Button>
                  <span className="text-xs text-on-surface-variant">100%</span>
                  <Button variant="ghost" size="sm" className="p-1.5"><ZoomIn size={14} /></Button>
                  <Button variant="ghost" size="sm" className="p-1.5"><RotateCw size={14} /></Button>
                  <Button variant="ghost" size="sm" className="p-1.5"><Download size={14} /></Button>
                </div>
              </div>
              <div className="p-8 bg-surface-low min-h-[300px] flex items-center justify-center">
                <div className="text-center">
                  <FileText size={48} className="text-outline mx-auto mb-3" />
                  <p className="text-sm text-on-surface-variant">Invoice preview not available</p>
                  <p className="text-xs text-outline mt-1">{invoice.fileName || 'No file attached'}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-3">Internal Notes</p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a private note..."
                rows={3}
                className="w-full rounded border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface placeholder:text-outline resize-none focus:outline-none focus:ring-2 focus:ring-emerald text-xs"
              />
              <Button variant="secondary" size="sm" className="mt-2 w-full">
                Save Note
              </Button>
            </Card>

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

            {/* AI Support Dialog */}
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
                      onClick={() => { setAiInput(q); }}
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