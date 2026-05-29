import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Upload, CheckCircle, Clock, Banknote, Send } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { useInvoices } from '../../lib/invoiceStore';

const workflowSteps = [
  { icon: Upload, label: 'Submission', desc: 'Drafting details & uploading file', done: true },
  { icon: Clock, label: 'Internal Review', desc: 'Approval by Finance Manager', done: false },
  { icon: Banknote, label: 'Disbursement', desc: 'Direct ACH or Wire transfer', done: false },
];

const guidelines = [
  'Ensure vendor name matches profile',
  'Tax ID must be visible on document',
  'Break down line items clearly',
];

function parseAmountFromFilename(name) {
  if (!name) return null;
  const match = name.match(/(?:\$|usd[ _-]?)?(\d{1,3}(?:[, ]\d{3})+|\d{2,})(?:\.(\d{1,2}))?/i);
  if (!match) return null;
  const whole = match[1].replace(/[, ]/g, '');
  const decimals = match[2] ?? '00';
  const value = parseFloat(`${whole}.${decimals}`);
  return Number.isFinite(value) ? value : null;
}

function parseInvoiceNumberFromFilename(name) {
  if (!name) return null;
  const match = name.match(/INV[-_ ]?\d{2,4}[-_ ]?\d{2,}/i);
  return match ? match[0].toUpperCase().replace(/[_ ]/g, '-') : null;
}

function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const seq = String(Math.floor(Math.random() * 9000) + 1000);
  return `INV-${year}-${seq}`;
}

export default function SubmitInvoice() {
  const navigate = useNavigate();
  const { addInvoice } = useInvoices();
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [form, setForm] = useState({
    invoiceNumber: '',
    currency: 'USD',
    amount: '',
    invoiceDate: '',
    dueDate: '',
    notes: '',
  });
  const [submitted, setSubmitted] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function ingestFile(picked) {
    if (!picked) return;
    setFile(picked);

    const today = new Date().toISOString().slice(0, 10);
    const due = new Date();
    due.setDate(due.getDate() + 30);
    const dueIso = due.toISOString().slice(0, 10);

    const inferredNumber = parseInvoiceNumberFromFilename(picked.name);
    const inferredAmount = parseAmountFromFilename(picked.name);

    setForm((f) => ({
      ...f,
      invoiceNumber: f.invoiceNumber || inferredNumber || generateInvoiceNumber(),
      amount: f.amount || (inferredAmount != null ? String(inferredAmount) : f.amount),
      invoiceDate: f.invoiceDate || today,
      dueDate: f.dueDate || dueIso,
    }));
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    ingestFile(e.dataTransfer.files[0]);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const amountNum = parseFloat(form.amount) || 0;
    addInvoice({
      id: form.invoiceNumber || generateInvoiceNumber(),
      date: form.invoiceDate || new Date().toISOString().slice(0, 10),
      dueDate: form.dueDate || '',
      amount: amountNum,
      currency: form.currency,
      status: 'Submitted',
      paymentDate: '—',
      notes: form.notes,
      fileName: file?.name || null,
    });
    setSubmitted(true);
    setTimeout(() => navigate('/vendor/invoices'), 1500);
  }

  if (submitted) {
    return (
      <AppLayout role="vendor">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-16 h-16 bg-emerald/10 rounded-full flex items-center justify-center">
            <CheckCircle size={32} className="text-emerald" />
          </div>
          <h2 className="text-xl font-semibold text-on-surface">Invoice Submitted!</h2>
          <p className="text-sm text-on-surface-variant">Redirecting to your invoice history…</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="vendor">
      <div className="space-y-4">
        <button
          onClick={() => navigate('/vendor/invoices')}
          className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <ArrowLeft size={15} /> Back to Invoices
        </button>

        <div>
          <h1 className="text-2xl font-semibold text-on-surface">Submit Invoice</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Fill in the details below to submit your invoice for approval and payment.</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main form */}
          <form onSubmit={handleSubmit} className="col-span-2 space-y-4">
            {/* File upload */}
            <Card
              className={`border-dashed cursor-pointer transition-colors ${dragging ? 'border-emerald bg-emerald/5' : 'border-outline-variant hover:border-emerald/50'}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-3 py-4">
                {file ? (
                  <>
                    <div className="w-12 h-12 bg-emerald/10 rounded-lg flex items-center justify-center">
                      <FileText size={24} className="text-emerald" />
                    </div>
                    <p className="text-sm font-medium text-on-surface">{file.name}</p>
                    <p className="text-xs text-on-surface-variant">{(file.size / 1024).toFixed(1)} KB</p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center">
                      <FileText size={24} className="text-outline" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-on-surface">Upload Invoice File</p>
                      <p className="text-xs text-on-surface-variant mt-1">
                        Drag and drop your PDF, Image, or DOC file here, or{' '}
                        <span className="text-emerald underline">browse computer</span>
                      </p>
                    </div>
                    <p className="text-xs text-outline uppercase tracking-wide">Maximum file size: 25MB</p>
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => ingestFile(e.target.files[0])}
              />
            </Card>

            {/* Form fields */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Invoice Number"
                name="invoiceNumber"
                value={form.invoiceNumber}
                onChange={handleChange}
                placeholder="e.g. INV-2024-001"
                required
              />
              <Select
                label="Currency"
                name="currency"
                value={form.currency}
                onChange={handleChange}
              >
                <option value="USD">USD – US Dollar</option>
                <option value="EUR">EUR – Euro</option>
                <option value="GBP">GBP – British Pound</option>
                <option value="CAD">CAD – Canadian Dollar</option>
              </Select>

              <div className="col-span-2">
                <Input
                  label="Amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  prefix="$"
                  required
                />
              </div>

              <Input
                label="Invoice Date"
                name="invoiceDate"
                type="date"
                value={form.invoiceDate}
                onChange={handleChange}
                required
              />
              <Input
                label="Due Date"
                name="dueDate"
                type="date"
                value={form.dueDate}
                onChange={handleChange}
                required
              />

              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Add any additional context or payment instructions..."
                  rows={4}
                  className="w-full rounded border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface placeholder:text-outline resize-none focus:outline-none focus:ring-2 focus:ring-emerald focus:border-emerald transition-colors"
                />
              </div>
            </div>
          </form>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Workflow preview */}
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-4">Workflow Preview</p>
              <div className="space-y-4">
                {workflowSteps.map(({ icon: Icon, label, desc, done }, i) => (
                  <div key={label} className="flex gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${done ? 'bg-emerald' : 'bg-surface-container'}`}>
                      <Icon size={14} className={done ? 'text-white' : 'text-outline'} />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${done ? 'text-emerald' : 'text-on-surface'}`}>{label}</p>
                      <p className="text-xs text-on-surface-variant">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Guidelines */}
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-3">Submission Guidelines</p>
              <ul className="space-y-2">
                {guidelines.map((g) => (
                  <li key={g} className="flex items-start gap-2 text-xs text-on-surface-variant">
                    <CheckCircle size={13} className="text-emerald mt-0.5 flex-shrink-0" />
                    {g}
                  </li>
                ))}
              </ul>
            </Card>

            {/* Submit button */}
            <Button onClick={handleSubmit} className="w-full" size="lg">
              Submit Invoice <Send size={15} />
            </Button>
            <p className="text-xs text-on-surface-variant text-center">
              By submitting, you agree to our{' '}
              <a href="#" className="text-emerald hover:underline">Terms of Service</a>.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
