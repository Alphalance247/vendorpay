import { useState, useEffect } from 'react';
import { XCircle } from 'lucide-react';
import Button from './Button';

export default function RejectModal({ open, invoiceNumber, onConfirm, onCancel }) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) { setReason(''); return; }
    function onKey(e) {
      if (e.key === 'Escape') onCancel?.();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-sm border border-outline-variant animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="w-11 h-11 rounded-full flex items-center justify-center mb-4 bg-red-50 text-error">
            <XCircle size={20} />
          </div>
          <h3 className="text-base font-semibold text-on-surface">Reject Invoice</h3>
          <p className="text-sm text-on-surface-variant mt-1.5 mb-4">
            Rejecting <span className="font-medium text-on-surface">{invoiceNumber}</span>. You must provide a reason — the vendor will see this.
          </p>
          <textarea
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter rejection reason (required)..."
            rows={4}
            className="w-full rounded border border-outline-variant px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-error"
          />
          {reason.trim().length === 0 && (
            <p className="text-xs text-error mt-1">A reason is required before rejecting.</p>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 px-6 pb-5">
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim()}
            className="px-4 py-1.5 rounded text-sm font-medium transition-colors bg-error text-white hover:bg-error/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Reject Invoice
          </button>
        </div>
      </div>
    </div>
  );
}
