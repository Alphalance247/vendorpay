import { useState } from 'react';

function Toggle({ checked, onChange }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative w-[38px] h-[22px] rounded-full shrink-0 transition-colors duration-150 ${checked ? 'bg-[#1F6F54]' : 'bg-gray-300'
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
    'w-full text-[14px] text-gray-900 bg-white border border-gray-200 rounded-md pl-7 pr-3.5 py-2.5 outline-none focus:border-[#1F6F54] focus:ring-2 focus:ring-[#E7F1EC] transition-colors';

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
            <h1 className="text-xl sm:text-[20px] font-semibold text-gray-900 mb-1">
                Payout limits
            </h1>
            <p className="text-[13.5px] text-gray-500 mb-6">
                Guardrails on how much can move, and when approval is required.
            </p>

            <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
                    <div>
                        <label className="block text-[13px] font-medium text-gray-900 mb-1.5">
                            Single payout limit
                        </label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-gray-500">
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
                        <label className="block text-[13px] font-medium text-gray-900 mb-1.5">
                            Daily payout limit
                        </label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-gray-500">
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
                    <p className="text-[12.5px] text-red-700 -mt-2 mb-5">{error}</p>
                )}

                <div className="flex items-start justify-between gap-4 pt-1">
                    <div>
                        <p className="text-[13.5px] font-medium text-gray-900">
                            Require second approval above limit
                        </p>
                        <p className="text-[12.5px] text-gray-500 mt-0.5">
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