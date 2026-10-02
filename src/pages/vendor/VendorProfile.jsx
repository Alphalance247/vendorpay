import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle,
  User,
  Landmark,
  Pencil,
  X,
} from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { vendorService } from "../../lib/services/vendorService";
import {
  extractErrorMessage,
  CURRENCY_SYMBOLS,
  cn,
  maskAccountNumber,
} from "../../lib/utils";

const BUSINESS_TYPES = [
  "LLC",
  "Corporation",
  "Sole Proprietorship",
  "Partnership",
  "Non-Profit",
  "Other",
];
const INDUSTRIES = [
  "Technology",
  "Finance",
  "Healthcare",
  "Education",
  "Retail",
  "Manufacturing",
  "Construction",
  "Consulting",
  "Media",
  "Logistics",
  "Agriculture",
  "Other",
];
const ACCOUNT_TYPES = [
  "Checking",
  "Current",
  "Savings",
  "Chequing",
  "Domiciliary",
  "Transmission",
];

const TABS = [
  { key: "contact", label: "Contact" },
  { key: "company", label: "Company" },
  { key: "banking", label: "Banking" },
];

const TAB_SUBTITLES = {
  contact: "Update the contact details used on your invoices and communications.",
  company: "Keep your company details accurate for invoicing and compliance.",
  banking:
    "Manage the account your payouts are sent to. Changes are reviewed before taking effect.",
};

