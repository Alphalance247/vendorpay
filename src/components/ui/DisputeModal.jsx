import { useState, useEffect } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import Button from './Button';

export default function DisputeModal({ open, invoiceNumber, loading = false, error = '', onConfirm, onCancel }) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) { setReason(''); return; }
    function onKey(e) {
      if (loading) return;
      if (e.key === 'Escape') onCancel?.();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={loading ? undefined : onCancel}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-sm border border-outline-variant animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="w-11 h-11 rounded-full flex items-center justify-center mb-4 bg-warning/10 text-warning">
            <AlertTriangle size={20} />
          </div>
          <h3 className="text-base font-semibold text-on-surface">Dispute Payment</h3>
          <p className="text-sm text-on-surface-variant mt-1.5 mb-4">
            Flagging <span className="font-medium text-on-surface">{invoiceNumber}</span> as disputed.
            Please describe the issue — the finance team will use this to investigate.
          </p>
          <textarea
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Payment received is less than the invoice amount..."
            rows={4}
            disabled={loading}
            className="w-full rounded border border-outline-variant px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-warning focus:border-warning transition-colors disabled:bg-surface-container disabled:cursor-not-allowed"
          />
          {reason.trim().length === 0 && (
            <p className="text-xs text-error mt-1">Please provide a reason before disputing.</p>
          )}
          {error && (
            <p className="text-sm text-error mt-2 bg-error/5 border border-error/30 rounded px-3 py-2">{error}</p>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 px-6 pb-5">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={loading}>Cancel</Button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim() || loading}
            className="px-4 py-1.5 rounded text-sm font-medium transition-colors bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Submit Dispute
          </button>
        </div>
      </div>
    </div>
  );
}
