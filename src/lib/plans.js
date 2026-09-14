// Shared plan tier definitions — used by the company sign-up wizard and the
// Billing page's usage meter, so both read from one source of truth.

export const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$49',
    period: '/mo',
    blurb: 'For small teams getting started',
    features: ['Up to 25 vendors', 'Email support', 'Standard payment rails'],
    vendorLimit: 25,
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '$149',
    period: '/mo',
    blurb: 'For growing finance teams',
    features: ['Up to 250 vendors', 'Priority support', 'All payment rails', 'Custom branding'],
    vendorLimit: 250,
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    blurb: 'For large organizations',
    features: ['Unlimited vendors', 'Dedicated success manager', 'SSO & audit logs', 'Custom domain'],
    vendorLimit: Infinity,
  },
];
