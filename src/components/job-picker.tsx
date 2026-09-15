import { useEffect, useMemo, useRef, useState } from "react";
import { useTransferStore } from "@/lib/store";
import type { JobParty, SavedJob } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  party: JobParty;
  onChange: (next: JobParty) => void;
}

export function JobPicker({ party, onChange }: Props) {
  const jobs = useTransferStore((s) => s.jobs);
  const [openField, setOpenField] = useState<"name" | "number" | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpenField(null);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const matches = useMemo(() => {
    if (!openField) return [];
    const q = (openField === "name" ? party.jobName : party.jobNumber).trim().toLowerCase();
    return jobs
      .filter((j) => {
        if (!q) return true;
        return (
          j.jobName.toLowerCase().includes(q) ||
          j.jobNumber.toLowerCase().includes(q)
        );
      })
      .slice(0, 8);
  }, [jobs, openField, party.jobName, party.jobNumber]);

  function apply(j: SavedJob) {
    onChange({
      company: j.company || party.company || "STX",
      jobName: j.jobName,
      jobNumber: j.jobNumber,
      address: j.address || party.address,
    });
    setOpenField(null);
  }

  return (
    <div ref={rootRef} className="grid gap-3">
      <Field
        label="Company"
        value={party.company}
        onChange={(v) => onChange({ ...party, company: v })}
      />
      <div className="relative">
        <Field
          label="Job name"
          value={party.jobName}
          placeholder="AMPACET, Palmetto Yard…"
          onFocus={() => setOpenField("name")}
          onChange={(v) => {
            onChange({ ...party, jobName: v });
            setOpenField("name");
          }}
        />
        {openField === "name" && matches.length > 0 ? (
          <JobMenu jobs={matches} onPick={apply} />
        ) : null}
      </div>
      <div className="relative">
        <Field
          label="Job number"
          value={party.jobNumber}
          placeholder="25139"
          inputMode="numeric"
          onFocus={() => setOpenField("number")}
          onChange={(v) => {
            onChange({ ...party, jobNumber: v });
            setOpenField("number");
          }}
        />
        {openField === "number" && matches.length > 0 ? (
          <JobMenu jobs={matches} onPick={apply} />
        ) : null}
      </div>
      <Field
        label="Address"
        value={party.address}
        placeholder="Optional"
        onChange={(v) => onChange({ ...party, address: v })}
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  onFocus,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  inputMode?: "numeric" | "text";
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
      <input
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        onFocus={onFocus}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-11 w-full rounded-md border border-border bg-surface-2 px-3 text-sm text-fg placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
      />
    </label>
  );
}

function JobMenu({ jobs, onPick }: { jobs: SavedJob[]; onPick: (j: SavedJob) => void }) {
  return (
    <ul className="absolute z-40 mt-1 w-full overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-xl">
      {jobs.map((j) => (
        <li key={j.id}>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onPick(j);
            }}
            className={cn(
              "flex w-full items-baseline justify-between gap-3 px-3 py-2.5 text-left hover:bg-surface-2",
            )}
          >
            <span className="truncate text-sm text-fg">{j.jobName || "Untitled job"}</span>
            <span className="font-mono text-[12px] text-primary">{j.jobNumber}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
