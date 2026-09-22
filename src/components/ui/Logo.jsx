// The single brand lockup used everywhere — sourced from the two treatments
// already designed for the landing page (light header, dark footer).

function Icon({ name, className = '' }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

const VARIANTS = {
  light: {
    box: 'bg-surface-container text-secondary group-hover:bg-secondary-fixed',
    wordmark: 'text-on-surface',
    eyebrow: 'text-secondary',
  },
  dark: {
    box: 'bg-surface-container/20 text-secondary-fixed',
    wordmark: 'text-surface-container-lowest',
    eyebrow: 'text-secondary-fixed',
  },
};

export default function Logo({ variant = 'light', onClick, className = '' }) {
  const styles = VARIANTS[variant] ?? VARIANTS.light;
  const Tag = onClick ? 'a' : 'div';

  return (
    <Tag
      onClick={onClick}
      className={`flex items-center gap-space-12 ${onClick ? 'group cursor-pointer' : ''} ${className}`}
    >
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${styles.box}`}
      >
        <Icon name="polyline" className="text-[22px]" />
      </div>
      <div className="flex flex-col min-w-0">
        <span
          className={`font-headline-sm text-headline-sm tracking-tight uppercase leading-none truncate ${styles.wordmark}`}
        >
          ALLUVIUM
        </span>
        <span
          className={`font-label-eyebrow text-label-eyebrow uppercase tracking-widest mt-space-2 font-bold ${styles.eyebrow}`}
        >
          VendorPay
        </span>
      </div>
    </Tag>
  );
}
