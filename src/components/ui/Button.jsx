import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const variants = {
  primary: 'bg-primary text-on-primary hover:bg-primary-container active:bg-primary-container',
  secondary: 'bg-white text-on-surface border border-outline-variant hover:bg-surface-low active:bg-surface-container',
  ghost: 'text-secondary hover:bg-surface-container active:bg-surface-high',
  danger: 'bg-error text-white hover:bg-error/90',
  emerald: 'bg-emerald text-white hover:bg-emerald/90',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm font-medium',
  md: 'px-4 py-2 text-sm font-medium',
  lg: 'px-5 py-2.5 text-base font-medium',
};

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', className, children, disabled, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});

export default Button;
