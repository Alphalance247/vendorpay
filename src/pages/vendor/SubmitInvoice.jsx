import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Upload, CheckCircle, Clock, Banknote, Send, Loader2, Sparkles, Eye, EyeOff, X } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { cn } from '../../lib/utils';
import { invoiceService } from '../../lib/services/invoiceService';
import { extractInvoiceData } from '../../lib/invoiceOcr';

const CURRENCY_SYMBOLS = {
  USD: '$', EUR: '€', GBP: '£', CAD: 'C$',
  KES: 'KSh', NGN: '₦', ZAR: 'R', GHS: 'GH₵',
  UGX: 'USh', TZS: 'TSh', RWF: 'FRw', ETB: 'Br',
  XOF: 'CFA', XAF: 'FCFA', EGP: 'E£', MAD: 'DH',
};

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
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [showManual, setShowManual] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [form, setForm] = useState({
    invoiceNumber: '',
    currency: '',
    amount: '',
    invoiceDate: '',
    dueDate: '',
    notes: '',
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function ingestFile(picked) {
    if (!picked) return;
    
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    
    setFile(picked);
    setIsExtracting(true);
    setExtractedData(null);
    
    const objectUrl = URL.createObjectURL(picked);
    setPreviewUrl(objectUrl);

    const extracted = await extractInvoiceData(picked);
    setExtractedData(extracted);
    setIsExtracting(false);

    const today = new Date().toISOString().slice(0, 10);
    const due = new Date();
    due.setDate(due.getDate() + 30);
    const dueIso = due.toISOString().slice(0, 10);

    const inferredNumber = parseInvoiceNumberFromFilename(picked.name);
    const inferredAmount = parseAmountFromFilename(picked.name);

    setForm((f) => ({
      ...f,
      invoiceNumber: extracted?.invoiceNumber || inferredNumber || generateInvoiceNumber(),
      currency: extracted?.currency || f.currency,
      amount: extracted?.amount != null 
        ? String(extracted.amount) 
        : (inferredAmount != null ? String(inferredAmount) : f.amount),
      invoiceDate: extracted?.invoiceDate || f.invoiceDate || today,
      dueDate: extracted?.dueDate || f.dueDate || dueIso,
    }));
  }

  function removeFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setExtractedData(null);
    setForm({
      invoiceNumber: '',
      currency: '',
      amount: '',
      invoiceDate: '',
      dueDate: '',
      notes: '',
    });
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    ingestFile(e.dataTransfer.files[0]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError('Please upload an invoice file');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await invoiceService.submitInvoice({
        invoiceNumber: form.invoiceNumber || generateInvoiceNumber(),
        amount: parseFloat(form.amount) || 0,
        dueDate: form.dueDate || new Date().toISOString().slice(0, 10),
        currency: form.currency || 'USD',
        notes: form.notes || '',
        pdfFile: file, // the raw File object
      });

      setSubmitted(true);
      setTimeout(() => navigate('/vendor/invoices'), 1500);
    } catch (err) {
      setError(extractErrorMessage(err));
      setLoading(false);
    }
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

  const isPdf = file?.type === 'application/pdf' || file?.name?.endsWith('.pdf');

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
          <p className="text-sm text-on-surface-variant mt-0.5">
            Upload your invoice and we'll extract all details automatically.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Main form */}
          <div className="col-span-2 space-y-4">
            {/* Upload area */}
            {!file ? (
              <Card
                className={cn(
                  "border-dashed cursor-pointer transition-colors",
                  dragging ? 'border-emerald bg-emerald/5' : 'border-outline-variant hover:border-emerald/50'
                )}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center gap-3 py-6">
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
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => ingestFile(e.target.files[0])}
                />
              </Card>
            ) : (
              /* File uploaded - show preview */
              <Card className="border-emerald/30">
                <div className="flex items-center justify-between p-4 border-b border-outline-variant">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald/10 rounded-lg flex items-center justify-center">
                      <FileText size={20} className="text-emerald" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-on-surface">{file.name}</p>
                      <p className="text-xs text-on-surface-variant">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button 
                    onClick={removeFile}
                    className="p-1.5 hover:bg-surface-container rounded transition-colors"
                  >
                    <X size={16} className="text-on-surface-variant" />
                  </button>
                </div>

                {/* PREVIEW */}
                <div className="p-4 bg-surface-low">
                  {isPdf ? (
                    <div className="relative">
                      <iframe
                        src={previewUrl}
                        className="w-full h-[400px] rounded border border-outline-variant"
                        title="Invoice Preview"
                      />
                      <div className="absolute top-2 right-2 bg-white/90 rounded px-2 py-1 text-xs font-medium text-on-surface shadow-sm">
                        PDF Preview
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <img
                        src={previewUrl}
                        alt="Invoice preview"
                        className="w-full max-h-[400px] object-contain rounded border border-outline-variant"
                      />
                      <div className="absolute top-2 right-2 bg-white/90 rounded px-2 py-1 text-xs font-medium text-on-surface shadow-sm">
                        Image Preview
                      </div>
                    </div>
                  )}
                </div>

                {/* Extraction status */}
                <div className="px-4 py-3 border-t border-outline-variant">
                  {isExtracting ? (
                    <div className="flex items-center gap-2 text-sm text-emerald">
                      <Loader2 size={16} className="animate-spin" />
                      AI is reading your invoice...
                    </div>
                  ) : extractedData ? (
                    <div className="flex items-center gap-2 text-sm text-emerald">
                      <Sparkles size={16} />
                      {extractedData.currency && extractedData.amount 
                        ? `Detected: ${extractedData.currency} ${extractedData.amount.toLocaleString()}`
                        : 'Data extracted'}
                    </div>
                  ) : null}
                </div>
              </Card>
            )}

            {/* Extracted Results */}
            {extractedData && !isExtracting && (
              <Card className="bg-emerald/5 border-emerald/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-emerald" />
                    <p className="text-sm font-semibold text-emerald">AI-Extracted Data</p>
                  </div>
                  <button
                    onClick={() => setShowManual(!showManual)}
                    className="text-xs text-emerald hover:underline flex items-center gap-1"
                  >
                    {showManual ? <><EyeOff size={12} /> Hide</> : <><Eye size={12} /> Edit</>}
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {extractedData.invoiceNumber && (
                    <div className="bg-white rounded border border-emerald/20 px-3 py-2">
                      <p className="text-xs text-on-surface-variant">Invoice #</p>
                      <p className="text-sm font-medium text-on-surface">{extractedData.invoiceNumber}</p>
                    </div>
                  )}
                  {extractedData.amount && (
                    <div className="bg-white rounded border border-emerald/20 px-3 py-2">
                      <p className="text-xs text-on-surface-variant">Amount</p>
                      <p className="text-sm font-medium text-on-surface">
                        {CURRENCY_SYMBOLS[extractedData.currency] || '$'}{extractedData.amount.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {extractedData.currency && (
                    <div className="bg-white rounded border border-emerald/20 px-3 py-2">
                      <p className="text-xs text-on-surface-variant">Currency</p>
                      <p className="text-sm font-medium text-on-surface">{extractedData.currency}</p>
                    </div>
                  )}
                  {extractedData.invoiceDate && (
                    <div className="bg-white rounded border border-emerald/20 px-3 py-2">
                      <p className="text-xs text-on-surface-variant">Date</p>
                      <p className="text-sm font-medium text-on-surface">{extractedData.invoiceDate}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Manual Form */}
            <form onSubmit={handleSubmit} className={cn("space-y-4", !showManual && extractedData && "hidden")}>
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
                  required
                >
                  <option value="">Select Currency</option>
                  <option value="USD">USD – US Dollar ($)</option>
                  <option value="EUR">EUR – Euro (€)</option>
                  <option value="GBP">GBP – British Pound (£)</option>
                  <option value="CAD">CAD – Canadian Dollar (C$)</option>
                  <option value="KES">KES – Kenyan Shilling (KSh)</option>
                  <option value="NGN">NGN – Nigerian Naira (₦)</option>
                  <option value="ZAR">ZAR – South African Rand (R)</option>
                  <option value="GHS">GHS – Ghanaian Cedi (GH₵)</option>
                  <option value="UGX">UGX – Ugandan Shilling (USh)</option>
                  <option value="TZS">TZS – Tanzanian Shilling (TSh)</option>
                  <option value="RWF">RWF – Rwandan Franc (FRw)</option>
                  <option value="ETB">ETB – Ethiopian Birr (Br)</option>
                  <option value="XOF">XOF – West African CFA (CFA)</option>
                  <option value="XAF">XAF – Central African CFA (FCFA)</option>
                  <option value="EGP">EGP – Egyptian Pound (E£)</option>
                  <option value="MAD">MAD – Moroccan Dirham (DH)</option>
                </Select>
              </div>

              <div className="relative">
                {!form.currency && (
                  <div className="absolute inset-0 z-10 bg-surface/60 backdrop-blur-[1px] rounded-lg cursor-not-allowed flex items-center justify-center">
                    <div className="bg-white border border-outline-variant rounded-lg px-4 py-3 shadow-sm text-center">
                      <p className="text-sm font-medium text-on-surface">Select a currency first</p>
                    </div>
                  </div>
                )}
                <div className={cn("transition-opacity", !form.currency && "opacity-40 pointer-events-none")}>
                  <Input
                    label="Amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    prefix={form.currency ? CURRENCY_SYMBOLS[form.currency] : '$'}
                    disabled={!form.currency}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Invoice Date" name="invoiceDate" type="date" value={form.invoiceDate} onChange={handleChange} required />
                <Input label="Due Date" name="dueDate" type="date" value={form.dueDate} onChange={handleChange} required />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Add any additional context..."
                  rows={4}
                  className="w-full rounded border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface placeholder:text-outline resize-none focus:outline-none focus:ring-2 focus:ring-emerald"
                />
              </div>
            </form>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {isExtracting && (
              <Card className="bg-navy text-white border-0">
                <div className="flex items-center gap-3">
                  <Loader2 size={20} className="animate-spin text-emerald-light" />
                  <div>
                    <p className="text-sm font-semibold">AI Working...</p>
                    <p className="text-xs text-slate-300">Reading your invoice</p>
                  </div>
                </div>
              </Card>
            )}

            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-4">Workflow</p>
              <div className="space-y-4">
                {workflowSteps.map(({ icon: Icon, label, desc, done }) => (
                  <div key={label} className="flex gap-3">
                    <div className={cn('w-7 h-7 rounded-full flex items-center justify-center', done ? 'bg-emerald' : 'bg-surface-container')}>
                      <Icon size={14} className={done ? 'text-white' : 'text-outline'} />
                    </div>
                    <div>
                      <p className={cn('text-sm font-semibold', done ? 'text-emerald' : 'text-on-surface')}>{label}</p>
                      <p className="text-xs text-on-surface-variant">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-3">Guidelines</p>
              <ul className="space-y-2">
                {guidelines.map((g) => (
                  <li key={g} className="flex items-start gap-2 text-xs text-on-surface-variant">
                    <CheckCircle size={13} className="text-emerald mt-0.5 flex-shrink-0" />
                    {g}
                  </li>
                ))}
              </ul>
            </Card>

            <Button 
              onClick={handleSubmit} 
              className="w-full" 
              size="lg" 
              disabled={!form.currency || isExtracting || loading || !file}
            >
              {loading ? <><Loader2 size={15} className="animate-spin" /> Submitting...</> : 
               isExtracting ? <><Loader2 size={15} className="animate-spin" /> Reading...</> : 
               <>Submit <Send size={15} /></>}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}