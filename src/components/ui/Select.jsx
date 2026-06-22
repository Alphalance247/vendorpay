import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const Select = forwardRef(function Select(
  { label, error, className, children, ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={cn(
          'w-full rounded border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface appearance-none cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-amber focus:border-amber transition-colors',
          error && 'border-error',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
});

export default Select;
