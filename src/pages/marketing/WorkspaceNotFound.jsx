import { SearchX, Mail } from 'lucide-react';
import Card from '../../components/ui/Card';

const linkBase = 'inline-flex items-center justify-center gap-2 rounded transition-colors duration-150 px-4 py-2 text-sm font-medium';
const primaryLink = `${linkBase} bg-amber text-white hover:bg-amber-dark`;
const secondaryLink = `${linkBase} bg-white text-navy border border-outline-variant hover:bg-surface-low`;

export default function WorkspaceNotFound({ slug, rootDomain }) {
  const attemptedHost = `${slug}.${rootDomain}`;
  const rootUrl = `${window.location.protocol}//${rootDomain}${window.location.port ? `:${window.location.port}` : ''}`;

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Card className="text-center">
          <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center mx-auto mb-4">
            <SearchX size={22} className="text-error" />
          </div>

          <h1 className="text-xl font-semibold text-on-surface tracking-tight">Workspace unavailable</h1>

          <p className="text-on-surface-variant text-sm mt-3 leading-relaxed">
            We couldn't find a VendorPay workspace at
          </p>
          <p className="text-on-surface font-medium text-sm mt-1 mb-3 break-all">{attemptedHost}</p>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            The workspace may have been renamed or never existed. If you think this is a mistake,
            check the link with whoever invited you, or reach out to your workspace administrator.
          </p>

          <div className="flex items-center justify-center gap-3 mt-6">
            <a href={rootUrl} className={primaryLink}>
              Go to VendorPay
            </a>
            <a href="mailto:support@alluvium.net" className={secondaryLink}>
              <Mail size={14} />
              Contact Support
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
