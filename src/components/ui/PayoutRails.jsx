import { useState } from "react";
import Input from "./Input";

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-[38px] h-[22px] rounded-full shrink-0 transition-colors duration-150 ${
        checked ? "bg-primary" : "bg-outline"
      }`}
    >
      <span
        className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-all duration-150 ${
          checked ? "left-[19px]" : "left-[3px]"
        }`}
      />
    </button>
  );
}

// TODO: source this from your existing COUNTRY_PROFILES / .rail config
// (BankingStep) rather than a separate hardcoded list — this is the same
// data your onboarding wizard already knows about.
const RAILS = [
  { country: "Nigeria", rail: "NIP", code: "NG" },
  { country: "United Kingdom", rail: "Faster Payments", code: "GB" },
  { country: "United States", rail: "ACH", code: "US" },
  { country: "Kenya", rail: "EFT / RTGS", code: "KE" },
  { country: "Canada", rail: "EFT", code: "CA" },
  { country: "South Africa", rail: "EFT", code: "ZA" },
  { country: "Other Africa", rail: "SWIFT", code: "AF_OTHERS" },
  { country: "European Union", rail: "SEPA", code: "EU" },
  { country: "Others", rail: "SWIFT", code: "OTHERS" },
];

// function maskAccountNumber(value) {
// Reuse the masking utility already in ReviewSubmit.jsx instead of
// duplicating it here — shown inline only as a fallback.
//     if (!value || value.length < 4) return value;
//     return `••••${value.slice(-4)}`;
// }

export default function BankingSection() {
  const [accountName, setAccountName] = useState("Alluvium Technologies Ltd");
  const [accountNumber] = useState("••••4821"); // already masked server-side
  const [enabledRails, setEnabledRails] = useState({
    NG: true,
    GB: true,
    US: false,
    KE: true,
    ZA: false,
    CA: true,
    AF_OTHERS: false,
    EU: true,
    OTHERS: false,
  });

  const handleToggleRail = (code, next) => {
    if (!next) {
      // TODO: if vendors are actively using this rail, confirm before
      // disabling — this is a live payment path, not a cosmetic setting.
      // e.g. if (railHasActiveVendors(code)) { openConfirmModal(); return; }
    }
    setEnabledRails((prev) => ({ ...prev, [code]: next }));
    // TODO: markDirty(`rail.${code}`, next) — wire to settings store
  };

  return (
    <div className="w-full lg:w-[500px] xl:w-[700px] ">
      <h1 className="font-headline-lg text-xl sm:text-[20px] font-semibold text-on-surface mb-1">
        Banking &amp; payout rails
      </h1>
      <p className="text-[13.5px] text-on-surface-variant mb-6">
        Where funds settle, and which rails are available to vendors by country.
      </p>

      {/* Settlement account */}
      <div className="bg-white border border-outline-variant rounded-xl p-5 sm:p-6 mb-5">
        <h2 className="text-[15px] font-semibold text-on-surface mb-4">
          Settlement account
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            {/* <label className="block text-[13px] font-medium text-on-surface mb-1.5">
                            Account name
                        </label> */}
            <Input
              label="  Account name"
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
            />
          </div>
          <div>
            {/* <label className="block text-[13px] font-medium text-on-surface mb-1.5">
              Account number
            </label> */}
            {/* Read-only + masked: changing a settlement account should be
                its own re-verification flow, not an inline edit. */}
            <Input
              label="Account number"
              type="text"
              value={accountNumber}
              readOnly
              className={` cursor-not-allowed`}
            />
          </div>
        </div>
      </div>

      {/* Enabled payout rails by country */}
      <div className="bg-white border border-outline-variant rounded-xl p-5 sm:p-6">
        <h2 className="text-[15px] font-semibold text-on-surface mb-2">
          Enabled payout rails by country
        </h2>
        {RAILS.map(({ country, rail, code }) => (
          <div
            key={code}
            className="flex items-center justify-between py-3 border-b border-outline-variant last:border-b-0 gap-4"
          >
            <span className="text-[13.5px] text-on-surface">
              {country} — {rail}
            </span>
            <Toggle
              checked={enabledRails[code]}
              onChange={(next) => handleToggleRail(code, next)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
