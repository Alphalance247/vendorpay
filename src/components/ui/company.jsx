import { useEffect, useState } from "react";
import { CheckCircle, ImagePlus } from "lucide-react";
import Input from "./Input";
import Select from "./Select";
import { adminService } from "../../lib/services/adminService";
import { resolveMediaUrl } from "../../lib/apiClient";


const industry_type = [
  { value: "Technology", label: "Technology" },
  { value: "Manufacturing", label: "Manufacturing" },
  { value: 'Logistics', label: "Logistics" },
  { value: " Retail", label: "Retail" },
  { value: "Professional Services", label: "Professional Services" },
  { value: "Healthcare", label: "Healthcare" },
  { value: "Other", label: "Other" },
]
const COMPANY_SIZES = [
  "1-10 employees",
  "11-50 employees",
  "51-200 employees",
  "201-500 employees",
  "500+ employees",
];
const MAX_LOGO_SIZE = 5 * 1024 * 1024; // 2MB
const ALLOWED_LOGO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg"
];
export default function VendorCompany() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false)
  const [resetKey, setResetKey] = useState(0);

  const [form, setForm] = useState({
    logo_url: "",
    industry: "",
    company_size: "",
    name: "",
    plan: "",
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoError, setLogoError] = useState("");
  // Re-runs whenever resetKey changes (see handleCancel), re-fetching the
  // last-saved company data to discard any unsaved edits.
  useEffect(() => {
    const loadCompany = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await adminService.getCompany();

        console.log("COMPANY DATA:", data);

        setForm({
          name: data?.name ?? "",
          logo_url: data?.logo_url ?? "",
          industry: data?.industry ?? "",
          plan: data?.plan ?? "",
          company_size: data?.company_size ?? "",
        });
      } catch (error) {
        console.error("FAILED TO LOAD COMPANY:", error);

        setError("Failed to load company profile.");
      } finally {
        setLoading(false);
      }
    };

    loadCompany();
  }, [resetKey]);
  // Revoke the previous object URL whenever it's replaced or the component unmounts.
  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  const handleChange = (field) => (e) => {
    const { value } = e.target;
    setForm((prev) => ({ ...prev, [field]: value }));
    // markDirty(field, value);
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];

    // Allow the same file to be selected again
    e.target.value = "";

    if (!file) return;

    // Validate file type
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setLogoError(
        "Please upload a JPG, PNG, or WebP image."
      );
      return;
    }

    // Validate file size
    if (file.size > MAX_LOGO_SIZE) {
      setLogoError(
        "Image must be smaller than 2MB."
      );
      return;
    }

    setLogoError("");
    setError("");
    setSaved(false);

    // Create a local preview immediately
    const previewUrl = URL.createObjectURL(file);

    setLogoPreview(previewUrl);

    try {
      setLoading(true);

      const response =
        await adminService.uploadCompanyLogo(file);

      console.log(
        "COMPANY LOGO UPLOAD RESPONSE:",
        response
      );

      /*
       * The API documentation says:
       * "Returns the new logo URL."
       *
       * Depending on the actual response format, it could
       * be logo_url, url, or simply a string.
       */

      let uploadedLogo = "";

      if (typeof response === "string") {
        uploadedLogo = response;
      } else {
        uploadedLogo =
          response?.logo_url ||
          response?.url ||
          response?.logo ||
          "";
      }

      console.log(
        "UPLOADED LOGO URL:",
        uploadedLogo
      );

      /*
       * Only save the backend URL if we actually received one.
       *
       * The local preview remains active, so even if the
       * backend returns a bad URL, the page won't suddenly
       * lose the selected image.
       */
      if (uploadedLogo) {
        setForm((prev) => ({
          ...prev,
          logo_url: uploadedLogo,
        }));
      }

      setSaved(true);
    } catch (error) {
      console.error(
        "COMPANY LOGO UPLOAD ERROR:",
        error
      );

      console.error(
        "STATUS:",
        error?.response?.status
      );

      console.error(
        "RESPONSE:",
        error?.response?.data
      );

      setLogoError(
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "Failed to upload company logo."
      );

      // Remove preview only when the actual upload failed
      setLogoPreview(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoRemove = () => {
    setLogoError("");
    setLogoPreview(null);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name?.trim()) {
      setError("Company name is required.");
      return;
    }

    setLoading(true);
    setError("");
    setSaved(false);

    try {
      const payload = {
        name: form.name.trim(),
        industry: form.industry,
        company_size: form.company_size,
      };

      const updated =
        await adminService.updateCompany(payload);

      console.log("UPDATED COMPANY:", updated);

      setForm((prev) => ({
        ...prev,
        name: updated?.name ?? prev.name,
        logo_url:
          updated?.logo_url ?? prev.logo_url,
        industry:
          updated?.industry ?? prev.industry,
        plan:
          updated?.plan ?? prev.plan,
        company_size:
          updated?.company_size ?? prev.company_size,
      }));

      setLogoPreview(null);
      setSaved(true);
    } catch (error) {
      console.error(
        "UPDATE COMPANY ERROR:",
        error
      );

      setError(
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "Failed to update company details."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setError("");
    setSaved(false);
    setLogoPreview(null);
    setLogoError("");
    setResetKey((prev) => prev + 1);
  };
  return (
    <div className="w-full lg:w-[500px] xl:w-[700px] py-6 sm:py-10 pb-24">
      <h1 className="text-xl sm:text-[20px] font-semibold text-gray-900 mb-1">
        Company
      </h1>
      <p className="text-[13.5px] text-gray-500 mb-6">
        Your business details, shown on invoices and used for verification.
      </p>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
          {error}
        </div>
      )}

      {saved && (
        <div className="mb-4 p-3 bg-emerald/10 border border-emerald/30 rounded text-emerald text-sm flex items-center gap-2">
          <CheckCircle size={15} /> Profile updated successfully.
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 space-y-5"
      >
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
            Company Logo
          </label>

          <div className="flex items-center gap-4">
            {/* Logo preview */}
            <div className="w-16 h-16 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
              {logoPreview || form.logo_url ? (
                <img
                  src={
                    logoPreview ||
                    resolveMediaUrl(form.logo_url)
                  }
                  alt="Company logo preview"
                  className="w-full h-full object-cover"
                  onLoad={() => {
                    console.log(
                      "COMPANY LOGO LOADED:",
                      logoPreview ||
                      resolveMediaUrl(form.logo_url)
                    );
                  }}
                  onError={(e) => {
                    console.error(
                      "COMPANY LOGO FAILED:",
                      e.currentTarget.src
                    );
                  }}
                />
              ) : (
                <ImagePlus className="w-5 h-5 text-gray-400" />
              )}
            </div>

            {/* Upload controls */}
            <div className="flex items-center gap-3">
              <label className="cursor-pointer px-3.5 py-2 rounded-lg border border-gray-200 bg-white text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                {logoPreview || form.logo_url
                  ? "Change"
                  : "Upload"}

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </label>

              {logoPreview && (
                <button
                  type="button"
                  onClick={handleLogoRemove}
                  className="text-[13px] font-medium text-red-600 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <p className="text-[12px] text-gray-500 mt-1.5">
            PNG, JPG, WEBP. Max 5MB.
          </p>

          {logoError && (
            <p className="text-[12px] text-red-600 mt-1">
              {logoError}
            </p>
          )}
        </div>

        {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-5"> */}
        <Input
          label="company name"
          type="text"
          placeholder="Enter company name"
          value={form.name}
          onChange={handleChange("name")}
        />
        <Select
          label="Industry Type"
          value={form.industry}
          onChange={handleChange("industry")}
        >
          {industry_type.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>

        <Select
          label="company size"
          value={form.company_size}
          onChange={handleChange("company_size")}
        >
          {COMPANY_SIZES.map((c, index) =>
            <option key={index} value={c}>
              {c}
            </option>)}
        </Select>
        <div className="flex flex-col md:flex-row md:justify-end gap-4">
          <button
            type="button"
            onClick={handleCancel}
            className="w-full sm:w-auto px-4 py-2 rounded-xl border border-on-primary-fixed-variant text-sm font-semibold text-on-surface hover:bg-surface-low transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-on-primary-fixed-variant text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {loading ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>

      {/* <SaveBar /> */}
    </div>
  );
}

/*
  import { useState } from "react";
import { X } from "lucide-react";

const COUNTRY_PROFILES = {
  US: {
    label: "United States",
    currency: "USD",
    rail: "ACH",
    bankPlaceholder: "e.g. Chase, Wells Fargo",
    fields: [
      {
        name: "routingNumber",
        label: "Routing Number",
        placeholder: "000000000",
        hint: "9-digit ABA routing number",
      },
      {
        name: "accountNumber",
        label: "Account Number",
        placeholder: "Enter account number",
      },
    ],
    accountTypes: ["Checking", "Savings"],
  },

  GB: {
    label: "United Kingdom",
    currency: "GBP",
    rail: "Faster Payments",
    bankPlaceholder: "e.g. Barclays, HSBC",
    fields: [
      {
        name: "sortCode",
        label: "Sort Code",
        placeholder: "00-00-00",
        hint: "6-digit UK sort code",
      },
      {
        name: "accountNumber",
        label: "Account Number",
        placeholder: "8-digit account number",
      },
    ],
    accountTypes: ["Current", "Savings"],
  },

  NG: {
    label: "Nigeria",
    currency: "NGN",
    rail: "NIP",
    bankPlaceholder: "e.g. GTBank, Access Bank",
    fields: [
      {
        name: "accountNumber",
        label: "Account Number",
        placeholder: "10-digit NUBAN",
        hint: "10-digit NUBAN account number",
      },
      {
        name: "swiftCode",
        label: "SWIFT / BIC",
        placeholder: "e.g. GTBINGLA",
        hint: "Required for international wires",
      },
    ],
    accountTypes: ["Current", "Savings", "Domiciliary"],
  },

  KE: {
    label: "Kenya",
    currency: "KES",
    rail: "EFT / RTGS",
    bankPlaceholder: "e.g. Equity Bank, KCB",
    fields: [
      {
        name: "accountNumber",
        label: "Account Number",
        placeholder: "Enter account number",
      },
      {
        name: "branchCode",
        label: "Branch Code",
        placeholder: "e.g. 68000",
        hint: "Bank branch identifier",
      },
      {
        name: "swiftCode",
        label: "SWIFT / BIC",
        placeholder: "e.g. EQBLKENA",
      },
    ],
    accountTypes: ["Current", "Savings"],
  },

  ZA: {
    label: "South Africa",
    currency: "ZAR",
    rail: "EFT",
    bankPlaceholder: "e.g. Standard Bank, FNB",
    fields: [
      {
        name: "accountNumber",
        label: "Account Number",
        placeholder: "Enter account number",
      },
      {
        name: "branchCode",
        label: "Branch Code",
        placeholder: "e.g. 250655",
        hint: "Universal branch code",
      },
    ],
    accountTypes: ["Cheque", "Savings", "Transmission"],
  },

  CA: {
    label: "Canada",
    currency: "CAD",
    rail: "EFT",
    bankPlaceholder: "e.g. RBC, TD",
    fields: [
      {
        name: "transitNumber",
        label: "Transit Number",
        placeholder: "00000",
        hint: "5-digit branch transit",
      },
      {
        name: "institutionNumber",
        label: "Institution Number",
        placeholder: "000",
        hint: "3-digit bank ID",
      },
      {
        name: "accountNumber",
        label: "Account Number",
        placeholder: "Enter account number",
      },
    ],
    accountTypes: ["Chequing", "Savings"],
  },

  AF_OTHER: {
    label: "Other African Country",
    currency: "USD",
    rail: "SWIFT",
    bankPlaceholder: "Local bank name",
    fields: [
      {
        name: "accountNumber",
        label: "Account Number",
        placeholder: "Enter account number",
      },
      {
        name: "swiftCode",
        label: "SWIFT / BIC",
        placeholder: "e.g. XXXXXXXX",
        hint: "Required for international wires",
      },
    ],
    accountTypes: ["Current", "Savings"],
  },

  EU: {
    label: "Eurozone (SEPA)",
    currency: "EUR",
    rail: "SEPA",
    bankPlaceholder: "e.g. Deutsche Bank, BNP Paribas",
    fields: [
      {
        name: "iban",
        label: "IBAN",
        placeholder: "DE89 3704 0044 0532 0130 00",
        hint: "International Bank Account Number",
      },
      {
        name: "swiftCode",
        label: "SWIFT / BIC",
        placeholder: "e.g. DEUTDEFF",
      },
    ],
    accountTypes: ["Current", "Savings"],
  },

  OTHER: {
    label: "Other / International Wire",
    currency: "USD",
    rail: "SWIFT",
    bankPlaceholder: "Local bank name",
    fields: [
      {
        name: "iban",
        label: "IBAN / Account Number",
        placeholder: "Enter IBAN or account number",
      },
      {
        name: "swiftCode",
        label: "SWIFT / BIC",
        placeholder: "e.g. XXXXXXXX",
        hint: "Required for international wires",
      },
    ],
    accountTypes: ["Current", "Savings"],
  },
};

function Input({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full h-11 px-3.5 rounded-lg border border-gray-200 bg-white text-[13.5px] text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
      />
    </div>
  );
}

function Select({ label, name, value, onChange, children, required = false }) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <select
        name={name}
        value={value || ""}
        onChange={onChange}
        className="w-full h-11 px-3.5 rounded-lg border border-gray-200 bg-white text-[13.5px] text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
      >
        {children}
      </select>
    </div>
  );
}

function getInitialForm(account) {
  return {
    bankName: account?.bankName || "",
    country: account?.countryCode || "",
    currency: account?.currency || "",
    paymentRail: account?.paymentRail || "",
    accountType: account?.accountType || "Checking",
    accountNumber: account?.accountNumber || "",
    confirmAccountNumber: account?.accountNumber || "",
    routingNumber: account?.routingNumber || "",
    sortCode: account?.sortCode || "",
    transitNumber: account?.transitNumber || "",
    isDefault: account?.isDefault || false,
  };
}

function PayoutAccountModal({ mode, account, onClose, onSave }) {
  const isEdit = mode === "edit";

  const [form, setForm] = useState(() => getInitialForm(account));

  const [error, setError] = useState("");

  const selectedCountry = COUNTRY_PROFILES[form.country];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => {
      const next = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "country") {
        const profile = COUNTRY_PROFILES[value];

        next.currency = profile?.currency || "";
        next.paymentRail = profile?.paymentRail || "";

        next.accountNumber = "";
        next.confirmAccountNumber = "";
        next.routingNumber = "";
        next.sortCode = "";
        next.transitNumber = "";
      }

      return next;
    });

    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.bankName.trim()) {
      setError("Please enter the bank name.");
      return;
    }

    if (!form.country) {
      setError("Please select a country.");
      return;
    }

    if (!form.accountNumber.trim()) {
      setError("Please enter the account number.");
      return;
    }

    if (form.accountNumber !== form.confirmAccountNumber) {
      setError("Account numbers do not match.");
      return;
    }

    if (selectedCountry?.fields.includes("routingNumber")) {
      if (!form.routingNumber.trim()) {
        setError("Please enter the routing number.");
        return;
      }
    }

    if (selectedCountry?.fields.includes("sortCode")) {
      if (!form.sortCode.trim()) {
        setError("Please enter the sort code.");
        return;
      }
    }

    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
     
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Modal */
// }
// <div className="relative w-full sm:max-w-[560px] max-h-[92vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl">
{
  /* Header */
}
//         <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-5 sm:px-6 py-4 flex items-center justify-between">
//           <div>
//             <h2 className="text-[16px] font-semibold text-gray-900">
//               {isEdit ? "Edit payout account" : "Add payout account"}
//             </h2>

//             <p className="text-[12.5px] text-gray-500 mt-0.5">
//               {isEdit
//                 ? "Update the details for this payout account."
//                 : "Add a bank account where you receive payments."}
//             </p>
//           </div>

//           <button
//             type="button"
//             onClick={onClose}
//             className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition"
//           >
//             <X size={18} />
//           </button>
//         </div>

//         <form onSubmit={handleSubmit}>
//           <div className="px-5 sm:px-6 py-5 space-y-5">
//             {/* Error */}
//             {error && (
//               <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] text-red-700">
//                 {error}
//               </div>
//             )}

//             <div>
//               <h3 className="text-[13.5px] font-semibold text-gray-900 mb-3">
//                 Bank information
//               </h3>

//               <div className="space-y-4">
//                 <Input
//                   label="Bank name"
//                   name="bankName"
//                   value={form.bankName}
//                   onChange={handleChange}
//                   placeholder="e.g. GTBank"
//                   required
//                 />

//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                   <Select
//                     label="Country"
//                     name="country"
//                     value={form.country}
//                     onChange={handleChange}
//                     required
//                   >
//                     <option value="">Select country</option>

//                     {Object.entries(COUNTRY_PROFILES).map(([code, profile]) => (
//                       <option key={code} value={code}>
//                         {profile.country}
//                       </option>
//                     ))}
//                   </Select>

//                   <Input
//                     label="Currency"
//                     name="currency"
//                     value={form.currency}
//                     placeholder="Auto-filled"
//                     onChange={() => {}}
//                   />
//                 </div>

//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                   <Input
//                     label="Payment rail"
//                     name="paymentRail"
//                     value={form.paymentRail}
//                     placeholder="Auto-filled"
//                     onChange={() => {}}
//                   />

//                   {form.country === "US" && (
//                     <Select
//                       label="Account type"
//                       name="accountType"
//                       value={form.accountType}
//                       onChange={handleChange}
//                     >
//                       <option value="Checking">Checking</option>
//                       <option value="Savings">Savings</option>
//                     </Select>
//                   )}
//                 </div>
//               </div>
//             </div>

//             {/* Account details */}
//             {selectedCountry && (
//               <div className="border-t border-gray-100 pt-5">
//                 <h3 className="text-[13.5px] font-semibold text-gray-900 mb-3">
//                   Account details
//                 </h3>

//                 <div className="space-y-4">
//                   {selectedCountry.fields.includes("routingNumber") && (
//                     <Input
//                       label="Routing number"
//                       name="routingNumber"
//                       value={form.routingNumber}
//                       onChange={handleChange}
//                       placeholder="Enter routing number"
//                       required
//                     />
//                   )}

//                   {selectedCountry.fields.includes("sortCode") && (
//                     <Input
//                       label="Sort code"
//                       name="sortCode"
//                       value={form.sortCode}
//                       onChange={handleChange}
//                       placeholder="e.g. 20-00-00"
//                       required
//                     />
//                   )}

//                   {selectedCountry.fields.includes("transitNumber") && (
//                     <Input
//                       label="Transit number"
//                       name="transitNumber"
//                       value={form.transitNumber}
//                       onChange={handleChange}
//                       placeholder="Enter transit number"
//                       required
//                     />
//                   )}

//                   <Input
//                     label="Account number"
//                     name="accountNumber"
//                     value={form.accountNumber}
//                     onChange={handleChange}
//                     placeholder="Enter account number"
//                     required
//                   />

//                   <Input
//                     label="Confirm account number"
//                     name="confirmAccountNumber"
//                     value={form.confirmAccountNumber}
//                     onChange={handleChange}
//                     placeholder="Re-enter account number"
//                     required
//                   />
//                 </div>
//               </div>
//             )}

//             <div className="border-t border-gray-100 pt-5">
//               <label className="flex items-start gap-3 cursor-pointer">
//                 <input
//                   type="checkbox"
//                   name="isDefault"
//                   checked={form.isDefault}
//                   onChange={handleChange}
//                   className="mt-0.5 w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-300"
//                 />

//                 <div>
//                   <p className="text-[13.5px] font-medium text-gray-900">
//                     Make this my default payout account
//                   </p>

//                   <p className="text-[12px] text-gray-500 mt-0.5">
//                     Future payments will be sent to this account.
//                   </p>
//                 </div>
//               </label>
//             </div>
//           </div>

//           <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 sm:px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
//             <button
//               type="button"
//               onClick={onClose}
//               className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-gray-200 text-[13.5px] font-medium text-gray-700 hover:bg-gray-50 transition"
//             >
//               Cancel
//             </button>

//             <button
//               type="submit"
//               className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-gray-900 text-white text-[13.5px] font-medium hover:bg-gray-800 transition"
//             >
//               {isEdit ? "Save changes" : "Add account"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// function AccountCard({ account, onEdit, onSetDefault, onRemove }) {
//   return (
//     <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 mb-4">
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
//         <span className="text-[13.5px] font-medium text-gray-900">
//           {account.bankName} — {account.masked}
//         </span>

//         {account.isDefault && (
//           <span className="self-start sm:self-auto text-[11.5px] font-medium bg-[#E7F1EC] text-[#1F6F54] rounded-full px-2.5 py-1 w-fit">
//             Default
//           </span>
//         )}
//       </div>

//       <p className="text-[12.5px] text-gray-500 mb-3">
//         {account.country} · {account.currency} · Added {account.addedDate}
//       </p>

//       {account.isDefault ? (
//         <button
//           onClick={() => onEdit(account.id)}
//           className="w-full sm:w-auto text-[13.5px] font-medium text-gray-900 bg-white border border-gray-200 rounded-md px-4 py-2 hover:bg-gray-50 transition-colors"
//         >
//           Edit
//         </button>
//       ) : (
//         <div className="flex gap-4">
//           <button
//             onClick={() => onSetDefault(account.id)}
//             className="text-[13px] font-medium text-[#1F6F54] hover:underline"
//           >
//             Set as default
//           </button>

//           <button
//             onClick={() => onRemove(account.id)}
//             className="text-[13px] font-medium text-red-700 hover:underline"
//           >
//             Remove
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }

// export default function VendorPayout() {
//   const [accounts, setAccounts] = useState([
//     {
//       id: 1,
//       bankName: "GTBank",
//       masked: "••••4821",
//       country: "Nigeria",
//       countryCode: "NG",
//       currency: "NGN",
//       paymentRail: "NIP",
//       accountNumber: "0123454821",
//       addedDate: "Mar 2026",
//       isDefault: true,
//     },
//     {
//       id: 2,
//       bankName: "Wise",
//       masked: "••••1190",
//       country: "United Kingdom",
//       countryCode: "GB",
//       currency: "GBP",
//       paymentRail: "Faster Payments",
//       accountNumber: "1234561190",
//       sortCode: "20-00-00",
//       addedDate: "Jul 2026",
//       isDefault: false,
//     },
//   ]);

//   const [modal, setModal] = useState(null);
//   const [selectedAccount, setSelectedAccount] = useState(null);

//   const handleAddAccount = () => {
//     setSelectedAccount(null);
//     setModal("add");
//   };

//   const handleEdit = (id) => {
//     const account = accounts.find((item) => item.id === id);

//     if (!account) return;

//     setSelectedAccount(account);
//     setModal("edit");
//   };

//   const handleCloseModal = () => {
//     setModal(null);
//     setSelectedAccount(null);
//   };

//   const handleSaveAccount = (form) => {
//     const profile = COUNTRY_PROFILES[form.country];

//     if (modal === "add") {
//       const newAccount = {
//         id: Date.now(),
//         bankName: form.bankName,
//         masked: `••••${form.accountNumber.slice(-4)}`,
//         country: profile.country,
//         countryCode: form.country,
//         currency: profile.currency,
//         paymentRail: profile.paymentRail,
//         accountNumber: form.accountNumber,
//         routingNumber: form.routingNumber,
//         sortCode: form.sortCode,
//         transitNumber: form.transitNumber,
//         accountType: form.accountType,
//         addedDate: "Sep 2026",
//         isDefault: form.isDefault,
//       };

//       setAccounts((prev) => {
//         let next = [...prev, newAccount];

//         if (form.isDefault) {
//           next = next.map((account) => ({
//             ...account,
//             isDefault: account.id === newAccount.id,
//           }));
//         }

//         return next;
//       });
//     } else {
//       setAccounts((prev) =>
//         prev.map((account) => {
//           if (account.id !== selectedAccount.id) {
//             return form.isDefault ? { ...account, isDefault: false } : account;
//           }

//           return {
//             ...account,
//             bankName: form.bankName,
//             masked: `••••${form.accountNumber.slice(-4)}`,
//             country: profile.country,
//             countryCode: form.country,
//             currency: profile.currency,
//             paymentRail: profile.paymentRail,
//             accountNumber: form.accountNumber,
//             routingNumber: form.routingNumber,
//             sortCode: form.sortCode,
//             transitNumber: form.transitNumber,
//             accountType: form.accountType,
//             isDefault: form.isDefault,
//           };
//         }),
//       );
//     }

//     handleCloseModal();
//   };

//   const handleSetDefault = (id) => {
//     setAccounts((prev) =>
//       prev.map((account) => ({
//         ...account,
//         isDefault: account.id === id,
//       })),
//     );
//   };

//   const handleRemove = (id) => {
//     const confirmed = window.confirm(
//       "Are you sure you want to remove this payout account?",
//     );

//     if (!confirmed) return;

//     setAccounts((prev) => prev.filter((account) => account.id !== id));
//   };

//   return (
//     <>
//       <div className="w-full lg:w-[500px] xl:w-[700px] px-4 sm:px-0 py-6 sm:py-10">
//         <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
//           <div>
//             <h1 className="text-xl sm:text-[20px] font-semibold text-gray-900 mb-1">
//               Payout accounts
//             </h1>

//             <p className="text-[13.5px] text-gray-500">
//               Where you receive payments from businesses on VendorPay.
//             </p>
//           </div>

//           <button
//             onClick={handleAddAccount}
//             className="shrink-0 text-[13.5px] font-medium text-white bg-gray-900 rounded-md px-4 py-2.5 hover:opacity-85 transition-opacity w-full sm:w-auto"
//           >
//             Add account
//           </button>
//         </div>

//         {accounts.map((account) => (
//           <AccountCard
//             key={account.id}
//             account={account}
//             onEdit={handleEdit}
//             onSetDefault={handleSetDefault}
//             onRemove={handleRemove}
//           />
//         ))}
//       </div>

//       {modal && (
//         <PayoutAccountModal
//           key={`${modal}-${selectedAccount?.id || "new"}`}
//           mode={modal}
//           account={selectedAccount}
//           onClose={handleCloseModal}
//           onSave={handleSaveAccount}
//         />
//       )}
//     </>
//   );
// }
// }
