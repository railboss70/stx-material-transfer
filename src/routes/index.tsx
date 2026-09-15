import { Link, useNavigate } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, FileDown, Mail, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { downloadTransferPdf, shareOrEmailTransfer } from "@/lib/pdf";
import { useTransferStore } from "@/lib/store";
import { documentNo, transferFilename, type Transfer } from "@/lib/types";
import { formatShortDate } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

export function Home() {
  const transfers = useTransferStore((s) => s.transfers);
  const remove = useTransferStore((s) => s.remove);
  const duplicate = useTransferStore((s) => s.duplicate);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return transfers;
    return transfers.filter((t) => {
      const hay = [
        t.from.jobName,
        t.from.jobNumber,
        t.to.jobName,
        t.to.jobNumber,
        t.direction,
        t.carrierName,
        documentNo(t),
        ...t.items.map((i) => `${i.code} ${i.details}`),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(n);
    });
  }, [transfers, q]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
            STX Railroad Construction Services
          </p>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Transfers</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Build an inventory transfer, auto-fill 2025 material codes, and send the PDF to{" "}
            <a
              className="text-primary underline-offset-2 hover:underline"
              href="mailto:materials@stxrailroad.com"
            >
              materials@stxrailroad.com
            </a>
            .
          </p>
        </div>
        <Button asChild>
          <Link to="/new">
            <Plus /> New transfer
          </Link>
        </Button>
      </div>

      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search jobs, codes, materials…"
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center">
          <p className="font-display text-2xl font-semibold">No transfers yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Start a bill of lading. Typing a material name fills the item code from the 2025
            catalog.
          </p>
          <Button className="mt-6" asChild>
            <Link to="/new">
              <Plus /> Create transfer
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="grid gap-3">
          {filtered.map((t) => (
            <TransferCard
              key={t.id}
              transfer={t}
              onOpen={() => navigate({ to: "/t/$id", params: { id: t.id } })}
              onDuplicate={() => {
                const copy = duplicate(t.id);
                if (copy) {
                  toast.success("Duplicated as a new draft");
                  navigate({ to: "/t/$id", params: { id: copy.id } });
                }
              }}
              onDelete={() => {
                if (confirm(`Delete transfer ${documentNo(t) || ""}?`)) {
                  remove(t.id);
                  toast.success("Deleted");
                }
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function TransferCard({
  transfer: t,
  onOpen,
  onDuplicate,
  onDelete,
}: {
  transfer: Transfer;
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const count = t.items.filter((i) => i.code || i.details).length;
  return (
    <li className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button type="button" onClick={onOpen} className="min-w-0 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={t.direction === "IN" ? "in" : "out"}>{t.direction}</Badge>
            <span className="font-mono text-sm text-primary">{documentNo(t) || "Draft"}</span>
            <span className="text-xs text-muted">{formatShortDate(t.pickUpDate)}</span>
          </div>
          <p className="mt-2 font-display text-xl font-semibold tracking-tight">
            {t.from.jobName || t.from.jobNumber || "Origin"}
            <span className="px-2 text-muted">→</span>
            {t.to.jobName || t.to.jobNumber || "Destination"}
          </p>
          <p className="mt-1 text-xs text-muted">
            {count} item{count === 1 ? "" : "s"}
            {t.carrierName ? ` · ${t.carrierName}` : ""}
            {t.status === "draft" ? " · Draft" : " · Issued"}
          </p>
          <p className="mt-1 hidden font-mono text-[11px] text-muted sm:block">
            {transferFilename(t)}
          </p>
        </button>
        <div className="flex flex-wrap gap-1.5">
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Download PDF"
            onClick={async () => {
              try {
                await downloadTransferPdf(t);
                toast.success("PDF downloaded");
              } catch {
                toast.error("Could not build PDF");
              }
            }}
          >
            <FileDown />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Email PDF"
            onClick={async () => {
              try {
                await shareOrEmailTransfer(t);
              } catch {
                toast.error("Could not email");
              }
            }}
          >
            <Mail />
          </Button>
          <Button size="icon-sm" variant="ghost" aria-label="Duplicate" onClick={onDuplicate}>
            <Copy />
          </Button>
          <Button size="icon-sm" variant="ghost" aria-label="Delete" onClick={onDelete}>
            <Trash2 />
          </Button>
        </div>
      </div>
    </li>
  );
}
