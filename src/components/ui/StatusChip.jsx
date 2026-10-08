import { cn } from '../../lib/utils';

const styles = {
  Active: 'bg-success-container text-success',
  Inactive: 'bg-error-container text-error',
  Paid: 'bg-success/10 text-success',
  paid: 'bg-success/10 text-success',
  'Payment Confirmed': 'bg-success/20 text-success font-semibold',
  payment_confirmed: 'bg-success/20 text-success font-semibold',
  'Payment Disputed': 'bg-error/10 text-error',
  payment_disputed: 'bg-error/10 text-error',
  Pending: 'bg-warning-container text-warning',
  pending: 'bg-warning-container text-warning',
  'Pending Review': 'bg-warning-container text-warning',
  Reviewed: 'bg-navy/10 text-navy',
  reviewed: 'bg-navy/10 text-navy',
  Funding: 'bg-primary-fixed text-primary',
  funding: 'bg-primary-fixed text-primary',
  'Awaiting Payment': 'bg-navy/10 text-navy',
  InProgress: 'bg-navy/10 text-navy',
  Flagged: 'bg-error/10 text-error',
  flagged: 'bg-error/10 text-error',
  Overdue: 'bg-error/10 text-error',
  Submitted: 'bg-surface-container text-on-surface-variant',
  Approved: 'bg-success/10 text-success',
  Rejected: 'bg-error/10 text-error',
  Denied: 'bg-error/10 text-error',
  'Payment Delayed': 'bg-warning-container text-warning',
  'High Value': 'bg-primary-fixed text-primary',
  'Vendor Approval': 'bg-navy/10 text-navy',
  Compliance: 'bg-warning-container text-warning',
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
