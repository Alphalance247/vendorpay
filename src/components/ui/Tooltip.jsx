import { useState } from 'react';
import { cn } from '../../lib/utils';

const SIDES = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

export default function Tooltip({ text, side = 'top', className, children }) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className={cn(
            'absolute z-50 w-max max-w-[220px] rounded bg-inverse-surface px-2.5 py-1.5 text-xs leading-snug text-inverse-on-surface shadow-dropdown pointer-events-none',
            SIDES[side]
          )}
        >
          {text}
        </span>
      )}
    </span>
  );
}
