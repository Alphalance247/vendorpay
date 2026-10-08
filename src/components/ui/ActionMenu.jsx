import { useState, useEffect, useRef } from "react";
import { MoreVertical } from "lucide-react";

const MENU_WIDTH = 192;

// Kebab-button dropdown for per-row table actions. The menu is positioned
// `fixed` from the trigger's rect so it isn't clipped by the table's
// overflow-x-auto wrapper.
export default function ActionMenu({ items, label = "Actions" }) {
  const [pos, setPos] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const open = pos !== null;

  useEffect(() => {
    if (!open) return;
    const close = () => setPos(null);
    function handleMouseDown(e) {
      if (
        !menuRef.current?.contains(e.target) &&
        !triggerRef.current?.contains(e.target)
      ) {
        close();
      }
    }
    function handleKey(e) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  function toggle(e) {
    e.stopPropagation();
    if (open) {
      setPos(null);
      return;
    }
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      left: Math.max(8, rect.right - MENU_WIDTH),
    });
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        title={label}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className="p-1.5 rounded hover:bg-surface-container transition-colors"
      >
        <MoreVertical size={16} className="text-on-surface-variant" />
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          style={{ top: pos.top, left: pos.left, width: MENU_WIDTH }}
          className="fixed z-50 bg-white rounded-md shadow-dropdown border border-outline-variant overflow-hidden py-1"
          onClick={(e) => e.stopPropagation()}
        >
          {items.map(({ label: itemLabel, icon: Icon, onClick, danger, disabled, loading }) => (
            <button
              key={itemLabel}
              type="button"
              role="menuitem"
              disabled={disabled}
              onClick={() => {
                setPos(null);
                onClick();
              }}
              className={`w-full flex items-center gap-2.5 px-4 py-2 text-xs text-left transition-colors disabled:opacity-50 ${danger
                ? "text-error hover:bg-error/5"
                : "text-on-surface hover:bg-surface-container"
                }`}
            >
              {Icon && (
                <Icon size={14} className={loading ? "animate-spin" : ""} />
              )}
              {itemLabel}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
