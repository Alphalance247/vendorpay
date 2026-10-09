import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const variants = {
  primary: 'bg-primary text-on-primary hover:bg-primary/90 active:bg-primary/90',
  secondary: 'bg-white text-on-surface border border-outline-variant hover:bg-surface-container active:bg-surface-container',
  ghost: 'text-secondary hover:bg-surface-container active:bg-surface-container-high',
  danger: 'bg-error text-white hover:bg-error/90',
};

const sizes = {
  sm: 'w-full lg:w-auto px-3 py-1.5 text-sm font-bold',
  md: 'w-full lg:w-auto px-4 py-2.5 text-sm font-bold',
  lg: 'w-full lg:w-auto px-5 py-3 text-base font-bold',
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
