export type Direction = "IN" | "OUT";

export type TransferStatus = "draft" | "issued";

export interface JobParty {
  company: string;
  jobName: string;
  jobNumber: string;
  address: string;
}

export interface SavedJob extends JobParty {
  id: string;
}

export interface LineItem {
  id: string;
  materialId: string;
  code: string;
  details: string;
  qty: string;
  unit: string;
  weight: string;
}

export interface Transfer {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: TransferStatus;
  direction: Direction;
  pickUpDate: string;
  from: JobParty;
  to: JobParty;
  carrier: string;
  bol: string;
  specialInstructions: string;
  items: LineItem[];
  carrierName: string;
  shipperName: string;
  receiverName: string;
  dateReceived: string;
}

export interface Material {
  id: string;
  code: string;
  category: string;
  name: string;
  unit: string;
}

export function emptyParty(): JobParty {
  return { company: "STX", jobName: "", jobNumber: "", address: "" };
}

export function documentNo(t: Pick<Transfer, "from" | "to">) {
  const a = t.from.jobNumber.trim();
  const b = t.to.jobNumber.trim();
  if (a && b) return `${a}-${b}`;
  if (a) return a;
  if (b) return b;
  return "";
}

/** True once the user has typed something beyond the blank-form defaults. */
export function hasContent(t: Transfer) {
  const party = (p: JobParty) => [p.jobName, p.jobNumber, p.address];
  return [
    ...party(t.from),
    ...party(t.to),
    t.bol,
    t.specialInstructions,
    t.carrierName,
    t.shipperName,
    t.receiverName,
    ...t.items.flatMap((i) => [i.code, i.details, i.qty, i.weight]),
  ].some((v) => v.trim() !== "");
}

export function transferFilename(t: Transfer) {
  const date = yymmddSafe(t.pickUpDate);
  const from = t.from.jobNumber.trim() || "00000";
  const to = t.to.jobNumber.trim() || "00000";
  return `${date}- ${from} to ${to} ${t.direction} STX Material Transfer.pdf`;
}

function yymmddSafe(iso: string) {
  const compact = (iso || "").replaceAll("-", "");
  if (compact.length === 8) return compact.slice(2);
  return compact || "000000";
}

export function emailSubject(t: Transfer) {
  const doc = documentNo(t) || "Material Transfer";
  return `STX Material Transfer ${doc} ${t.direction} — ${t.from.jobName || t.from.jobNumber} to ${t.to.jobName || t.to.jobNumber}`;
}

export function emailBody(t: Transfer) {
  const lines = t.items
    .filter((i) => i.code || i.details)
    .map((i) => {
      const qty = i.qty.trim();
      const q = qty
        ? /[a-zA-Z]/.test(qty)
          ? qty
          : `${qty}${i.unit ? ` ${i.unit}` : ""}`
        : "";
      return `  ${i.code.padEnd(6)}  ${(i.details || "").trim()}${q ? `  —  ${q}` : ""}`;
    });
  return [
    `Inventory Transfer and Bill of Lading`,
    `Document: ${documentNo(t) || "—"}`,
    `Direction: ${t.direction}`,
    `Pickup: ${t.pickUpDate}`,
    ``,
    `From: ${t.from.company}  ${t.from.jobName}  (${t.from.jobNumber})`,
    `To:   ${t.to.company}  ${t.to.jobName}  (${t.to.jobNumber})`,
    t.carrier ? `Carrier: ${t.carrier}` : "",
    t.bol ? `BOL #: ${t.bol}` : "",
    t.specialInstructions ? `Instructions: ${t.specialInstructions}` : "",
    ``,
    `Items:`,
    ...(lines.length ? lines : ["  (none)"]),
    ``,
    `The PDF is downloaded to this device — attach it to this email before sending.`,
    ``,
    `— STX Railroad Construction Services`,
  ]
    .filter((row) => row !== "")
    .join("\n");
}
