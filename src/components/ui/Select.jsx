import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

const Select = forwardRef(function Select(
  { label, error, className, children, required, ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
          {label}
          {required && <span className="text-error"> *</span>}
        </label>
      )}
      <div className="relative flex items-center">
        <select
          ref={ref}
          required={required}
          className={cn(
            'w-full rounded border border-outline bg-white px-3 py-2 pr-9 text-sm text-on-surface appearance-none cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors',
            error && 'border-error',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 text-on-surface-variant"
        />
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
});

export default Select;
