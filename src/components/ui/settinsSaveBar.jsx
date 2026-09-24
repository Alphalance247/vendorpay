// import { useSettingsStore } from '@/store/settingsStore';

export default function SaveBar() {
    // const isDirty = useSettingsStore((s) => s.isDirty);
    // const isSaving = useSettingsStore((s) => s.isSaving);
    // const save = useSettingsStore((s) => s.save);
    // const clearDirty = useSettingsStore((s) => s.clearDirty);

    return (
        <div
            className={`fixed left-1/2 bottom-5 -translate-x-1/2 z-50 flex items-center gap-3.5 bg-gray-900 text-white rounded-xl pl-4.5 pr-3.5 py-3 shadow-2xl transition-all duration-200`}
        //  ${isDirty
        // ? 'translate-y-0 opacity-100'
        // : 'translate-y-[140%] opacity-0 pointer-events-none'
        // }

        >
            <span className="text-[13px]">You have unsaved changes</span>
            <div className="flex gap-2">
                <button
                    // onClick={clearDirty}
                    // disabled={isSaving}
                    className="text-[13px] font-medium text-white border border-white/25 rounded-md px-3.5 py-1.5 hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                    Discard
                </button>
                <button
                    // onClick={save}
                    // disabled={isSaving}
                    className="text-[13px] font-medium text-white bg-[#1F6F54] rounded-md px-3.5 py-1.5 hover:opacity-85 transition-opacity disabled:opacity-50"
                >
                    save  {/* {isSaving ? 'Saving…' : 'Save changes'} */}
                </button>
            </div>
        </div>
    );
}