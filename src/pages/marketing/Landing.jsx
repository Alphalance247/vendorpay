import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCountries } from '../../lib/country';

function Icon({ name, className = '', filled = false }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {name}
    </span>
  );
}

const FEATURES = [
  { icon: 'how_to_reg', title: 'Vendor Onboarding', description: "Self-service portal where suppliers enter their localized tax and banking information." },
  { icon: 'fact_check', title: 'Invoice Review Workflow', description: 'Multi-stage review with customized approval thresholds and instant notifications.' },
  { icon: 'public', title: 'Global Payment Rails', description: 'Direct settlement via local domestic clearing networks across 50+ countries.' },
  { icon: 'badge', title: 'Team Roles & Permissions', description: 'Granular separation between workspace owners, invoice reviewers, and finance admins.' },
  { icon: 'storefront', title: 'Branded Company Workspaces', description: "Whitelabel supplier portals with your company's identity and custom subdomain." },
  { icon: 'notifications_active', title: 'Real-Time Notifications', description: 'Instant updates to suppliers upon submission, review, funding, and payment dispatch.' },
];

const STEPS = [
  { num: '01', title: 'Create your workspace', description: 'Configure approval rules, payment methods, and invite finance teammates.' },
  { num: '02', title: 'Invite vendors & your team', description: 'Vendors complete a frictionless, localized onboarding form with bank validation.' },
  { num: '03', title: 'Vendors submit invoices', description: 'Invoices land directly in your automated queue with OCR verification.' },
  { num: '04', title: 'Review, fund, and pay', description: 'Approve with one click and release payments via the optimal domestic rail.' },
];

const ROLES = [
  { icon: 'workspace_premium', title: 'Owner', description: "Full access, including billing and team management. There's only ever one, and it can't be reassigned." },
  { icon: 'admin_panel_settings', title: 'Admin', description: 'Manages vendors, invoices, and payments. No access to billing or removing the Owner.' },
  { icon: 'visibility', title: 'Reviewer', description: 'Reviews and approves or rejects invoices only. No access to payments, team, or billing.' },
];

