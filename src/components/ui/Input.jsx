import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const Input = forwardRef(function Input(
  { label, error, hint, className, prefix, suffix, ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-on-surface-variant text-sm select-none">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full rounded border bg-white px-3 py-2 text-sm text-on-surface placeholder:text-outline transition-colors',
            'border-outline-variant focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary',
            error && 'border-error focus:ring-error',
            prefix && 'pl-7',
            suffix && 'pr-10',
            className
          )}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 flex items-center">
            {suffix}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
      {hint && !error && <p className="text-xs text-on-surface-variant">{hint}</p>}
    </div>
  );
});

export default Input;
