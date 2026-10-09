import { X } from 'lucide-react';
import { useEffect } from 'react'

const ChangePasswordForm = ({ open, onClose, title, subtitle, children, footer, size = 'md' }) => {
    useEffect(() => {
        if (!open) return;
        function onKey(e) { if (e.key === 'Escape') onClose?.(); }
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    if (!open) return null;

    const maxWidth = {
        sm: 'max-w-sm',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-3xl',
    }[size] || 'max-w-lg';

    return (
        <div
            className={`bg-white rounded-xl shadow-dropdown w-full ${maxWidth} max-h-[90vh] flex flex-col overflow-hidden border border-outline-variant`}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex items-start justify-between px-5 py-4 border-b border-outline-variant">
                <div>
                    {title && <h3 className="text-base font-semibold text-on-surface">{title}</h3>}
                    {subtitle && <p className="text-xs text-on-surface-variant mt-0.5">{subtitle}</p>}
                </div>
                <button
                    onClick={onClose}
                    className="p-1 rounded hover:bg-surface-container text-on-surface-variant transition-colors"
                    aria-label="Close"
                >
                    <X size={18} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
            {footer && (
                <div className="px-5 py-3 border-t border-outline-variant bg-surface-container flex items-center justify-end gap-2">
                    {footer}
                </div>
            )}
        </div>
    )
}

export default ChangePasswordForm