const NAV_LINKS = [
  { path: 'platform', label: 'Platform', href: '#platform' },
  { path: 'global-coverage', label: 'Global Coverage', href: '#' },
  { path: 'security', label: 'Security', href: '#security' },
  { path: 'pricing', label: 'Pricing', href: '#pricing' },
];

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.add('scroll-smooth');
    return () => document.documentElement.classList.remove('scroll-smooth');
  }, []);

  // Quick test wiring — logs the REST Countries call to the console on load.
  useEffect(() => {
    getCountries().catch(() => {});
  }, []);

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-surface-container-lowest border-b border-surface-variant/40 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        <div className="h-20 w-full max-w-7xl mx-auto px-space-24 lg:px-space-48 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <a className="flex items-center gap-space-12 group cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-secondary transition-colors group-hover:bg-secondary-fixed">
                <Icon name="polyline" className="text-[22px]" />
              </div>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface uppercase leading-none">ALLUVIUM</span>
                <span className="font-label-eyebrow text-label-eyebrow text-secondary uppercase tracking-widest mt-space-2 font-bold">VendorPay</span>
              </div>
            </a>
          </div>
          <nav className="hidden md:flex items-center gap-space-32 h-full">
            {NAV_LINKS.map((link) => (
              <a key={link.path} href={link.href} className="font-body-md text-body-md text-on-surface-variant hover:text-secondary py-2 transition-colors">
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-space-24">
            <a onClick={() => navigate('/login')} className="font-label-caps text-label-caps text-on-surface uppercase tracking-wider hover:text-secondary transition-colors cursor-pointer">
              Sign In
            </a>
            <a
              onClick={() => navigate('/signup-company')}
              className="inline-flex items-center justify-center px-space-24 py-space-12 rounded-lg bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-wider hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
            >
              GET STARTED
            </a>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center ml-space-4">
              <Icon name="person" className="text-on-primary text-[18px]" />
            </div>
          </div>
        </div>
      </header>

      <main className="w-full pt-20 bg-surface flex-1">
        <div className="flex flex-col w-full">
          {/* SECTION 1: HERO */}
          <section className="relative w-full overflow-hidden bg-gradient-to-b from-surface via-surface-container-low to-surface-container-lowest py-space-64 lg:py-space-96">
            <div className="w-full max-w-7xl mx-auto px-space-24 lg:px-space-48">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-48 items-center">
                {/* Left Hero Content */}
                <div className="lg:col-span-6 flex flex-col items-start">
                  <div className="inline-flex items-center gap-space-8 px-space-12 py-space-4 rounded-full bg-surface-container text-secondary mb-space-24">
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                    <span className="font-label-eyebrow text-label-eyebrow uppercase tracking-widest font-bold">NOW OPEN TO NEW COMPANIES</span>
                  </div>
                  <h1 className="font-headline-xl text-headline-xl lg:text-[54px] lg:leading-[60px] text-on-surface tracking-tight mb-space-20">
                    Vendor Management, without the <span className="text-secondary">chaos</span>.
                  </h1>
                  <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mb-space-32">
                    Onboard vendors, review invoices, and track invoice correctly — across the countries and currencies your suppliers actually use.
                  </p>
                  <div className="flex flex-wrap items-center gap-space-16 mb-space-40">
                    <a onClick={() => navigate('/signup-company')} className="inline-flex items-center justify-center px-space-24 py-space-12 rounded-lg bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-wider hover:bg-primary-container transition-all shadow-sm cursor-pointer">
                      GET STARTED →
                    </a>
                    <a onClick={() => navigate('/login')} className="inline-flex items-center justify-center px-space-24 py-space-12 rounded-lg bg-surface-container-lowest text-on-surface font-label-caps text-label-caps uppercase tracking-wider hover:bg-surface-container transition-all shadow-sm cursor-pointer">
                      SIGN IN
                    </a>
                  </div>
                  {/* Trust Badges */}
                  <div className="flex flex-wrap items-center gap-space-24 pt-space-8">
                    <div className="inline-flex items-center gap-space-8 text-on-surface-variant">
                      <Icon name="verified_user" className="text-secondary text-[20px]" filled />
                      <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface">SOC 2 Compliant</span>
                    </div>
                    <div className="inline-flex items-center gap-space-8 text-on-surface-variant">
                      <Icon name="lock" className="text-secondary text-[20px]" filled />
                      <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface">256-bit Encryption</span>
                    </div>
                  </div>
                </div>

                {/* Right Floating Browser Chrome Mockup */}
                <div className="lg:col-span-6 relative">
                  <div className="relative w-full rounded-xl bg-surface-container-lowest shadow-2xl overflow-hidden border border-surface-variant/30 text-left select-none">
                    <div className="p-space-20 lg:p-space-24 bg-surface-container-lowest flex flex-col gap-space-16">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-12 pb-space-8 border-b border-surface-variant/20">
                        <div>
                          <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold text-[20px]">Finance Dashboard</h3>
                          <p className="font-body-sm text-body-sm text-on-surface-variant text-[12px]">Manage your organization's outgoing capital and vendor relations.</p>
                        </div>
                        <div className="flex items-center gap-space-8 shrink-0">
                          <button type="button" className="inline-flex items-center gap-space-4 px-space-12 py-1.5 rounded-lg border border-surface-variant/40 bg-surface-container-lowest text-on-surface font-label-caps text-label-caps text-[11px] hover:bg-surface-container-low transition-colors shadow-sm">
                            <Icon name="download" className="text-[14px] text-on-surface-variant" /> Export Report
                          </button>
                          <button type="button" className="inline-flex items-center gap-space-4 px-space-12 py-1.5 rounded-lg bg-primary text-on-primary font-label-caps text-label-caps text-[11px] hover:bg-primary-container transition-colors shadow-sm">
                            + Review Invoices
                          </button>
                        </div>
                      </div>

                      <div className="rounded-lg bg-[#fff8f2] border border-[#f5d9c2] p-space-12 flex items-center justify-between gap-space-8 text-on-surface">
                        <div className="flex items-center gap-space-8 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-primary-fixed flex items-center justify-center text-primary shrink-0">
                            <Icon name="lightbulb" className="text-[15px]" />
                          </div>
                          <div className="truncate">
                            <span className="font-label-caps text-label-caps text-[11px] font-bold text-on-surface">Finance Command Center Guide</span>
                            <span className="hidden sm:inline text-on-surface-variant text-body-sm text-[11px] ml-space-8">Overview of cash cycles, open approvals &amp; status pipelines</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-space-4 shrink-0 text-on-surface-variant">
                          <Icon name="expand_more" className="text-[16px] cursor-pointer hover:text-on-surface" />
                          <Icon name="close" className="text-[16px] cursor-pointer hover:text-on-surface" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-12">
                        <div className="p-space-12 rounded-lg bg-surface-container-low border border-surface-variant/20 flex flex-col justify-between">
                          <span className="font-label-eyebrow text-label-eyebrow text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Total Vendors</span>
                          <span className="font-headline-md text-headline-md text-on-surface font-bold text-[24px] mt-space-8">21</span>
                        </div>
                        <div className="p-space-12 rounded-lg bg-surface-container-low border border-surface-variant/20 flex flex-col justify-between">
                          <span className="font-label-eyebrow text-label-eyebrow text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Pending Approvals</span>
                          <div className="mt-space-8">
                            <span className="font-headline-md text-headline-md font-bold text-[24px] text-[#ba1a1a]">2</span>
                            <span className="block text-[10px] font-body-sm text-[#ba1a1a] font-medium">Requires action</span>
                          </div>
                        </div>
                        <div className="p-space-12 rounded-lg bg-surface-container-low border border-surface-variant/20 flex flex-col justify-between">
                          <span className="font-label-eyebrow text-label-eyebrow text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Pending Payments</span>
                          <span className="font-headline-md text-headline-md text-on-surface font-bold text-[24px] mt-space-8">0</span>
                        </div>
                        <div className="p-space-12 rounded-lg bg-surface-container-low border border-surface-variant/20 flex flex-col justify-between">
                          <span className="font-label-eyebrow text-label-eyebrow text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Monthly Volume</span>
                          <div className="mt-space-8 flex flex-col">
                            <span className="font-code-mono-sm text-code-mono-sm font-bold text-on-surface text-[12px] truncate">NGN 3,500,011.00</span>
                            <span className="font-code-mono-sm text-code-mono-sm text-on-surface-variant text-[11px]">$980.00</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-space-12 rounded-lg bg-surface-container-low border border-surface-variant/20 flex flex-wrap items-center justify-between gap-y-space-8 text-[11px] font-code-mono-sm text-on-surface-variant">
                        {[
                          ['bg-primary', '2', 'Submitted'],
                          ['bg-surface-variant', '0', 'Reviewed'],
                          ['bg-secondary-fixed-dim', '0', 'Funding'],
                          ['bg-secondary', '4', 'Paid'],
                          ['bg-surface-variant', '0', 'Disputed'],
                          ['bg-error', '2', 'Rejected'],
                          ['bg-outline-variant', '0', 'Flagged'],
                        ].map(([dot, count, label]) => (
                          <div key={label} className="flex items-center gap-space-4">
                            <span className={`w-2 h-2 rounded-full ${dot} inline-block`} />
                            <span className="text-on-surface font-bold">{count}</span> {label}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-space-16">
                        <div className="sm:col-span-7 p-space-16 rounded-lg bg-surface-container-lowest border border-surface-variant/20 flex flex-col justify-between shadow-sm">
                          <div className="flex items-center justify-between mb-space-12">
                            <span className="font-label-eyebrow text-label-eyebrow text-[10px] text-on-surface font-bold uppercase tracking-wider">Invoice Status Breakdown</span>
                            <span className="font-code-mono-sm text-code-mono-sm text-[10px] text-on-surface-variant">8 Total</span>
                          </div>
                          <div className="space-y-space-8 text-[11px]">
                            {[
                              ['Submitted (2)', 'bg-primary', 25],
                              ['Reviewed (0)', 'bg-surface-variant', 0],
                              ['Funding (0)', 'bg-secondary', 0],
                              ['Paid (4)', 'bg-secondary', 50],
                              ['Disputed (0)', 'bg-surface-variant', 0],
                              ['Rejected (2)', 'bg-error', 25],
                              ['Flagged (0)', 'bg-outline-variant', 0],
                            ].map(([label, bar, pct]) => (
                              <div key={label} className="flex items-center justify-between text-on-surface-variant font-body-sm">
                                <span className="w-28 truncate">{label}</span>
                                <div className="flex-1 mx-space-8 bg-surface-container-high h-2 rounded-full overflow-hidden">
                                  <div className={`${bar} h-full rounded-full`} style={{ width: `${pct}%` }} />
                                </div>
                                <span className="w-8 text-right font-code-mono-sm text-on-surface">{pct}%</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="sm:col-span-5 p-space-16 rounded-lg bg-surface-container-lowest border border-surface-variant/20 flex flex-col justify-between shadow-sm">
                          <div>
                            <div className="flex items-center justify-between mb-space-12 pb-space-8 border-b border-surface-variant/20">
                              <span className="font-label-eyebrow text-label-eyebrow text-[10px] text-on-surface font-bold uppercase tracking-wider">Quick Actions</span>
                              <Icon name="check_circle" className="text-secondary text-[16px]" />
                            </div>
                            <div className="space-y-space-8">
                              {[
                                ['description', 'text-primary', 'Review Invoices'],
                                ['group', 'text-secondary', 'View All Vendors'],
                                ['history', 'text-on-surface-variant', 'Payment History'],
                              ].map(([icon, color, label]) => (
                                <div key={label} className="p-space-8 rounded-lg bg-surface-container-low hover:bg-surface-container flex items-center justify-between cursor-pointer transition-colors">
                                  <div className="flex items-center gap-space-8">
                                    <Icon name={icon} className={`text-[16px] ${color}`} />
                                    <span className="font-body-sm text-body-sm text-[11px] text-on-surface font-medium">{label}</span>
                                  </div>
                                  <Icon name="chevron_right" className="text-[14px] text-on-surface-variant" />
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="pt-space-12 text-center border-t border-surface-variant/20 mt-space-8">
                            <span className="font-label-caps text-label-caps text-[10px] text-secondary font-bold hover:underline cursor-pointer tracking-wider">FULL TRANSACTION HISTORY →</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: INDUSTRY STRIP */}
          <section className="w-full bg-surface-container-low py-space-32">
            <div className="w-full max-w-7xl mx-auto px-space-24 lg:px-space-48 flex flex-col items-center">
              <span className="font-label-eyebrow text-label-eyebrow text-secondary uppercase tracking-widest font-bold mb-space-16">
                BUILT FOR FINANCE TEAMS ACROSS
              </span>
              <div className="flex flex-wrap items-center justify-center gap-space-12">
                {['Technology', 'Manufacturing', 'Logistics', 'Professional Services', 'Healthcare'].map((industry) => (
                  <span key={industry} className="px-space-16 py-space-8 rounded-full bg-surface-container-lowest text-on-surface font-body-sm text-body-sm shadow-sm">
                    {industry}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION 3: PROBLEM / SOLUTION COMPARISON */}
          <section className="w-full bg-surface py-space-64 lg:py-space-80">
            <div className="w-full max-w-7xl mx-auto px-space-24 lg:px-space-48">
              <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-space-48">
                <span className="font-label-eyebrow text-label-eyebrow text-secondary uppercase tracking-widest font-bold mb-space-8">
                  BEFORE VENDORPAY
                </span>
                <h2 className="font-headline-lg text-headline-lg text-on-surface">
                  The spreadsheet stops being enough at some point.
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-24">
                <div className="p-space-32 rounded-xl bg-error-container/40 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-space-12 mb-space-24">
                      <span className="w-8 h-8 rounded-full bg-error flex items-center justify-center text-on-error">
                        <Icon name="close" className="text-[18px]" />
                      </span>
                      <h3 className="font-headline-sm text-headline-sm text-error font-bold">Without it</h3>
                    </div>
                    <ul className="space-y-space-20">
                      {[
                        'Vendor banking details collected over email and loose PDFs',
                        'Approval chains living in Slack threads with no record afterward',
                        'Payment errors from routing the wrong rail to the wrong country',
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-space-12">
                          <Icon name="cancel" className="text-error text-[20px] shrink-0 mt-0.5" />
                          <span className="font-body-md text-body-md text-on-surface">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="p-space-32 rounded-xl bg-surface-container shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-space-12 mb-space-24">
                      <span className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-on-secondary">
                        <Icon name="check" className="text-[18px]" />
                      </span>
                      <h3 className="font-headline-sm text-headline-sm text-secondary font-bold">With VendorPay</h3>
                    </div>
                    <ul className="space-y-space-20">
                      {[
                        'Vendors self-onboard with country-specific banking fields',
                        'A clear review workflow — submit, review, fund, paid — with a full audit trail',
                        "The right payment rail for each vendor's country, every time",
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-space-12">
                          <Icon name="check_circle" className="text-secondary text-[20px] shrink-0 mt-0.5" />
                          <span className="font-body-md text-body-md text-on-surface">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 4: FEATURE GRID */}
          <section id="platform" className="w-full bg-surface-container-low py-space-64 lg:py-space-80 scroll-mt-20">
            <div className="w-full max-w-7xl mx-auto px-space-24 lg:px-space-48">
              <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-space-48">
                <h2 className="font-headline-lg text-headline-lg text-on-surface mb-space-12">
                  One workspace for the whole vendor relationship.
                </h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant">
                  From the first banking form to the last payment confirmation.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-24">
                {FEATURES.map((f) => (
                  <div key={f.title} className="p-space-32 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col items-start transition-all hover:shadow-md">
                    <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-secondary mb-space-20">
                      <Icon name={f.icon} className="text-[26px]" />
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface mb-space-8">{f.title}</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant">{f.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION 5: HOW IT WORKS */}
          <section className="w-full bg-surface py-space-64 lg:py-space-80">
            <div className="w-full max-w-7xl mx-auto px-space-24 lg:px-space-48">
              <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-space-48">
                <h2 className="font-headline-lg text-headline-lg text-on-surface mb-space-12">How it works.</h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant">From setup to a paid vendor, in four steps.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-24">
                {STEPS.map((step) => (
                  <div key={step.num} className="p-space-24 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="inline-flex items-center justify-center px-space-12 py-space-4 rounded bg-inverse-surface text-inverse-on-surface font-code-mono-sm text-code-mono-sm font-bold mb-space-16">
                        {step.num}
                      </span>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface mb-space-8">{step.title}</h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION 6: PAYMENT RAILS (DARK SECTION) — not generated in source, intentionally omitted */}

          {/* SECTION 7: SECURITY SECTION */}
          <section id="security" className="w-full bg-surface py-space-64 lg:py-space-80 scroll-mt-20">
            <div className="w-full max-w-7xl mx-auto px-space-24 lg:px-space-48">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-48 items-center">
                <div className="lg:col-span-6 flex flex-col items-start">
                  <div className="inline-flex items-center gap-space-8 px-space-12 py-space-4 rounded-full bg-surface-container text-secondary mb-space-20">
                    <span className="font-label-eyebrow text-label-eyebrow uppercase tracking-widest font-bold">SECURITY</span>
                  </div>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface mb-space-20">
                    Built for handling vendor banking data.
                  </h2>
                  <p className="font-body-lg text-body-lg text-on-surface-variant">
                    Vendor bank account numbers, routing details, and IBANs are sensitive by nature — VendorPay is built with that in mind from the ground up, not bolted on after the fact.
                  </p>
                </div>
                <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-space-24">
                  <div className="p-space-32 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                    <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-secondary mb-space-20">
                      <Icon name="verified" className="text-[28px]" filled />
                    </div>
                    <div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface mb-space-8">SOC 2 Compliant</h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">Following SOC 2 control principles</p>
                    </div>
                  </div>
                  <div className="p-space-32 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                    <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-secondary mb-space-20">
                      <Icon name="enhanced_encryption" className="text-[28px]" filled />
                    </div>
                    <div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface mb-space-8">256-bit Encryption</h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">Data encrypted in transit and at rest.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 8: PRICING SECTION */}
          <section id="pricing" className="w-full bg-surface-container-low py-space-64 lg:py-space-80 scroll-mt-20">
            <div className="w-full max-w-7xl mx-auto px-space-24 lg:px-space-48">
              <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-space-48">
                <h2 className="font-headline-lg text-headline-lg text-on-surface mb-space-12">Simple plans, by vendor volume.</h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant">Start free, change plans anytime as your vendor list grows.</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-24 items-stretch">
                {/* Starter */}
                <div className="p-space-32 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="font-label-eyebrow text-label-eyebrow uppercase tracking-wider text-secondary font-bold">STARTER</span>
                    <div className="mt-space-16 mb-space-8 flex items-baseline">
                      <span className="font-headline-xl text-headline-xl text-on-surface font-bold">$49</span>
                      <span className="font-body-md text-body-md text-on-surface-variant ml-space-4">/mo</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-24">For small teams getting started</p>
                    <ul className="space-y-space-16 pt-space-16 pb-space-32">
                      {['Up to 25 vendors', 'Email support', 'Standard payment rails'].map((f) => (
                        <li key={f} className="flex items-center gap-space-8 text-on-surface font-body-sm text-body-sm">
                          <Icon name="check" className="text-secondary text-[18px]" /> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <a onClick={() => navigate('/signup-company')} className="w-full inline-flex items-center justify-center py-space-12 rounded-lg bg-surface-container text-on-surface font-label-caps text-label-caps uppercase tracking-wider hover:bg-surface-container-high transition-colors shadow-sm cursor-pointer">
                    GET STARTED
                  </a>
                </div>

                {/* Growth (Highlighted) */}
                <div className="p-space-32 rounded-xl bg-surface-container-lowest shadow-lg flex flex-col justify-between relative transform lg:-translate-y-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-label-eyebrow text-label-eyebrow uppercase tracking-wider text-secondary font-bold">GROWTH</span>
                      <span className="px-space-8 py-space-2 rounded-full bg-surface-container text-secondary font-label-eyebrow text-label-eyebrow uppercase font-bold">
                        MOST POPULAR
                      </span>
                    </div>
                    <div className="mt-space-16 mb-space-8 flex items-baseline">
                      <span className="font-headline-xl text-headline-xl text-on-surface font-bold">$149</span>
                      <span className="font-body-md text-body-md text-on-surface-variant ml-space-4">/mo</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-24">For growing finance teams</p>
                    <ul className="space-y-space-16 pt-space-16 pb-space-32">
                      {['Up to 250 vendors', 'Priority support', 'All payment rails', 'Custom branding'].map((f) => (
                        <li key={f} className="flex items-center gap-space-8 text-on-surface font-body-sm text-body-sm">
                          <Icon name="check" className="text-secondary text-[18px]" /> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <a onClick={() => navigate('/signup-company')} className="w-full inline-flex items-center justify-center py-space-12 rounded-lg bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-wider hover:bg-primary-container transition-colors shadow-sm cursor-pointer">
                    GET STARTED
                  </a>
                </div>

                {/* Enterprise */}
                <div className="p-space-32 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="font-label-eyebrow text-label-eyebrow uppercase tracking-wider text-secondary font-bold">ENTERPRISE</span>
                    <div className="mt-space-16 mb-space-8 flex items-baseline">
                      <span className="font-headline-xl text-headline-xl text-on-surface font-bold">Custom</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-24">For large organizations</p>
                    <ul className="space-y-space-16 pt-space-16 pb-space-32">
                      {['Unlimited vendors', 'Dedicated success manager', 'SSO & audit logs', 'Custom domain'].map((f) => (
                        <li key={f} className="flex items-center gap-space-8 text-on-surface font-body-sm text-body-sm">
                          <Icon name="check" className="text-secondary text-[18px]" /> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <a href="mailto:sales@alluvium.net" className="w-full inline-flex items-center justify-center py-space-12 rounded-lg bg-surface-container text-on-surface font-label-caps text-label-caps uppercase tracking-wider hover:bg-surface-container-high transition-colors shadow-sm">
                    TALK TO SALES
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 9: ROLES SECTION */}
          <section className="w-full bg-surface py-space-64 lg:py-space-80">
            <div className="w-full max-w-7xl mx-auto px-space-24 lg:px-space-48">
              <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-space-48">
                <h2 className="font-headline-lg text-headline-lg text-on-surface mb-space-12">Every company gets its own workspace.</h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant">Reachable at its own subdomain, with roles that match how your team actually works.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-24">
                {ROLES.map((role) => (
                  <div key={role.title} className="p-space-32 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-secondary mb-space-20">
                        <Icon name={role.icon} className="text-[26px]" />
                      </div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface mb-space-12">{role.title}</h3>
                      <p className="font-body-md text-body-md text-on-surface-variant">{role.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION 10: TESTIMONIAL */}
          <section className="w-full bg-surface-container-low py-space-64 lg:py-space-80">
            <div className="w-full max-w-4xl mx-auto px-space-24 lg:px-space-48 text-center flex flex-col items-center">
              <Icon name="format_quote" className="text-secondary/30 text-[64px] leading-none mb-space-16 select-none" />
              <blockquote className="font-headline-md text-headline-md lg:text-headline-lg lg:leading-[42px] text-on-surface italic mb-space-24 font-normal">
                "We built VendorPay because paying a vendor in Lagos and one in Berlin shouldn't take two different processes — or a week of your finance team's time."
              </blockquote>
              <div className="flex items-center gap-space-8">
                <span className="w-8 h-[2px] bg-secondary" />
                <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant font-bold">The VendorPay Team</span>
                <span className="w-8 h-[2px] bg-secondary" />
              </div>
            </div>
          </section>

          {/* SECTION 11: CLOSING CTA BAND */}
          <section className="w-full bg-inverse-surface text-inverse-on-surface py-space-80">
            <div className="w-full max-w-4xl mx-auto px-space-24 lg:px-space-48 text-center flex flex-col items-center">
              <h2 className="font-headline-xl text-headline-xl text-surface-container-lowest tracking-tight mb-space-16">
                Vendor payments, without the <span className="text-secondary-fixed">chaos</span>.
              </h2>
              <p className="font-body-lg text-body-lg text-surface-variant mb-space-32 max-w-xl">
                Set up your company workspace in a few minutes — no sales call required.
              </p>
              <a onClick={() => navigate('/signup-company')} className="inline-flex items-center justify-center px-space-32 py-space-16 rounded-lg bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-wider hover:bg-primary-container transition-all shadow-md cursor-pointer">
                GET STARTED →
              </a>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-inverse-surface text-inverse-on-surface pt-space-64 pb-space-48">
        <div className="w-full max-w-7xl mx-auto px-space-24 lg:px-space-48">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-space-48 pb-space-64">
            <div className="md:col-span-6 flex flex-col justify-between pr-0 md:pr-space-48">
              <div className="space-y-space-16">
                <div className="flex items-center gap-space-12">
                  <div className="w-9 h-9 rounded-lg bg-surface-container/20 flex items-center justify-center text-secondary-fixed">
                    <Icon name="polyline" className="text-[22px]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-headline-sm tracking-tight text-surface-container-lowest uppercase leading-none">ALLUVIUM</span>
                    <span className="font-label-eyebrow text-label-eyebrow text-secondary-fixed uppercase tracking-widest mt-space-2 font-bold">VendorPay</span>
                  </div>
                </div>
                <p className="font-body-md text-body-md text-surface-variant max-w-sm">Vendor payments, without the chaos.</p>
              </div>
            </div>
            <div className="md:col-span-3">
              <h4 className="font-label-caps text-label-caps uppercase tracking-wider text-secondary-fixed mb-space-24 font-bold">PRODUCT</h4>
              <ul className="space-y-space-12">
                {NAV_LINKS.map((link) => (
                  <li key={link.path} className="list-none">
                    <a href={link.href} className="font-body-md text-body-md text-surface-variant hover:text-surface-container-lowest transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-3">
              <h4 className="font-label-caps text-label-caps uppercase tracking-wider text-secondary-fixed mb-space-24 font-bold">ACCOUNT</h4>
              <ul className="space-y-space-12">
                <li className="list-none">
                  <a onClick={() => navigate('/login')} className="font-body-md text-body-md text-surface-variant hover:text-surface-container-lowest transition-colors cursor-pointer">Sign In</a>
                </li>
                <li className="list-none">
                  <a onClick={() => navigate('/signup-company')} className="font-body-md text-body-md text-surface-variant hover:text-surface-container-lowest transition-colors cursor-pointer">Get Started</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-surface-variant/20 pt-space-32 text-center">
            <p className="font-body-sm text-body-sm text-surface-variant">© {new Date().getFullYear()} Alluvium Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
