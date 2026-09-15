import { useEffect, useId, useMemo, useRef, useState } from "react";
import { materialById, searchMaterials } from "@/lib/materials";
import { useTransferStore } from "@/lib/store";
import type { Material } from "@/lib/types";
import { cn } from "@/lib/utils";

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
          className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-border bg-surface py-1 shadow-xl"
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
