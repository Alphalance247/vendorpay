import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, ShieldCheck, Zap, Globe2, FileCheck2, Building2, UserPlus, Bell,
  Check, X, Lock, Quote, Crown, Eye,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { PLANS } from '../../lib/plans';
import { getCountries } from '../../lib/country';

const NAV_LINKS = [
  { href: '#platform', label: 'Platform' },
  { href: '#coverage', label: 'Global Coverage' },
  { href: '#security', label: 'Security' },
  { href: '#pricing', label: 'Pricing' },
];

const INDUSTRIES = ['Technology', 'Manufacturing', 'Logistics', 'Professional Services', 'Healthcare'];

const FEATURES = [
  { icon: UserPlus, title: 'Vendor Onboarding', description: 'A guided, country-aware setup — vendors enter the right banking fields for where they actually bank, not a one-size-fits-all form.' },
  { icon: FileCheck2, title: 'Invoice Review Workflow', description: 'Submit → Review → Fund → Paid, with a full audit trail on every status change so nothing moves without a record.' },
  { icon: Globe2, title: 'Global Payment Rails', description: 'ACH, SEPA, SWIFT, NIP, PesaLink, and more — pay each vendor over the rail their bank actually supports.' },
  { icon: ShieldCheck, title: 'Team Roles & Permissions', description: 'Owner, Admin, and Reviewer roles, so the person checking an invoice isn’t automatically the person who can pay it.' },
  { icon: Building2, title: 'Branded Company Workspaces', description: 'Every company that joins VendorPay gets its own workspace, reachable at its own subdomain.' },
  { icon: Bell, title: 'Real-Time Notifications', description: 'An in-app activity feed surfaces invoice and payment status the moment something changes — no digging for updates.' },
];

const STEPS = [
  { title: 'Create your workspace', description: 'Set up your company profile and invite your first admin — takes a few minutes, no sales call required.' },
  { title: 'Invite vendors & your team', description: 'Vendors onboard themselves with country-specific banking fields; teammates get assigned Owner, Admin, or Reviewer.' },
  { title: 'Vendors submit invoices', description: 'Vendors upload an invoice and track its status without emailing your finance inbox for updates.' },
  { title: 'Review, fund, and pay', description: 'Your team reviews, approves, and funds — the vendor gets paid over the rail that matches their bank.' },
];

const RAILS = [
  { region: 'United States', code: 'US · ACH', currency: 'USD' },
  { region: 'United Kingdom', code: 'UK · Faster Payments', currency: 'GBP' },
  { region: 'Nigeria', code: 'NG · NIP', currency: 'NGN' },
  { region: 'Kenya', code: 'KE · EFT / RTGS', currency: 'KES' },
  { region: 'Eurozone', code: 'EU · SEPA', currency: 'EUR' },
  { region: 'South Africa', code: 'ZA · EFT', currency: 'ZAR' },
  { region: 'Canada', code: 'CA · EFT', currency: 'CAD' },
  { region: 'Everywhere else', code: 'SWIFT', currency: 'Multi-currency' },
];

const ROLES = [
  { id: 'Owner', icon: Crown, description: 'Full access, including billing and team management. There’s only ever one, and it can’t be reassigned.' },
  { id: 'Admin', icon: ShieldCheck, description: 'Manages vendors, invoices, and payments. No access to billing or removing the Owner.' },
  { id: 'Reviewer', icon: Eye, description: 'Reviews and approves or rejects invoices only. No access to payments, team, or billing.' },
];

const QUEUE_PREVIEW = [
  { vendor: 'Starlight Freight Ltd', rail: 'US · ACH', amount: '$84,920.00', status: 'Funding' },
  { vendor: 'Nordic Hardware AG', rail: 'EU · SEPA', amount: '$62,100.00', status: 'Under Review' },
  { vendor: 'Vanguard Design Studio', rail: 'UK · Faster Payments', amount: '$14,400.00', status: 'Payment Sent' },
];

