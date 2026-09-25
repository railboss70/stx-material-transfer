import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { materialById, searchMaterials } from "@/lib/materials";
import { useTransferStore } from "@/lib/store";
import type { Material } from "@/lib/types";
import { cn } from "@/lib/utils";

const MAX_LIST_PX = 288; // max-h-72
const MIN_LIST_PX = 140;
const BOTTOM_BAR_PX = 84; // fixed Download PDF / Email bar in the transfer form
const HEADER_PX = 76; // sticky app header

interface Props {
  value: string;
  code: string;
  onSelect: (m: Material) => void;
  onChangeDetails: (details: string) => void;
  autoFocus?: boolean;
}

export function MaterialPicker({ value, code, onSelect, onChangeDetails, autoFocus }: Props) {
  const recents = useTransferStore((s) => s.recentMaterialIds);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [placement, setPlacement] = useState({ up: false, maxHeight: MAX_LIST_PX });
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const results = useMemo(() => {
    const q = value.trim();
    if (q.length >= 1) return searchMaterials(q, 10);
    return recents
      .map((id) => materialById(id))
      .filter((m): m is Material => Boolean(m))
      .slice(0, 6);
  }, [value, recents]);

  useEffect(() => {
    setActive(0);
  }, [value, open]);

  // Open upward when the fixed PDF/Email bar would cover the list below the field.
  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const input = rootRef.current?.querySelector("input");
      if (!input) return;
      const rect = input.getBoundingClientRect();
      const viewH = window.visualViewport?.height ?? window.innerHeight;
      const below = viewH - rect.bottom - BOTTOM_BAR_PX;
      const above = rect.top - HEADER_PX;
      const up = below < MAX_LIST_PX && above > below;
      setPlacement({
        up,
        maxHeight: Math.max(MIN_LIST_PX, Math.min(MAX_LIST_PX, up ? above : below)),
      });
    }
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    window.visualViewport?.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
      window.visualViewport?.removeEventListener("resize", place);
    };
  }, [open]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function choose(m: Material) {
    onSelect(m);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative" data-item-code={code || undefined}>
      <input
        value={value}
        autoFocus={autoFocus}
        autoComplete="off"
        spellCheck={false}
        placeholder="Start typing material — plates, 100RE bars, ballast…"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          onChangeDetails(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
            setOpen(true);
            return;
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && open && results[active]) {
            e.preventDefault();
            choose(results[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className="flex h-11 w-full rounded-md border border-border bg-surface-2 px-3 text-sm text-fg placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:border-primary/60"
      />
      {open && results.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          style={{ maxHeight: placement.maxHeight }}
          className={cn(
            "absolute z-50 w-full overflow-auto rounded-lg border border-border bg-surface py-1 shadow-xl",
            placement.up ? "bottom-full mb-1" : "top-full mt-1",
          )}
        >
          {value.trim().length < 1 ? (
            <li className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Recent
            </li>
          ) : null}
          {results.map((m, i) => {
            const same = m.name === m.category;
            return (
              <li key={m.id} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(m);
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    "flex w-full items-start gap-3 px-3 py-2.5 text-left",
                    i === active ? "bg-primary/15" : "hover:bg-surface-2",
                  )}
                >
                  <span className="mt-0.5 min-w-12 font-mono text-[12px] font-semibold text-primary">
                    {m.code || "MISC"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-fg">{m.name}</span>
                    {!same ? (
                      <span className="block truncate text-[11px] text-muted">{m.category}</span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 shrink-0 text-[11px] font-medium text-muted">{m.unit}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
