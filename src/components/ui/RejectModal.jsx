import { useState, useEffect } from 'react';
import { Loader2, XCircle } from 'lucide-react';
import Button from './Button';

export default function RejectModal({
  open,
  title = 'Reject Invoice',
  itemLabel,
  description,
  confirmLabel = 'Reject Invoice',
  loading = false,
  error = '',
  onConfirm,
  onCancel,
}) {
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
          <div className="w-11 h-11 rounded-full flex items-center justify-center mb-4 bg-red-50 text-error">
            <XCircle size={20} />
          </div>
          <h3 className="text-base font-semibold text-on-surface">{title}</h3>
          <p className="text-sm text-on-surface-variant mt-1.5 mb-4">
            {description ?? (
              <>
                Rejecting <span className="font-medium text-on-surface">{itemLabel}</span>. You must provide a reason — the vendor will see this.
              </>
            )}
          </p>
          <textarea
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter rejection reason (required)..."
            rows={4}
            disabled={loading}
            className="w-full rounded border border-outline-variant px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-error disabled:bg-surface-low disabled:cursor-not-allowed"
          />
          {reason.trim().length === 0 && (
            <p className="text-xs text-error mt-1">A reason is required before rejecting.</p>
          )}
          {error && (
            <p className="text-sm text-error mt-2 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 px-6 pb-5">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={loading}>Cancel</Button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim() || loading}
            className="px-4 py-1.5 rounded text-sm font-medium transition-colors bg-error text-white hover:bg-error/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
