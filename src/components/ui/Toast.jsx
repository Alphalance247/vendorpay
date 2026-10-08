import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const VARIANTS = {
  // All toasts sit on the dark brand surface so the message text stays
  // readable; the icon carries the status colour.
  success: { icon: CheckCircle, classes: 'bg-navy text-white', iconClass: 'text-success' },
  error: { icon: AlertCircle, classes: 'bg-navy text-white', iconClass: 'text-error' },
  info: { icon: Info, classes: 'bg-navy text-white', iconClass: 'text-secondary-fixed-dim' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message, opts = {}) => {
    const id = Date.now() + Math.random();
    const variant = opts.variant || 'success';
    setToasts((list) => [...list, { id, message, variant }]);
    setTimeout(() => dismiss(id), opts.duration ?? 3500);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast: push }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-2 pointer-events-none">
        {toasts.map(({ id, message, variant }) => {
          const v = VARIANTS[variant] || VARIANTS.info;
          const Icon = v.icon;
          return (
            <div
              key={id}
              className={`${v.classes} pointer-events-auto shadow-dropdown rounded-lg px-4 py-3 text-sm flex items-center gap-3 min-w-[260px] max-w-sm animate-fade-in`}
              role="status"
            >
              <Icon size={16} className={v.iconClass} />
              <span className="flex-1">{message}</span>
              <button onClick={() => dismiss(id)} className="opacity-75 hover:opacity-100">
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { toast: (msg) => console.log('[toast]', msg) };
  return ctx;
}
