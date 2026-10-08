import { useState } from 'react';

function Toggle({ checked, onChange }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative w-[38px] h-[22px] rounded-full shrink-0 transition-colors duration-150 ${checked ? 'bg-primary' : 'bg-outline'
                }`}
        >
            <span
                className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-all duration-150 ${checked ? 'left-[19px]' : 'left-[3px]'
                    }`}
            />
        </button>
    );
}

const inputClasses =
    'w-full text-[14px] text-on-surface bg-white border border-outline-variant rounded-md pl-7 pr-3.5 py-2.5 outline-none focus:border-secondary focus:ring-2 focus:ring-secondary-fixed transition-colors';

// TODO: derive from the company's settlement currency (Banking tab)
// instead of hardcoding $ — a Nigeria-settled account shouldn't show USD.
const CURRENCY_SYMBOL = '$';

function formatNumber(value) {
    const digits = value.replace(/[^\d]/g, '');
    if (!digits) return '';
    return Number(digits).toLocaleString('en-US');
}

export default function PayoutLimit() {
    const [singleLimit, setSingleLimit] = useState('25,000');
    const [dailyLimit, setDailyLimit] = useState('100,000');
    const [requireApproval, setRequireApproval] = useState(true);
    const [error, setError] = useState('');

    const validate = (nextSingle, nextDaily) => {
        const s = Number(nextSingle.replace(/,/g, '')) || 0;
        const d = Number(nextDaily.replace(/,/g, '')) || 0;
        if (s > d) {
            setError('Single payout limit can\u2019t be greater than the daily limit.');
        } else {
            setError('');
        }
    };

    const handleSingleChange = (e) => {
        const formatted = formatNumber(e.target.value);
        setSingleLimit(formatted);
        validate(formatted, dailyLimit);
        // TODO: markDirty('singlePayoutLimit', formatted)
    };

    const handleDailyChange = (e) => {
        const formatted = formatNumber(e.target.value);
        setDailyLimit(formatted);
        validate(singleLimit, formatted);
        // TODO: markDirty('dailyPayoutLimit', formatted)
    };

    return (
        <div className="w-full lg:w-[500px] xl:w-[700px] px-4 sm:px-0 py-6 sm:py-10">
            <h1 className="font-headline-lg text-xl sm:text-[20px] font-semibold text-on-surface mb-1">
                Payout limits
            </h1>
            <p className="text-[13.5px] text-on-surface-variant mb-6">
                Guardrails on how much can move, and when approval is required.
            </p>

            <div className="bg-white border border-outline-variant rounded-xl p-5 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
                    <div>
                        <label className="block text-[13px] font-medium text-on-surface mb-1.5">
                            Single payout limit
                        </label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-on-surface-variant">
                                {CURRENCY_SYMBOL}
                            </span>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={singleLimit}
                                onChange={handleSingleChange}
                                className={inputClasses}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[13px] font-medium text-on-surface mb-1.5">
                            Daily payout limit
                        </label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-on-surface-variant">
                                {CURRENCY_SYMBOL}
                            </span>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={dailyLimit}
                                onChange={handleDailyChange}
                                className={inputClasses}
                            />
                        </div>
                    </div>
                </div>

                {error && (
                    <p className="text-[12.5px] text-error -mt-2 mb-5">{error}</p>
                )}

                <div className="flex items-start justify-between gap-4 pt-1">
                    <div>
                        <p className="text-[13.5px] font-medium text-on-surface">
                            Require second approval above limit
                        </p>
                        <p className="text-[12.5px] text-on-surface-variant mt-0.5">
                            A second admin must approve before funds move
                        </p>
                    </div>
                    <Toggle
                        checked={requireApproval}
                        onChange={(next) => {
                            setRequireApproval(next);
                            // TODO: markDirty('requireSecondApproval', next)
                        }}
                    />
                </div>
            </div>
        </div>
    );
}