import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  LogOut,
  Loader2,
  Trash2,
  XCircle,
} from "lucide-react";
import Button from "./Button";

const ICONS = {
  danger: Trash2,
  warning: AlertTriangle,
  reject: XCircle,
  neutral: LogOut,
  approve: CheckCircle,
};

const ICON_COLORS = {
  danger: "bg-error/5 text-error",
  warning: "bg-warning-container text-warning",
  reject: "bg-error/5 text-error",
  neutral: "bg-navy/5 text-navy",
  approve: "bg-success/10 text-success",
};

const CONFIRM_VARIANTS = {
  danger: "bg-error text-white hover:bg-error/90",
  warning: "bg-warning text-navy hover:bg-warning/90",
  reject: "bg-error text-white hover:bg-error/90",
  neutral: "bg-navy text-white hover:bg-navy/90",
  approve: "bg-primary text-white hover:bg-primary/90",
};

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  variant = "danger",
  loading = false,
  error = "",
  // Optional: shows a "permanent action" callout, as { title, message }
  warning,
  // Optional: the user must type this exact text before confirming
  requireText,
  onConfirm,
  onCancel,
}) {
  const [typed, setTyped] = useState("");
  const [wasOpen, setWasOpen] = useState(open);

  // Clear the typed text each time the modal opens
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setTyped("");
  }

  const canConfirm = !requireText || typed.trim() === requireText.trim();

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (loading) return;
      if (e.key === "Escape") onCancel?.();
      if (e.key === "Enter" && canConfirm) onConfirm?.();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, loading, canConfirm, onCancel, onConfirm]);

  if (!open) return null;

  const Icon = ICONS[variant] ?? AlertTriangle;

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
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center mb-4 ${ICON_COLORS[variant]}`}
          >
            <Icon size={20} />
          </div>
          <h3 className="text-base font-semibold text-on-surface">{title}</h3>
          <p className="text-sm text-on-surface-variant mt-1.5 leading-relaxed">
            {message}
          </p>
          {warning && (
            <div className="mt-4 flex items-start gap-2 rounded border border-error/30 bg-error/5 px-3 py-2">
              <AlertTriangle
                size={16}
                className="text-error flex-shrink-0 mt-0.5"
              />
              <div className="text-sm">
                <p className="font-semibold text-error">{warning.title}</p>
                {warning.message && (
                  <p className="text-on-surface-variant mt-0.5 leading-relaxed">
                    {warning.message}
                  </p>
                )}
              </div>
            </div>
          )}
          {requireText && (
            <div className="mt-4 flex flex-col gap-1.5">
              <label
                htmlFor="confirm-modal-text"
                className="text-sm text-on-surface-variant"
              >
                Type{" "}
                <span className="font-semibold text-on-surface">
                  {requireText}
                </span>{" "}
                to confirm
              </label>
              <input
                id="confirm-modal-text"
                autoFocus
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                disabled={loading}
                autoComplete="off"
                spellCheck={false}
                // className=
                className="w-full rounded border border-outline bg-white px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-error  disabled:opacity-60"
              />
            </div>
          )}
          {error && (
            <p className="text-sm text-error mt-3 bg-error/5 border border-error/30 rounded px-3 py-2">
              {error}
            </p>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 px-6 pb-5">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <button
            onClick={onConfirm}
            disabled={loading || !canConfirm}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed ${CONFIRM_VARIANTS[variant]}`}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
