import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  PartyPopper,
  AlertTriangle,
} from "lucide-react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Card from "../../components/ui/Card";
import { useAcceptInvite } from "../../hooks/useQueries/companyAuth/useAcceptInvite";

const INDUSTRIES = [
  "Technology",
  "Manufacturing",
  "Logistics",
  "Professional Services",
  "Healthcare",
  "Retail",
  "Other",
];

const DEPARTMENTS = ["Finance", "Accounting", "Operations", "Legal", "Other"];

// The invite token is a JWT (same shape as our access tokens), so the role
// it was issued for can be read straight off it — no extra lookup endpoint
// needed to know whether to show the vendor-specific fields.
function decodeInviteRole(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload?.role ?? payload?.user_type ?? null;
  } catch {
    return null;
  }
}

function Brand() {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      <div className="w-8 h-8 bg-navy rounded flex items-center justify-center">
        <span className="text-white text-sm font-bold">VP</span>
      </div>
      <span className="text-navy font-semibold text-lg">VendorPay</span>
    </div>
  );
}

function InvalidInvite({ reason }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Brand />
        <Card className="text-center">
          <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={22} className="text-error" />
          </div>
          <h1 className="text-xl font-semibold text-on-surface tracking-tight">
            Invite link invalid
          </h1>
          <p className="text-on-surface-variant text-sm mt-2 leading-relaxed">
            {reason}
          </p>
          <Button className="w-full mt-6" onClick={() => navigate("/login")}>
            Go to Login
          </Button>
        </Card>
      </div>
    </div>
  );
}

function SuccessScreen() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-full bg-emerald/10 flex items-center justify-center mx-auto mb-4">
          <PartyPopper size={26} className="text-emerald" />
        </div>
        <h1 className="text-2xl font-semibold text-on-surface tracking-tight">
          You're all set
        </h1>
        <p className="text-on-surface-variant text-sm mt-1.5">
          Your account has been created. Sign in to get started.
        </p>
        <Button
          size="lg"
          className="w-full mt-6"
          onClick={() => navigate("/login")}
        >
          Go to Login
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
}

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const role = decodeInviteRole(token);
  const isVendor = role === "vendor";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
    fullName: "",
    companyName: "",
    taxId: "",
    businessType: "",
    businessAddress: "",
    website: "",
    industry: "",
    contactFirstName: "",
    contactLastName: "",
    contactEmail: "",
    phone: "",
    jobTitle: "",
    department: "",
  });

  const acceptInvite = useAcceptInvite();

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  if (!token) {
    return (
      <InvalidInvite reason="This invite link is missing its token. Ask whoever invited you to resend the invitation." />
    );
  }

  if (acceptInvite.isSuccess) {
    return <SuccessScreen />;
  }

  const mismatch =
    form.password &&
    form.confirmPassword &&
    form.password !== form.confirmPassword;
  const tooShort = form.password && form.password.length < 8;

  function validate() {
    if (
      !form.password ||
      form.password.length < 8 ||
      form.password !== form.confirmPassword ||
      !form.fullName ||
      !form.companyName
    ) {
      return false;
    }
    if (isVendor) {
      return (
        form.taxId &&
        form.businessType &&
        form.businessAddress &&
        form.contactFirstName &&
        form.contactLastName &&
        form.contactEmail &&
        form.phone
      );
    }
    return true;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) {
      setError("Please fill in all required fields before continuing.");
      return;
    }
    setError("");

    const payload = {
      token,
      password: form.password,
      full_name: form.fullName,
      company_name: form.companyName,
    };

    if (isVendor) {
      Object.assign(payload, {
        tax_id: form.taxId,
        business_type: form.businessType,
        business_address: form.businessAddress,
        website: form.website,
        industry: form.industry,
        contact_first_name: form.contactFirstName,
        contact_last_name: form.contactLastName,
        contact_email: form.contactEmail,
        phone: form.phone,
        job_title: form.jobTitle,
        department: form.department,
      });
    }

    acceptInvite.mutate(payload);
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <Brand />

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-on-surface tracking-tight">
            Accept your invite
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            {isVendor
              ? "Set a password and complete your vendor profile to get started."
              : "Set a password to activate your account."}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-outline-variant shadow-sm p-6 space-y-6"
        >
          <div className="space-y-4">
            <h2 className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
              Your account
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Input
                  label="Full Name"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Jane Smith"
                  required
                  autoFocus
                />
              </div>
              <div className="col-span-2">
                <Input
                  label="Company Name"
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  placeholder="e.g. Acme Corporation"
                  required
                />
              </div>
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                hint="At least 8 characters"
                error={
                  tooShort
                    ? "Password must be at least 8 characters"
                    : undefined
                }
                required
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="text-outline hover:text-on-surface-variant"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
              <Input
                label="Confirm Password"
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                error={mismatch ? "Passwords do not match" : undefined}
                required
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowConfirm((s) => !s)}
                    className="text-outline hover:text-on-surface-variant"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
            </div>
          </div>

          {isVendor && (
            <div className="space-y-4 pt-6 border-t border-outline-variant">
              <h2 className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
                Business details
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Tax ID / EIN"
                  name="taxId"
                  value={form.taxId}
                  onChange={handleChange}
                  placeholder="XX-XXXXXXX"
                  required
                />
                <Input
                  label="Business Type"
                  name="businessType"
                  value={form.businessType}
                  onChange={handleChange}
                  placeholder="e.g. LLC, Corporation"
                  required
                />
                <div className="col-span-2">
                  <Input
                    label="Business Address"
                    name="businessAddress"
                    value={form.businessAddress}
                    onChange={handleChange}
                    placeholder="123 Main Street, New York, NY 10001"
                    required
                  />
                </div>
                <Input
                  label="Website"
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  placeholder="https://yourcompany.com"
                />
                <Select
                  label="Industry"
                  name="industry"
                  value={form.industry}
                  onChange={handleChange}
                >
                  <option value="">Select industry</option>
                  {INDUSTRIES.map((i) => (
                    <option key={i}>{i}</option>
                  ))}
                </Select>
              </div>

              <h2 className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase pt-2">
                Primary contact
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Contact First Name"
                  name="contactFirstName"
                  value={form.contactFirstName}
                  onChange={handleChange}
                  placeholder="Jane"
                  required
                />
                <Input
                  label="Contact Last Name"
                  name="contactLastName"
                  value={form.contactLastName}
                  onChange={handleChange}
                  placeholder="Smith"
                  required
                />
                <Input
                  label="Contact Email"
                  type="email"
                  name="contactEmail"
                  value={form.contactEmail}
                  onChange={handleChange}
                  placeholder="jane@company.com"
                  required
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  required
                />
                <Input
                  label="Job Title"
                  name="jobTitle"
                  value={form.jobTitle}
                  onChange={handleChange}
                  placeholder="Accounts Payable Manager"
                />
                <Select
                  label="Department"
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                >
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </Select>
              </div>
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full flex items-center justify-center gap-2"
            disabled={acceptInvite.isPending}
          >
            {acceptInvite.isPending ? (
              "Creating account..."
            ) : (
              <>
                <Check size={16} />
                Accept Invite
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
