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
import StatusChip from "../../components/ui/StatusChip";
import { useToast } from "../../components/ui/Toast";
import { useBanking } from "../../hooks/useQueries/vendorAdmin/useBanking";
import { useUpdateBanking } from "../../hooks/useQueries/vendorAdmin/useUpdateBanking";
import { vendorService } from "../../lib/services/vendorService";
import { extractErrorMessage, CURRENCY_SYMBOLS, cn } from "../../lib/utils";

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
const COUNTRY_TYPES = ["ACH", "FASTER_PAYMENTS", "NIP", "PESALINK", "SWIFT"];

const BANKING_STATUS_LABEL = {
  pending: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
};

const TABS = [
  { key: "contact", label: "Contact" },
  { key: "company", label: "Company" },
  { key: "banking", label: "Banking" },
];

const TAB_SUBTITLES = {
  contact:
    "Update the contact details used on your invoices and communications.",
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

  const { toast } = useToast();
  const bankingQuery = useBanking();
  const banking = bankingQuery.data ?? null;
  const [bankingEditing, setBankingEditing] = useState(false);
  const [bankingDraft, setBankingDraft] = useState(null);

  const updateBanking = useUpdateBanking(() => {
    setBankingEditing(false);
    setBankingDraft(null);
  });

  const bankingStatus = !banking
    ? null
    : banking.is_verified
      ? "approved"
      : banking.rejection_reason
        ? "rejected"
        : "pending";

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
      bank_name: banking?.bank_name ?? "",
      account_name: banking?.account_name ?? "",
      account_type: banking?.account_type ?? "",
      country_type: banking?.country_type ?? "",
      bank_code: banking?.bank_code ?? "",
      swift_code: banking?.swift_code ?? "",
      account_number: "",
      confirm_account_number: "",
    });
    setBankingEditing(true);
  }

  function cancelBankingEdit() {
    setBankingEditing(false);
    setBankingDraft(null);
  }

  function handleBankingDraftChange(e) {
    const { name, value } = e.target;
    setBankingDraft((d) => ({ ...d, [name]: value }));
  }

  function submitBanking(e) {
    e.preventDefault();
    if (
      !bankingDraft.bank_name ||
      !bankingDraft.account_name ||
      !bankingDraft.account_type ||
      !bankingDraft.country_type ||
      !bankingDraft.bank_code ||
      !bankingDraft.account_number
    ) {
      toast("Please fill in all required banking fields.", {
        variant: "error",
      });
      return;
    }
    if (bankingDraft.account_number !== bankingDraft.confirm_account_number) {
      toast("Account numbers do not match.", { variant: "error" });
      return;
    }
    updateBanking.mutate({
      bank_name: bankingDraft.bank_name,
      account_name: bankingDraft.account_name,
      account_type: bankingDraft.account_type,
      country_type: bankingDraft.country_type,
      bank_code: bankingDraft.bank_code,
      swift_code: bankingDraft.swift_code,
      account_number: bankingDraft.account_number,
    });
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
          <Loader2 size={28} className="animate-spin text-secondary" />
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
          <h1 className="font-headline-lg text-2xl font-semibold text-on-surface">My Profile</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            {TAB_SUBTITLES[activeTab]}
          </p>
        </div>

        {/* Identity header — persistent across tabs */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-warning flex items-center justify-center flex-shrink-0">
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
                    ? "text-warning"
                    : "text-on-surface-variant hover:text-on-surface",
                )}
              >
                {tab.label}
                {tab.key === "banking" && bankingStatus && (
                  <StatusChip
                    status={BANKING_STATUS_LABEL[bankingStatus]}
                    className="text-[10px] px-2 py-0.5"
                  />
                )}
                {active && (
                  <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-warning rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {activeTab === "contact" && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-error/5 border border-error/30 rounded text-error text-sm">
                {error}
              </div>
            )}

            {saved && (
              <div className="p-3 bg-success/10 border border-success/30 rounded text-success text-sm flex items-center gap-2">
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
                      className="text-warning underline hover:no-underline"
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
                      className="text-warning underline hover:no-underline"
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
              <div className="p-3 bg-error/5 border border-error/30 rounded text-error text-sm">
                {error}
              </div>
            )}

            {saved && (
              <div className="p-3 bg-success/10 border border-success/30 rounded text-success text-sm flex items-center gap-2">
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
                    className="w-full rounded border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-warning focus:border-warning transition-colors"
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
                    className="w-full rounded border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-warning focus:border-warning transition-colors"
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
                    className="w-full rounded border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-warning focus:border-warning transition-colors"
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
          <Card className="border-warning/30">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant flex items-center gap-1.5">
                <Landmark size={12} className="text-warning" /> Banking Details
              </p>
              {!bankingEditing && !bankingQuery.isLoading && (
                <button
                  type="button"
                  onClick={startBankingEdit}
                  className="text-xs font-medium text-secondary hover:underline flex items-center gap-1"
                >
                  <Pencil size={12} /> {banking ? "Edit" : "Add"}
                </button>
              )}
            </div>

            {bankingQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-secondary" />
              </div>
            ) : !bankingEditing ? (
              !banking ? (
                <p className="text-sm text-on-surface-variant py-2">
                  No banking details submitted yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {bankingStatus === "rejected" && banking.rejection_reason && (
                    <div className="p-3 bg-error/5 border border-error/30 rounded text-sm text-error">
                      <span className="font-medium">Rejected:</span>{" "}
                      {banking.rejection_reason}
                    </div>
                  )}
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
                        Country Type
                      </label>
                      <p className="text-sm text-on-surface py-2">
                        {banking.country_type || "—"}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
                        Bank Code
                      </label>
                      <p className="text-sm text-on-surface py-2">
                        {banking.bank_code || "—"}
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
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    For security, your account number isn't shown here. Click
                    Edit to update it.
                  </p>
                </div>
              )
            ) : (
              <form onSubmit={submitBanking} className="space-y-4">
                <div className="bg-warning/5 border border-warning/20 rounded-lg p-3 text-sm text-on-surface">
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
                      className="w-full rounded border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-warning focus:border-warning transition-colors"
                    >
                      <option value="">Select account type</option>
                      {ACCOUNT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
                      Country Type<span className="text-error"> *</span>
                    </label>
                    <select
                      name="country_type"
                      value={bankingDraft.country_type}
                      onChange={handleBankingDraftChange}
                      className="w-full rounded border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-warning focus:border-warning transition-colors"
                    >
                      <option value="">Select country type</option>
                      {COUNTRY_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="Bank Code"
                    name="bank_code"
                    value={bankingDraft.bank_code}
                    onChange={handleBankingDraftChange}
                    placeholder="Routing, sort, or branch code"
                  // required
                  />
                  <Input
                    label="New Account Number"
                    name="account_number"
                    value={bankingDraft.account_number}
                    onChange={handleBankingDraftChange}
                    placeholder="Enter new account number"
                  // required
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
                  // required
                  />
                  <Input
                    label="SWIFT / BIC"
                    name="swift_code"
                    value={bankingDraft.swift_code}
                    onChange={handleBankingDraftChange}
                    placeholder="Optional — required for international wires"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={updateBanking.isPending}
                    size="lg"
                  >
                    {updateBanking.isPending ? (
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
                    disabled={updateBanking.isPending}
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
