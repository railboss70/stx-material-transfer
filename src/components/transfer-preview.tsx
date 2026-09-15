import { documentNo, transferFilename, type Transfer } from "@/lib/types";
import { formatShortDate, qtyDisplay } from "@/lib/utils";

export function TransferPreview({ transfer: t }: { transfer: Transfer }) {
  const items = t.items.filter((i) => i.code || i.details || i.qty);
  const rows = [...items];
  while (rows.length < 10) {
    rows.push({
      id: `empty-${rows.length}`,
      materialId: "",
      code: "",
      details: "",
      qty: "",
      unit: "",
      weight: "",
    });
  }

  return (
    <article className="bol-sheet mx-auto w-full max-w-[816px] bg-white text-[#161a20] shadow-2xl">
      <header className="flex items-start justify-between gap-4 border-b border-[#d5dbe3] px-6 pb-3 pt-5">
        <img src="/stx-logo.png" alt="STX Corporation" className="h-14 w-auto object-contain" />
        <div className="min-w-0 text-right">
          <h2 className="font-display text-[22px] font-semibold leading-tight tracking-tight">
            Inventory Transfer and Bill of Lading
          </h2>
          <p className="mt-2 text-[13px]">
            Document No:{" "}
            <span className="font-semibold text-[#1b4f9c]">{documentNo(t) || "————"}</span>
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 border-b border-[#8b929c] text-[12px]">
        <section className="border-r border-[#8b929c]">
          <h3 className="bg-[#e6ebf2] px-3 py-1.5 text-center text-[11px] font-bold">
            Material Transferred From:
          </h3>
          <PartyRow label="Company:" value={t.from.company} />
          <PartyRow label="Job Name:" value={t.from.jobName} />
          <PartyRow label="Job Number:" value={t.from.jobNumber} />
          <PartyRow label="Address:" value={t.from.address} last />
        </section>
        <section>
          <h3 className="bg-[#e6ebf2] px-3 py-1.5 text-center text-[11px] font-bold">
            Material Transferred To:
          </h3>
          <PartyRow label="Company:" value={t.to.company} />
          <PartyRow label="Job Name:" value={t.to.jobName} />
          <PartyRow label="Job Number:" value={t.to.jobNumber} />
          <PartyRow label="Address:" value={t.to.address} last />
        </section>
      </div>

      <div className="space-y-2 border-b border-[#d5dbe3] px-6 py-3 text-[12px]">
        <MetaRow label="Carrier:" value={t.carrier} />
        <MetaRow label="BOL #:" value={t.bol} />
        <MetaRow label="Special Instructions:" value={t.specialInstructions} />
      </div>

      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="bg-[#e6ebf2] text-[11px] font-bold">
            <th className="w-[88px] border border-[#8b929c] px-2 py-1.5">Item Code</th>
            <th className="border border-[#8b929c] px-2 py-1.5">Details</th>
            <th className="w-[110px] border border-[#8b929c] px-2 py-1.5">QTY</th>
            <th className="w-[90px] border border-[#8b929c] px-2 py-1.5">Weight</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="h-8">
              <td className="border border-[#c5ccd4] px-2 text-center font-semibold text-[#1b4f9c]">
                {row.code}
              </td>
              <td className="border border-[#c5ccd4] px-2">{row.details}</td>
              <td className="border border-[#c5ccd4] px-2 text-center">
                {qtyDisplay(row.qty, row.unit)}
              </td>
              <td className="border border-[#c5ccd4] px-2 text-center">{row.weight}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <footer className="space-y-4 px-6 py-5 text-[12px]">
        <SignRow
          role="Carrier:"
          dateLabel="Pick Up Date"
          date={formatShortDate(t.pickUpDate)}
          name={t.carrierName}
        />
        <SignRow
          role="Shipper:"
          dateLabel="Pick Up Date"
          date=""
          name={t.shipperName}
        />
        <div>
          <p>
            <span className="font-bold">Receiver:</span> All goods received in
            satisfactory order and accounted for:
          </p>
          <div className="mt-3 grid grid-cols-2 gap-6">
            <div>
              <div className="h-6 border-b border-[#8b929c] font-semibold">{t.receiverName}</div>
              <p className="pt-1 text-[10px] text-[#5c6570]">Print Name</p>
            </div>
            <div>
              <div className="h-6 border-b border-[#8b929c]" />
              <p className="pt-1 text-[10px] text-[#5c6570]">Signature</p>
            </div>
          </div>
          <div className="mt-3 max-w-[180px]">
            <div className="h-6 border-b border-[#8b929c]">{formatShortDate(t.dateReceived)}</div>
            <p className="pt-1 text-[10px] text-[#5c6570]">Date Received</p>
          </div>
        </div>
        <p className="pt-2 text-[10px] italic text-[#5c6570]">
          {t.direction === "IN" ? "INBOUND" : "OUTBOUND"} ·{" "}
          {transferFilename(t).replace(/\.pdf$/i, "")}
        </p>
      </footer>
    </article>
  );
}

function PartyRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex min-h-7 items-baseline gap-2 px-3 py-1 ${last ? "" : "border-b border-[#d5dbe3]"}`}
    >
      <span className="w-[88px] shrink-0 font-bold">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="w-[140px] shrink-0 font-bold">{label}</span>
      <span className="min-h-4 flex-1 border-b border-[#8b929c]">{value}</span>
    </div>
  );
}

function SignRow({
  role,
  dateLabel,
  date,
  name,
}: {
  role: string;
  dateLabel: string;
  date: string;
  name: string;
}) {
  return (
    <div className="grid grid-cols-[auto_1fr_1.4fr] items-end gap-4">
      <span className="font-bold">{role}</span>
      <div>
        <div className="h-6 border-b border-[#8b929c]">{date}</div>
        <p className="pt-1 text-[10px] text-[#5c6570]">{dateLabel}</p>
      </div>
      <div>
        <div className="h-6 border-b border-[#8b929c] font-semibold">{name}</div>
        <p className="pt-1 text-[10px] text-[#5c6570]">Signature</p>
      </div>
    </div>
  );
}
