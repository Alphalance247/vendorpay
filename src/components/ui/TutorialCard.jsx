import { useState } from 'react';
import { Lightbulb, X, ChevronDown, ChevronUp } from 'lucide-react';

export default function TutorialCard({ id, title, description, tips = [] }) {
  const storageKey = `tutorial_dismissed_${id}`;
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(storageKey) === 'true');
  const [collapsed, setCollapsed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="rounded-lg border border-amber/30 bg-amber/5 px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-amber/15 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Lightbulb size={15} className="text-amber" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-on-surface">{title}</p>
            <span className="text-xs font-medium text-amber bg-amber/10 px-2 py-0.5 rounded-full">Guide</span>
          </div>

          {!collapsed && (
            <>
              {description && (
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{description}</p>
              )}
              {tips.length > 0 && (
                <ul className="mt-2.5 space-y-1.5">
                  {tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-on-surface-variant">
                      <span className="text-amber font-bold leading-4 flex-shrink-0">›</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={() => setCollapsed(c => !c)}
            className="p-1 rounded hover:bg-amber/10 transition-colors text-on-surface-variant"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
          <button
            onClick={() => { localStorage.setItem(storageKey, 'true'); setDismissed(true); }}
            className="p-1 rounded hover:bg-amber/10 transition-colors text-on-surface-variant"
            title="Dismiss guide"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