export default function VendorProfile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("contact");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    contact_first_name: "",
    contact_last_name: "",
    contact_email: "",
    phone: "",
    job_title: "",
    department: "",
    company_name: "",
    business_type: "",
    business_address: "",
    website: "",
    industry: "",
    tax_id: "",
    currency: "",
  });

  const [banking, setBanking] = useState({
    bank_name: "",
    account_name: "",
    account_type: "",
    account_number: "",
    routing_number: "",
    swift_code: "",
    iban: "",
  });
  const [bankingCountryType, setBankingCountryType] = useState(null);
  const [bankingEditing, setBankingEditing] = useState(false);
  const [bankingDraft, setBankingDraft] = useState(null);
  const [bankingSaving, setBankingSaving] = useState(false);
  const [bankingSaved, setBankingSaved] = useState(false);
  const [bankingError, setBankingError] = useState("");

  useEffect(() => {
    vendorService
      .getProfile()
      .then((data) => {
        setForm({
          contact_first_name: data.contact_first_name ?? "",
          contact_last_name: data.contact_last_name ?? "",
          contact_email: data.contact_email ?? "",
          phone: data.phone ?? "",
          job_title: data.job_title ?? "",
          department: data.department ?? "",
          company_name: data.company_name ?? "",
          business_type: data.business_type ?? "",
          business_address: data.business_address ?? "",
          website: data.website ?? "",
          industry: data.industry ?? "",
          tax_id: data.tax_id ?? "",
          currency: data.currency ?? "",
        });
        setBanking({
          bank_name: data.bank_name ?? "",
          account_name: data.account_name ?? "",
          account_type: data.account_type ?? "",
          account_number: data.account_number ?? "",
          routing_number: data.routing_number ?? "",
          swift_code: data.swift_code ?? "",
          iban: data.iban ?? "",
        });
        setBankingCountryType(data.country_type ?? null);
      })
      .catch(() => setError("Failed to load profile."))
      .finally(() => setLoading(false));
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const { ...editable } = form;
      await vendorService.updateProfile(editable);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function startBankingEdit() {
    setBankingDraft({
      bank_name: banking.bank_name,
      account_name: banking.account_name,
      account_type: banking.account_type,
      account_number: "",
      confirm_account_number: "",
      routing_number: banking.routing_number,
      swift_code: banking.swift_code,
      iban: banking.iban,
    });
    setBankingError("");
    setBankingSaved(false);
    setBankingEditing(true);
  }

  function cancelBankingEdit() {
    setBankingEditing(false);
    setBankingDraft(null);
    setBankingError("");
  }

  function handleBankingDraftChange(e) {
    const { name, value } = e.target;
    setBankingDraft((d) => ({ ...d, [name]: value }));
  }

  async function submitBanking(e) {
    e.preventDefault();
    if (
      !bankingDraft.bank_name ||
      !bankingDraft.account_name ||
      !bankingDraft.account_type ||
      !bankingDraft.account_number ||
      !bankingDraft.routing_number
    ) {
      setBankingError("Please fill in all required banking fields.");
      return;
    }
    if (bankingDraft.account_number !== bankingDraft.confirm_account_number) {
      setBankingError("Account numbers do not match.");
      return;
    }
    setBankingSaving(true);
    setBankingError("");
    try {
      const updated = {
        bank_name: bankingDraft.bank_name,
        account_name: bankingDraft.account_name,
        account_type: bankingDraft.account_type,
        account_number: bankingDraft.account_number,
        routing_number: bankingDraft.routing_number,
        swift_code: bankingDraft.swift_code,
        iban: bankingDraft.iban,
      };
      await vendorService.updateBanking({
        ...updated,
        ...(bankingCountryType && { country_type: bankingCountryType }),
      });
      setBanking(updated);
      setBankingEditing(false);
      setBankingDraft(null);
      setBankingSaved(true);
    } catch (err) {
      setBankingError(extractErrorMessage(err));
    } finally {
      setBankingSaving(false);
    }
  }

  const initials =
    [form.contact_first_name, form.contact_last_name]
      .filter(Boolean)
      .map((s) => s[0])
      .join("")
      .toUpperCase() || "?";

  if (loading) {
    return (
      <AppLayout role="vendor">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={28} className="animate-spin text-emerald" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="vendor">
      <div className="space-y-6 max-w-2xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <ArrowLeft size={15} /> Back
        </button>

        <div>
          <h1 className="text-2xl font-semibold text-on-surface">My Profile</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            {TAB_SUBTITLES[activeTab]}
          </p>
        </div>

        {/* Identity header — persistent across tabs */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-amber flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xl font-bold">{initials}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-on-surface">
              {[form.contact_first_name, form.contact_last_name]
                .filter(Boolean)
                .join(" ") || "Your Name"}
            </p>
            <p className="text-xs text-on-surface-variant">
              {form.contact_email || "contact email"}
            </p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-6 border-b border-outline-variant">
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "relative py-3 text-sm font-medium transition-colors flex items-center gap-2",
                  active
                    ? "text-amber"
                    : "text-on-surface-variant hover:text-on-surface",
                )}
              >
                {tab.label}
                {tab.key === "banking" && bankingSaved && (
                  <span className="text-[10px] font-semibold bg-amber/15 text-amber px-2 py-0.5 rounded-full">
                    Pending Review
                  </span>
                )}
                {active && (
                  <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-amber rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {activeTab === "contact" && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                {error}
              </div>
            )}

            {saved && (
              <div className="p-3 bg-emerald/10 border border-emerald/30 rounded text-emerald text-sm flex items-center gap-2">
                <CheckCircle size={15} /> Profile updated successfully.
              </div>
            )}

            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-4 flex items-center gap-1.5">
                <User size={12} /> Contact Information
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  name="contact_first_name"
                  value={form.contact_first_name}
                  onChange={handleChange}
                  placeholder="Jane"
                />
                <Input
                  label="Last Name"
                  name="contact_last_name"
                  value={form.contact_last_name}
                  onChange={handleChange}
                  placeholder="Doe"
                />

                {/* Read-only fields */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
                    Contact Email
                  </label>
                  <div className="relative">
                    <input
                      readOnly
                      value={form.contact_email}
                      className="w-full rounded border border-outline-variant bg-surface-container px-3 py-2 text-sm text-on-surface-variant cursor-not-allowed select-none"
                    />
                  </div>
                  <p className="text-[11px] text-outline">
                    To update,{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/vendor/support")}
                      className="text-amber underline hover:no-underline"
                    >
                      contact support
                    </button>
                    .
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
                    Phone
                  </label>
                  <div className="relative">
                    <input
                      readOnly
                      value={form.phone}
                      className="w-full rounded border border-outline-variant bg-surface-container px-3 py-2 text-sm text-on-surface-variant cursor-not-allowed select-none"
                    />
                  </div>
                  <p className="text-[11px] text-outline">
                    To update,{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/vendor/support")}
                      className="text-amber underline hover:no-underline"
                    >
                      contact support
                    </button>
                    .
                  </p>
                </div>

                <Input
                  label="Job Title"
                  name="job_title"
                  value={form.job_title}
                  onChange={handleChange}
                  placeholder="Finance Manager"
                />
                <Input
                  label="Department"
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  placeholder="Finance"
                />
              </div>
            </Card>

            <div className="flex gap-3">
              <Button type="submit" disabled={saving} size="lg">
                {saving ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <Save size={15} /> Save Changes
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {activeTab === "company" && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                {error}
              </div>
            )}

            {saved && (
              <div className="p-3 bg-emerald/10 border border-emerald/30 rounded text-emerald text-sm flex items-center gap-2">
                <CheckCircle size={15} /> Profile updated successfully.
              </div>
            )}

            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-4">
                Company Details
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Legal Company Name"
                  name="company_name"
                  value={form.company_name}
                  onChange={handleChange}
                  placeholder="Acme Corp Ltd"
                  className="col-span-2"
                />
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
                    Business Type
                  </label>
                  <select
                    name="business_type"
                    value={form.business_type}
                    onChange={handleChange}
                    className="w-full rounded border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-amber focus:border-amber transition-colors"
                  >
                    <option value="">Select type</option>
                    {BUSINESS_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
                    Industry
                  </label>
                  <select
                    name="industry"
                    value={form.industry}
                    onChange={handleChange}
                    className="w-full rounded border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-amber focus:border-amber transition-colors"
                  >
                    <option value="">Select industry</option>
                    {INDUSTRIES.map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Tax ID"
                  name="tax_id"
                  value={form.tax_id}
                  onChange={handleChange}
                  placeholder="12-3456789"
                />
                <Input
                  label="Website"
                  name="website"
                  type="url"
                  value={form.website}
                  onChange={handleChange}
                  placeholder="https://acme.com"
                />
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
                    Preferred Currency
                  </label>
                  <select
                    name="currency"
                    value={form.currency}
                    onChange={handleChange}
                    className="w-full rounded border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-amber focus:border-amber transition-colors"
                  >
                    <option value="">Select currency</option>
                    {Object.keys(CURRENCY_SYMBOLS).map((code) => (
                      <option key={code} value={code}>
                        {code} ({CURRENCY_SYMBOLS[code]})
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Business Address"
                  name="business_address"
                  value={form.business_address}
                  onChange={handleChange}
                  placeholder="123 Main St, City, Country"
                  className="col-span-2"
                />
              </div>
            </Card>

            <div className="flex gap-3">
              <Button type="submit" disabled={saving} size="lg">
                {saving ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <Save size={15} /> Save Changes
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {activeTab === "banking" && (
          <Card className="border-amber/30">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant flex items-center gap-1.5">
                <Landmark size={12} className="text-amber" /> Banking Details
              </p>
              {!bankingEditing && (
                <button
                  type="button"
                  onClick={startBankingEdit}
                  className="text-xs font-medium text-amber hover:underline flex items-center gap-1"
                >
                  <Pencil size={12} /> Edit
                </button>
              )}
            </div>

            {bankingError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                {bankingError}
              </div>
            )}

            {bankingSaved && (
              <div className="mb-4 p-3 bg-emerald/10 border border-emerald/30 rounded text-emerald text-sm flex items-center gap-2">
                <CheckCircle size={15} /> Your updated banking details have
                been submitted for admin review.
              </div>
            )}

            {!bankingEditing ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
                    Bank Name
                  </label>
                  <p className="text-sm text-on-surface py-2">
                    {banking.bank_name || "—"}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
                    Account Name
                  </label>
                  <p className="text-sm text-on-surface py-2">
                    {banking.account_name || "—"}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
                    Account Type
                  </label>
                  <p className="text-sm text-on-surface py-2">
                    {banking.account_type || "—"}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
                    Account Number
                  </label>
                  <p className="text-sm text-on-surface py-2 tnum">
                    {maskAccountNumber(banking.account_number)}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
                    Routing / Sort / Branch Number
                  </label>
                  <p className="text-sm text-on-surface py-2">
                    {banking.routing_number || "—"}
                  </p>
                </div>
                {banking.swift_code && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
                      SWIFT / BIC
                    </label>
                    <p className="text-sm text-on-surface py-2">
                      {banking.swift_code}
                    </p>
                  </div>
                )}
                {banking.iban && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
                      IBAN
                    </label>
                    <p className="text-sm text-on-surface py-2">
                      {banking.iban}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={submitBanking} className="space-y-4">
                <div className="bg-amber/5 border border-amber/20 rounded-lg p-3 text-sm text-amber-900">
                  Updated banking details must be re-verified before use —
                  payouts will wait on admin review before going to the new
                  account.
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Bank Name"
                    name="bank_name"
                    value={bankingDraft.bank_name}
                    onChange={handleBankingDraftChange}
                    placeholder="e.g. Chase, Barclays"
                    required
                  />
                  <Input
                    label="Account Name"
                    name="account_name"
                    value={bankingDraft.account_name}
                    onChange={handleBankingDraftChange}
                    placeholder="Name on the bank account"
                    required
                  />
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
                      Account Type<span className="text-error"> *</span>
                    </label>
                    <select
                      name="account_type"
                      value={bankingDraft.account_type}
                      onChange={handleBankingDraftChange}
                      className="w-full rounded border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-amber focus:border-amber transition-colors"
                    >
                      <option value="">Select account type</option>
                      {ACCOUNT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="Routing / Sort / Branch Number"
                    name="routing_number"
                    value={bankingDraft.routing_number}
                    onChange={handleBankingDraftChange}
                    placeholder="Enter routing, sort, or branch number"
                    required
                  />
                  <Input
                    label="New Account Number"
                    name="account_number"
                    value={bankingDraft.account_number}
                    onChange={handleBankingDraftChange}
                    placeholder="Enter new account number"
                    required
                  />
                  <Input
                    label="Confirm Account Number"
                    name="confirm_account_number"
                    value={bankingDraft.confirm_account_number}
                    onChange={handleBankingDraftChange}
                    placeholder="Re-enter new account number"
                    error={
                      bankingDraft.account_number &&
                      bankingDraft.confirm_account_number &&
                      bankingDraft.account_number !==
                        bankingDraft.confirm_account_number
                        ? "Account numbers do not match"
                        : undefined
                    }
                    required
                  />
                  <Input
                    label="SWIFT / BIC"
                    name="swift_code"
                    value={bankingDraft.swift_code}
                    onChange={handleBankingDraftChange}
                    placeholder="Optional — required for international wires"
                  />
                  <Input
                    label="IBAN"
                    name="iban"
                    value={bankingDraft.iban}
                    onChange={handleBankingDraftChange}
                    placeholder="Optional"
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={bankingSaving} size="lg">
                    {bankingSaving ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />{" "}
                        Submitting…
                      </>
                    ) : (
                      <>
                        <Save size={15} /> Submit for Review
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={cancelBankingEdit}
                    disabled={bankingSaving}
                  >
                    <X size={15} /> Cancel
                  </Button>
                </div>
              </form>
            )}
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
