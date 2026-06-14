import { cn } from '../../lib/utils';

const styles = {
  Active: 'bg-emerald/10 text-emerald',
  Inactive: 'bg-error/10 text-error',
  Paid: 'bg-emerald/10 text-emerald',
  paid: 'bg-emerald/10 text-emerald',
  Pending: 'bg-amber-100 text-amber-700',
  pending: 'bg-amber-100 text-amber-700',
  'Pending Review': 'bg-amber-100 text-amber-700',
  'Awaiting Payment': 'bg-blue-100 text-blue-700',
  InProgress: 'bg-blue-100 text-blue-700',
  Flagged: 'bg-error/10 text-error',
  flagged: 'bg-error/10 text-error',
  Overdue: 'bg-error/10 text-error',
  Submitted: 'bg-surface-container text-on-surface-variant',
  Approved: 'bg-emerald/10 text-emerald',
  Rejected: 'bg-error/10 text-error',
  Denied: 'bg-error/10 text-error',
  'Payment Delayed': 'bg-orange-100 text-orange-700',
  'High Value': 'bg-purple-100 text-purple-700',
  'Vendor Approval': 'bg-blue-100 text-blue-700',
  Compliance: 'bg-yellow-100 text-yellow-700',
};

export default function StatusChip({ status, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        styles[status] ?? 'bg-surface-container text-on-surface-variant',
        className
      )}
    >
      {status}
    </span>
  );
}
