import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  MATERIAL_FAMILIES,
  MATERIALS,
  familyOf,
  searchMaterials,
} from "@/lib/materials";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/catalog")({ component: CatalogPage });

export function CatalogPage() {
  const [q, setQ] = useState("");
  const [family, setFamily] = useState<string>("All");

  const results = useMemo(() => {
    const searched = q.trim() ? searchMaterials(q, 80) : MATERIALS;
    if (family === "All") return searched;
    return searched.filter((m) => familyOf(m) === family);
  }, [q, family]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-4xl font-semibold tracking-tight">2025 Material catalog</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        {MATERIALS.length} line items across {MATERIAL_FAMILIES.length} families. Selecting a
        material on a transfer fills its five-digit code automatically.
      </p>

      <div className="relative mt-6">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Try “100# DS plates”, “compromise 100/115”, “#3 ballast”…"
          className="pl-10"
        />
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {["All", ...MATERIAL_FAMILIES].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFamily(f)}
            className={cn(
              "h-9 shrink-0 rounded-full border px-3 text-xs font-semibold",
              family === f
                ? "border-primary bg-primary/15 text-fg"
                : "border-border text-muted hover:text-fg",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <ul className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
        {results.slice(0, 120).map((m) => (
          <li key={m.id} className="flex items-start gap-3 px-4 py-3">
            <span className="w-14 shrink-0 font-mono text-[13px] font-semibold text-primary">
              {m.code || "MISC"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm text-fg">{m.name}</span>
              {m.name !== m.category ? (
                <span className="block text-[11px] text-muted">{m.category}</span>
              ) : null}
            </span>
            <span className="shrink-0 text-[11px] font-medium text-muted">{m.unit}</span>
          </li>
        ))}
      </ul>
      {results.length > 120 ? (
        <p className="mt-3 text-center text-xs text-muted">
          Showing 120 of {results.length}. Narrow the search to see the rest.
        </p>
      ) : (
        <p className="mt-3 text-center text-xs text-muted">{results.length} matches</p>
      )}
    </div>
  );
}