const STATUS_STYLE = {
  'Funding': 'text-amber bg-amber/10',
  'Under Review': 'text-on-surface-variant bg-surface-container',
  'Payment Sent': 'text-emerald bg-emerald/10',
};

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <Card>
      <div className="w-10 h-10 rounded-lg bg-emerald/10 flex items-center justify-center mb-4">
        <Icon size={20} className="text-emerald" />
      </div>
      <h3 className="text-on-surface font-semibold text-base mb-1.5">{title}</h3>
      <p className="text-on-surface-variant text-sm leading-relaxed">{description}</p>
    </Card>
  );
}

function PlanCard({ plan, onSelect }) {
  return (
    <div className={`relative rounded-xl border-2 p-6 flex flex-col bg-white ${plan.highlight ? 'border-emerald' : 'border-outline-variant'}`}>
      {plan.highlight && (
        <span className="absolute -top-3 left-6 bg-amber text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
          Most Popular
        </span>
      )}
      <p className="font-semibold text-on-surface text-lg">{plan.name}</p>
      <p className="text-sm text-on-surface-variant mt-1">{plan.blurb}</p>
      <p className="mt-4">
        <span className="text-3xl font-bold text-on-surface">{plan.price}</span>
        <span className="text-sm text-on-surface-variant">{plan.period}</span>
      </p>
      <ul className="mt-5 space-y-2.5 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-on-surface-variant">
            <Check size={15} className="text-emerald mt-0.5 flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      {plan.id === 'enterprise' ? (
        <a
          href="mailto:sales@alluvium.net"
          className="mt-6 inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium bg-white text-navy border border-outline-variant hover:bg-surface-low transition-colors"
        >
          Talk to Sales
        </a>
      ) : (
        <Button variant={plan.highlight ? 'primary' : 'secondary'} className="w-full mt-6" onClick={onSelect}>
          Get Started
        </Button>
      )}
    </div>
  );
}

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
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Nav */}
      <header className="border-b border-outline-variant bg-white/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-content mx-auto w-full px-6 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 bg-emerald rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-base font-bold leading-none" style={{ fontFamily: 'Georgia, serif', letterSpacing: '-1px' }}>~</span>
            </div>
            <div className="leading-tight">
              <p className="text-on-surface font-bold text-sm">Alluvium</p>
              <p className="text-emerald text-xs">VendorPay</p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-7 flex-1 justify-center">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="ghost" onClick={() => navigate('/login')}>Sign In</Button>
            <Button onClick={() => navigate('/signup-company')} className="flex items-center gap-1.5">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="scroll-mt-20">
        <div className="max-w-content mx-auto w-full px-6 pt-16 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald/10 text-emerald text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full mb-6">
              Now open to new companies
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-on-surface tracking-tight leading-tight">
              Vendor payments, without the chaos.
            </h1>

            <p className="text-on-surface-variant text-lg mt-5 leading-relaxed">
              Onboard vendors, review invoices, and pay them correctly — across the countries and currencies your suppliers actually use.
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-8">
              <Button size="lg" onClick={() => navigate('/signup-company')} className="flex items-center gap-2">
                Get Started
                <ArrowRight size={18} />
              </Button>
              <Button size="lg" variant="secondary" onClick={() => navigate('/login')}>
                Sign In
              </Button>
            </div>

            <div className="flex items-center gap-6 mt-9">
              <div className="flex items-center gap-2 text-on-surface-variant text-xs font-medium uppercase tracking-wider">
                <ShieldCheck size={14} className="text-emerald" />
                SOC 2 Compliant
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant text-xs font-medium uppercase tracking-wider">
                <Zap size={14} className="text-emerald" />
                256-bit Encryption
              </div>
            </div>
          </div>

          {/* Dashboard mockup */}
          <div className="rounded-xl overflow-hidden bg-navy shadow-2xl">
            <div className="bg-black/20 px-4 py-2.5 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="ml-2 text-[11px] text-slate-400 font-mono truncate">app.vendorpay.alluvium.net/admin/invoices</span>
            </div>
            <div className="bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-on-surface">Invoice Queue</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">3 invoices need attention</p>
                </div>
                <span className="text-[11px] font-semibold text-emerald bg-emerald/10 px-2 py-1 rounded-full">Live</span>
              </div>
              <div className="space-y-2">
                {QUEUE_PREVIEW.map((row) => (
                  <div key={row.vendor} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-surface-low">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-on-surface truncate">{row.vendor}</p>
                      <p className="text-[11px] text-on-surface-variant font-mono mt-0.5">{row.rail}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-semibold tnum text-on-surface">{row.amount}</p>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${STATUS_STYLE[row.status]}`}>{row.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="bg-surface-low py-10 border-y border-outline-variant">
        <div className="max-w-content mx-auto w-full px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-5">
            Built for finance teams across
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {INDUSTRIES.map((industry) => (
              <span key={industry} className="px-4 py-1.5 rounded-full bg-white border border-outline-variant text-sm font-medium text-on-surface-variant">
                {industry}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Problem -> Solution */}
      <section className="py-20">
        <div className="max-w-content mx-auto w-full px-6">
          <div className="max-w-xl mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald block mb-2">Before VendorPay</span>
            <h2 className="text-3xl font-bold text-on-surface tracking-tight">The spreadsheet stops being enough at some point.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl bg-error-container/40 p-7">
              <h3 className="font-semibold text-on-surface mb-4">Without it</h3>
              <ul className="space-y-3">
                {[
                  'Vendor banking details collected over email and loose PDFs',
                  'Approval chains living in Slack threads with no record afterward',
                  'Payment errors from routing the wrong rail to the wrong country',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-on-surface">
                    <X size={16} className="text-error mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl bg-emerald/5 p-7">
              <h3 className="font-semibold text-on-surface mb-4">With VendorPay</h3>
              <ul className="space-y-3">
                {[
                  'Vendors self-onboard with country-specific banking fields',
                  'A clear review workflow — submit, review, fund, paid — with a full audit trail',
                  'The right payment rail for each vendor’s country, every time',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-on-surface">
                    <Check size={16} className="text-emerald mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section id="platform" className="py-20 bg-surface-low scroll-mt-20">
        <div className="max-w-content mx-auto w-full px-6">
          <div className="max-w-xl mb-12">
            <h2 className="text-3xl font-bold text-on-surface tracking-tight mb-2">One workspace for the whole vendor relationship</h2>
            <p className="text-on-surface-variant text-lg">From the first banking form to the last payment confirmation.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => <FeatureCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="max-w-content mx-auto w-full px-6">
          <div className="max-w-xl mb-12">
            <h2 className="text-3xl font-bold text-on-surface tracking-tight mb-2">How it works</h2>
            <p className="text-on-surface-variant text-lg">From setup to a paid vendor, in four steps.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <div key={step.title}>
                <div className="w-11 h-11 rounded-full bg-navy text-white font-bold flex items-center justify-center mb-4">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <h3 className="font-semibold text-on-surface mb-1.5">{step.title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Global coverage */}
      <section id="coverage" className="py-20 bg-navy scroll-mt-20">
        <div className="max-w-content mx-auto w-full px-6">
          <div className="max-w-xl mb-12">
            <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Pay vendors where they actually bank</h2>
            <p className="text-slate-300 text-lg">Local payment rails across every region VendorPay supports today.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {RAILS.map((rail) => (
              <div key={rail.code} className="rounded-xl bg-white/5 p-5">
                <p className="font-mono text-lg font-semibold text-emerald-light">{rail.code}</p>
                <p className="text-sm text-slate-400 mt-1">{rail.region} · {rail.currency}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="py-20 scroll-mt-20">
        <div className="max-w-content mx-auto w-full px-6">
          <div className="rounded-2xl bg-surface-low p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald/10 text-emerald text-xs font-semibold mb-4">
                <ShieldCheck size={14} /> Security
              </span>
              <h2 className="text-3xl font-bold text-on-surface tracking-tight mb-3">Built for handling vendor banking data</h2>
              <p className="text-on-surface-variant text-lg leading-relaxed max-w-xl">
                Vendor bank account numbers, routing details, and IBANs are sensitive by nature — VendorPay is built with that in mind from the ground up, not bolted on after the fact.
              </p>
            </div>
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="p-4 rounded-xl bg-white shadow-card flex items-center gap-4">
                <div className="w-11 h-11 rounded-lg bg-emerald/10 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={22} className="text-emerald" />
                </div>
                <div>
                  <p className="font-semibold text-on-surface">SOC 2 Compliant</p>
                  <p className="text-xs text-on-surface-variant">Following SOC 2 control principles</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white shadow-card flex items-center gap-4">
                <div className="w-11 h-11 rounded-lg bg-emerald/10 flex items-center justify-center flex-shrink-0">
                  <Lock size={22} className="text-emerald" />
                </div>
                <div>
                  <p className="font-semibold text-on-surface">256-bit Encryption</p>
                  <p className="text-xs text-on-surface-variant">Data encrypted in transit and at rest</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-surface-low scroll-mt-20">
        <div className="max-w-content mx-auto w-full px-6">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-on-surface tracking-tight mb-2">Simple plans, by vendor volume</h2>
            <p className="text-on-surface-variant text-lg">Start free, change plans anytime as your vendor list grows.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {PLANS.map((plan) => (
              <PlanCard key={plan.id} plan={plan} onSelect={() => navigate('/signup-company')} />
            ))}
          </div>
        </div>
      </section>

      {/* Roles / multi-company */}
      <section className="py-20">
        <div className="max-w-content mx-auto w-full px-6">
          <div className="max-w-xl mb-12">
            <h2 className="text-3xl font-bold text-on-surface tracking-tight mb-2">Every company gets its own workspace</h2>
            <p className="text-on-surface-variant text-lg">Reachable at its own subdomain, with roles that match how your team actually works.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {ROLES.map(({ id, icon: Icon, description }) => (
              <Card key={id} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-emerald" />
                </div>
                <div>
                  <p className="font-semibold text-on-surface">{id}</p>
                  <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">{description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Honest product-team note, not a fabricated testimonial */}
      <section className="py-20 bg-surface-low">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <Quote size={32} className="text-emerald/40 mx-auto mb-5" />
          <blockquote className="text-2xl font-medium text-on-surface leading-snug">
            "We built VendorPay because paying a vendor in Lagos and one in Berlin shouldn't take two different processes — or a week of your finance team's time."
          </blockquote>
          <p className="text-sm font-semibold text-on-surface-variant mt-5">The VendorPay Team</p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16">
        <div className="max-w-content mx-auto w-full px-6">
          <div
            className="rounded-2xl p-14 text-center relative overflow-hidden"
            style={{ backgroundImage: 'linear-gradient(135deg, #0f1d29 0%, #1a3a52 50%, #0f1d29 100%)' }}
          >
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,.1) 40px, rgba(255,255,255,.1) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,.1) 40px, rgba(255,255,255,.1) 41px)' }}
            />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
                Vendor payments, without the chaos.
              </h2>
              <p className="text-slate-300 text-lg mb-8 max-w-lg mx-auto">
                Set up your company workspace in a few minutes — no sales call required.
              </p>
              <Button size="lg" onClick={() => navigate('/signup-company')} className="flex items-center gap-2 mx-auto">
                Get Started
                <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy pt-16 pb-8">
        <div className="max-w-content mx-auto w-full px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-12 border-b border-white/10">
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 bg-emerald rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-base font-bold leading-none" style={{ fontFamily: 'Georgia, serif', letterSpacing: '-1px' }}>~</span>
                </div>
                <p className="text-white font-bold text-sm">Alluvium VendorPay</p>
              </div>
              <p className="text-slate-400 text-sm max-w-xs">Vendor payments, without the chaos.</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Product</p>
              <ul className="space-y-2">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}><a href={link.href} className="text-sm text-slate-300 hover:text-white transition-colors">{link.label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Account</p>
              <ul className="space-y-2">
                <li><button onClick={() => navigate('/login')} className="text-sm text-slate-300 hover:text-white transition-colors text-left">Sign In</button></li>
                <li><button onClick={() => navigate('/signup-company')} className="text-sm text-slate-300 hover:text-white transition-colors text-left">Get Started</button></li>
              </ul>
            </div>
          </div>
          <p className="text-center text-slate-500 text-xs pt-8">
            &copy; {new Date().getFullYear()} Alluvium Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
