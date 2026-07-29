import { useEffect } from 'react';
import { AlertTriangle, LogOut, Trash2, XCircle } from 'lucide-react';
import Button from './Button';

const ICONS = {
  danger: Trash2,
  warning: AlertTriangle,
  reject: XCircle,
  neutral: LogOut,
};

const ICON_COLORS = {
  danger: 'bg-red-50 text-error',
  warning: 'bg-amber-50 text-amber-600',
  reject: 'bg-red-50 text-error',
  neutral: 'bg-navy/5 text-navy',
};

const CONFIRM_VARIANTS = {
  danger: 'bg-error text-white hover:bg-error/90',
  warning: 'bg-amber-500 text-white hover:bg-amber-600',
  reject: 'bg-error text-white hover:bg-error/90',
  neutral: 'bg-navy text-white hover:bg-navy/90',
};

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  variant = 'danger',
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape') onCancel?.();
      if (e.key === 'Enter') onConfirm?.();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  const Icon = ICONS[variant] ?? AlertTriangle;

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
          <div className={`w-11 h-11 rounded-full flex items-center justify-center mb-4 ${ICON_COLORS[variant]}`}>
            <Icon size={20} />
          </div>
          <h3 className="text-base font-semibold text-on-surface">{title}</h3>
          <p className="text-sm text-on-surface-variant mt-1.5 leading-relaxed">{message}</p>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 pb-5">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <button
            onClick={onConfirm}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${CONFIRM_VARIANTS[variant]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
