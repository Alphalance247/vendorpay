import { PhoneInput as InternationalPhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { cn } from "../../lib/utils";

// Phone field with a country picker, styled to match <Input />. The library
// ships its own sizes and colours, so the overrides below use `!` to win over
// its stylesheet. onChange receives an input-like event
// ({ target: { name, value } }) so it works with the same change handlers as
// <Input />; the value is in E.164 format, e.g. "+2348012345678".
export default function PhoneInput({
  label,
  name,
  value,
  onChange,
  error,
  hint,
  required,
  disabled,
  country,
  placeholder,
}) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
          {label}
          {required && <span className="text-error"> *</span>}
        </label>
      )}
      <InternationalPhoneInput
        // Remount when the starting country changes, since defaultCountry is
        // only read on mount
        key={country || "none"}
        defaultCountry={country}
        value={value || ""}
        onChange={(phone) => onChange?.({ target: { name, value: phone } })}
        name={name}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        // One border and focus ring around the flag button and the number,
        // so the field reads as a single input like <Input />
        className={cn(
          "!w-full rounded border bg-white transition-colors focus-within:ring-2",
          error
            ? "border-error focus-within:ring-error focus-within:border-error"
            : "border-outline focus-within:ring-primary focus-within:border-primary",
          disabled && "opacity-60 cursor-not-allowed",
        )}
        inputClassName="!flex-1 !h-auto !border-0 !rounded-r !bg-transparent !px-3 !py-2 !text-sm !leading-5 !text-on-surface placeholder:!text-outline focus:!outline-none focus:!ring-0"
        countrySelectorStyleProps={{
          buttonClassName:
            "!h-full !rounded-l !border-0 !border-r !border-outline-variant !bg-transparent !px-2 hover:!bg-surface-container",
          dropdownStyleProps: {
            className: "!rounded !shadow-lg !text-sm !text-on-surface",
          },
        }}
      />
      {error && <p className="text-xs text-error">{error}</p>}
      {hint && !error && (
        <p className="text-xs text-on-surface-variant">{hint}</p>
      )}
    </div>
  );
}
