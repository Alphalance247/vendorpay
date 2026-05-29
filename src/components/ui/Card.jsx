import { cn } from '../../lib/utils';

export default function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-outline-variant p-6 shadow-card',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
