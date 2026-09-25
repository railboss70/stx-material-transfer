import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  Eye,
  FileDown,
  Mail,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { JobPicker } from "@/components/job-picker";
import { MaterialPicker } from "@/components/material-picker";
import { TransferPreview } from "@/components/transfer-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { downloadTransferPdf, shareOrEmailTransfer } from "@/lib/pdf";
import { blankItem, useTransferStore } from "@/lib/store";
import {
  documentNo,
  hasContent,
  transferFilename,
  type Direction,
  type LineItem,
  type Material,
  type Transfer,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export function TransferForm({ initial }: { initial: Transfer }) {
  const navigate = useNavigate();
  const upsert = useTransferStore((s) => s.upsert);
  const rememberJob = useTransferStore((s) => s.rememberJob);
  const rememberMaterial = useTransferStore((s) => s.rememberMaterial);
  const [t, setT] = useState<Transfer>(initial);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState<"pdf" | "email" | null>(null);
  const [autosavedAt, setAutosavedAt] = useState<Date | null>(null);
  const latest = useRef(t);
  const lastSaved = useRef(t);
  latest.current = t;

  // Autosave so a phone call or app switch never loses a half-filled form.
  const flush = useCallback(() => {
    const cur = latest.current;
    if (cur === lastSaved.current || !hasContent(cur)) return;
    lastSaved.current = cur;
    upsert(cur);
    setAutosavedAt(new Date());
  }, [upsert]);

  useEffect(() => {
    if (t === lastSaved.current) return;
    const timer = setTimeout(flush, 600);
    return () => clearTimeout(timer);
  }, [t, flush]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [flush]);

  function patch(partial: Partial<Transfer>) {
    setT((prev) => ({ ...prev, ...partial }));
  }

  function setItem(id: string, next: Partial<LineItem>) {
    setT((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === id ? { ...i, ...next } : i)),
    }));
  }

  function onMaterial(itemId: string, m: Material) {
    rememberMaterial(m.id);
    setItem(itemId, {
      materialId: m.id,
      code: m.code,
      details: m.name,
      unit: m.unit,
    });
  }

  function save(status: Transfer["status"] = t.status) {
    const next = { ...t, status };
    lastSaved.current = next;
    upsert(next);
    rememberJob(next.from);
    rememberJob(next.to);
    setT(next);
    toast.success(status === "issued" ? "Transfer issued" : "Draft saved");
    return next;
  }

  async function onPdf() {
    const next = save("issued");
    setBusy("pdf");
    try {
      const name = await downloadTransferPdf(next);
      toast.success(`Downloaded ${name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not build PDF");
    } finally {
      setBusy(null);
    }
  }

  async function onEmail() {
    const next = save("issued");
    setBusy("email");
    try {
      const result = await shareOrEmailTransfer(next);
      if (result === "shared") toast.success("Share sheet opened");
      else if (result === "mailed")
        toast.success("PDF downloaded — attach it to the email for materials@stxrailroad.com");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not email");
    } finally {
      setBusy(null);
    }
  }

  const doc = documentNo(t);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-28 pt-4 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="text-xs font-medium text-muted hover:text-fg"
          >
            All transfers
          </button>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-fg">
            {doc ? `Transfer ${doc}` : "New transfer"}
          </h1>
          <p className="mt-1 font-mono text-[12px] text-muted">
            {transferFilename(t)}
          </p>
          {autosavedAt ? (
            <p className="mt-1 text-xs text-muted">
              Saved on this phone ·{" "}
              {autosavedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setPreview(true)}>
            <Eye /> Preview
          </Button>
          <Button variant="secondary" size="sm" onClick={() => save("draft")}>
            <Save /> Save draft
          </Button>
        </div>
      </div>

      <section className="mb-6 rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <DirectionToggle
            value={t.direction}
            onChange={(direction) => patch({ direction })}
          />
          <label className="grid gap-1.5">
            <Label>Pick up date</Label>
            <Input
              type="date"
              value={t.pickUpDate}
              onChange={(e) => patch({ pickUpDate: e.target.value })}
              className="w-[11.5rem]"
            />
          </label>
        </div>
      </section>

      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-start">
        <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-fg">Transferred from</h2>
            <Badge variant="out">Origin</Badge>
          </div>
          <JobPicker party={t.from} onChange={(from) => patch({ from })} />
        </section>
        <div className="flex justify-center lg:pt-16">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Swap origin and destination"
            onClick={() => patch({ from: t.to, to: t.from })}
          >
            <ArrowLeftRight />
          </Button>
        </div>
        <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-fg">Transferred to</h2>
            <Badge variant="in">Destination</Badge>
          </div>
          <JobPicker party={t.to} onChange={(to) => patch({ to })} />
        </section>
      </div>

      <section className="mb-6 rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <Label>Carrier</Label>
            <Input value={t.carrier} onChange={(e) => patch({ carrier: e.target.value })} />
          </label>
          <label className="grid gap-1.5">
            <Label>BOL #</Label>
            <Input value={t.bol} onChange={(e) => patch({ bol: e.target.value })} />
          </label>
        </div>
        <label className="mt-4 grid gap-1.5">
          <Label>Special instructions</Label>
          <Textarea
            rows={2}
            value={t.specialInstructions}
            onChange={(e) => patch({ specialInstructions: e.target.value })}
          />
        </label>
      </section>

      <section className="mb-6 rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-fg">Line items</h2>
            <p className="text-xs text-muted">
              Type a name or code — the catalog fills the item code automatically. Browse the{" "}
              <Link to="/catalog" className="text-primary underline-offset-2 hover:underline">
                full 2025 list
              </Link>
              .
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => patch({ items: [...t.items, blankItem()] })}
          >
            <Plus /> Add item
          </Button>
        </div>
        <div className="grid gap-3">
          {t.items.map((item, index) => (
            <article
              key={item.id}
              className="rounded-xl border border-border bg-bg/40 p-3 sm:p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                  Item {index + 1}
                </span>
                <button
                  type="button"
                  className="text-muted hover:text-out"
                  aria-label="Remove item"
                  onClick={() =>
                    patch({
                      items:
                        t.items.length > 1
                          ? t.items.filter((i) => i.id !== item.id)
                          : [blankItem()],
                    })
                  }
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-[7rem_1fr]">
                <label className="grid gap-1.5">
                  <Label>Code</Label>
                  <Input
                    value={item.code}
                    readOnly
                    placeholder="—"
                    className="font-mono tracking-wide text-primary"
                  />
                </label>
                <label className="grid gap-1.5">
                  <Label>Material</Label>
                  <MaterialPicker
                    value={item.details}
                    code={item.code}
                    onChangeDetails={(details) => setItem(item.id, { details })}
                    onSelect={(m) => onMaterial(item.id, m)}
                  />
                </label>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <label className="grid gap-1.5">
                  <Label>Qty</Label>
                  <Input
                    value={item.qty}
                    placeholder="1750"
                    onChange={(e) => setItem(item.id, { qty: e.target.value })}
                  />
                </label>
                <label className="grid gap-1.5">
                  <Label>Unit</Label>
                  <Input
                    value={item.unit}
                    placeholder="EA"
                    onChange={(e) => setItem(item.id, { unit: e.target.value })}
                  />
                </label>
                <label className="grid gap-1.5">
                  <Label>Weight</Label>
                  <Input
                    value={item.weight}
                    placeholder="Optional"
                    onChange={(e) => setItem(item.id, { weight: e.target.value })}
                  />
                </label>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-6 rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="mb-3 text-sm font-semibold text-fg">Signatures</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <Label>Carrier / driver</Label>
            <Input
              value={t.carrierName}
              placeholder="Caleb Riechman"
              onChange={(e) => patch({ carrierName: e.target.value })}
            />
          </label>
          <label className="grid gap-1.5">
            <Label>Shipper</Label>
            <Input
              value={t.shipperName}
              onChange={(e) => patch({ shipperName: e.target.value })}
            />
          </label>
          <label className="grid gap-1.5">
            <Label>Receiver (print name)</Label>
            <Input
              value={t.receiverName}
              onChange={(e) => patch({ receiverName: e.target.value })}
            />
          </label>
          <label className="grid gap-1.5">
            <Label>Date received</Label>
            <Input
              type="date"
              value={t.dateReceived}
              onChange={(e) => patch({ dateReceived: e.target.value })}
            />
          </label>
        </div>
      </section>

      {!preview ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 p-3 backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-5xl gap-2">
            <Button className="flex-1" onClick={onPdf} disabled={busy !== null}>
              <FileDown /> {busy === "pdf" ? "Building…" : "Download PDF"}
            </Button>
            <Button
              className="flex-1"
              variant="paper"
              onClick={onEmail}
              disabled={busy !== null}
            >
              <Mail /> {busy === "email" ? "Opening…" : "Email materials"}
            </Button>
          </div>
        </div>
      ) : null}

      {preview ? (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-bg/95"
          role="dialog"
          aria-modal="true"
          aria-label="Bill of lading preview"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border bg-surface px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <p className="text-sm font-medium">Bill of lading preview</p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={onPdf}>
                <FileDown /> PDF
              </Button>
              <Button size="sm" variant="outline" onClick={() => setPreview(false)}>
                Close
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto bg-[#3a4149] p-4 sm:p-8">
            <TransferPreview transfer={t} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DirectionToggle({
  value,
  onChange,
}: {
  value: Direction;
  onChange: (d: Direction) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-border bg-surface-2 p-1">
      {(["OUT", "IN"] as const).map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => onChange(d)}
          className={cn(
            "h-10 min-w-20 rounded-full px-5 text-sm font-semibold tracking-wide transition-colors",
            value === d
              ? d === "OUT"
                ? "bg-out text-primary-fg"
                : "bg-in text-primary-fg"
              : "text-muted hover:text-fg",
          )}
        >
          {d}
        </button>
      ))}
    </div>
  );
}
