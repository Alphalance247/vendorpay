import { Bell, Settings, Search } from 'lucide-react';

export default function TopBar({ searchPlaceholder = 'Search invoices, payments, or vendors...' }) {
  return (
    <header className="h-14 bg-white border-b border-outline-variant flex items-center px-6 gap-4">
      <div className="flex-1 relative max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          className="w-full pl-9 pr-3 py-1.5 text-sm bg-surface-low rounded border border-outline-variant focus:outline-none focus:ring-2 focus:ring-emerald focus:border-emerald placeholder:text-outline"
        />
      </div>
      <div className="flex items-center gap-2 ml-auto">
        <button className="p-2 rounded hover:bg-surface-container text-on-surface-variant relative transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-error rounded-full" />
        </button>
        <button className="p-2 rounded hover:bg-surface-container text-on-surface-variant transition-colors">
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
