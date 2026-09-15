import { jsPDF } from "jspdf";
import {
  documentNo,
  emailBody,
  transferFilename,
  type LineItem,
  type Transfer,
} from "@/lib/types";
import { formatShortDate, publicUrl, qtyDisplay } from "@/lib/utils";

const PAGE_W = 215.9;
const PAGE_H = 279.4;
const MARGIN = 12.5;
const STX_BLUE: [number, number, number] = [27, 79, 156];
const INK: [number, number, number] = [22, 26, 32];
const RULE: [number, number, number] = [55, 62, 70];
const HEADER_FILL: [number, number, number] = [230, 235, 242];

let logoDataUrl: string | null = null;

async function loadLogo() {
  if (logoDataUrl) return logoDataUrl;
  try {
    const res = await fetch(publicUrl("stx-logo-full.png"));
    const blob = await res.blob();
    logoDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    logoDataUrl = "";
  }
  return logoDataUrl;
}

function line(doc: jsPDF, x1: number, y1: number, x2: number, y2: number) {
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.25);
  doc.line(x1, y1, x2, y2);
}

function fieldLine(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  w: number,
) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...INK);
  doc.text(label, x, y);
  const lw = doc.getTextWidth(label) + 1.6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(value || "", x + lw, y);
  line(doc, x + lw, y + 1.1, x + w, y + 1.1);
}

function wrap(doc: jsPDF, text: string, maxW: number) {
  if (!text) return [""];
  return doc.splitTextToSize(text, maxW) as string[];
}

function drawHeader(doc: jsPDF, t: Transfer, logo: string) {
  if (logo) {
    try {
      doc.addImage(logo, "PNG", MARGIN, 8, 58, 22);
    } catch {
      /* logo optional */
    }
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...INK);
  doc.text("Inventory Transfer and Bill of Lading", PAGE_W - MARGIN, 14, {
    align: "right",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Document No:", PAGE_W - MARGIN - 62, 22.5);
  line(doc, PAGE_W - MARGIN - 38, 23.2, PAGE_W - MARGIN, 23.2);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...STX_BLUE);
  doc.text(documentNo(t) || " ", PAGE_W - MARGIN - 37, 22.2);
  doc.setTextColor(...INK);
}

function drawPartyBox(doc: jsPDF, t: Transfer) {
  const y = 34;
  const h = 42;
  const mid = PAGE_W / 2;
  const left = MARGIN;
  const right = PAGE_W - MARGIN;
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.35);
  doc.setFillColor(...HEADER_FILL);
  doc.rect(left, y, mid - left, 7, "F");
  doc.rect(mid, y, right - mid, 7, "F");
  doc.rect(left, y, right - left, h);
  doc.line(mid, y, mid, y + h);
  doc.line(left, y + 7, right, y + 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text("Material Transferred From:", left + (mid - left) / 2, y + 4.8, {
    align: "center",
  });
  doc.text("Material Transferred To:", mid + (right - mid) / 2, y + 4.8, {
    align: "center",
  });

  const rows = [
    ["Company:", t.from.company, t.to.company],
    ["Job Name:", t.from.jobName, t.to.jobName],
    ["Job Number:", t.from.jobNumber, t.to.jobNumber],
    ["Address:", t.from.address, t.to.address],
  ] as const;

  let ry = y + 7;
  const rowH = (h - 7) / 4;
  for (let i = 0; i < rows.length; i++) {
    const [label, a, b] = rows[i];
    if (i < 3) doc.line(left, ry + rowH, right, ry + rowH);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(label, left + 1.8, ry + 5.4);
    doc.text(label, mid + 1.8, ry + 5.4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(a || "", left + 24, ry + 5.4);
    doc.text(b || "", mid + 24, ry + 5.4);
    ry += rowH;
  }
}

function drawMeta(doc: jsPDF, t: Transfer) {
  let y = 82;
  fieldLine(doc, "Carrier:", t.carrier, MARGIN, y, 110);
  y += 8;
  fieldLine(doc, "BOL #:", t.bol, MARGIN, y, PAGE_W - MARGIN * 2);
  y += 8;
  fieldLine(
    doc,
    "Special Instructions:",
    t.specialInstructions,
    MARGIN,
    y,
    PAGE_W - MARGIN * 2,
  );
  return y + 6;
}

function drawTable(doc: jsPDF, items: LineItem[], startY: number) {
  const cols = [
    { key: "code", label: "Item Code", x: MARGIN, w: 22 },
    { key: "details", label: "Details", x: MARGIN + 22, w: 118 },
    { key: "qty", label: "QTY", x: MARGIN + 140, w: 32 },
    {
      key: "weight",
      label: "Weight",
      x: MARGIN + 172,
      w: PAGE_W - MARGIN - (MARGIN + 172),
    },
  ];
  const tableW = PAGE_W - MARGIN * 2;
  const headerH = 8;
  const minRow = 7.2;
  const bottomLimit = 228;

  doc.setFillColor(...HEADER_FILL);
  doc.rect(MARGIN, startY, tableW, headerH, "F");
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.35);
  doc.rect(MARGIN, startY, tableW, headerH);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...INK);
  for (const c of cols) {
    doc.text(c.label, c.x + c.w / 2, startY + 5.3, { align: "center" });
    if (c.x !== MARGIN) doc.line(c.x, startY, c.x, startY + headerH);
  }

  const filled = items.filter((i) => i.code || i.details || i.qty);
  const rows: { item?: LineItem; h: number; lines: string[] }[] = [];
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  for (const item of filled) {
    const lines = wrap(doc, item.details || "", cols[1].w - 3);
    const h = Math.max(minRow, lines.length * 3.6 + 3.2);
    rows.push({ item, h, lines });
  }
  while (rows.length < 12) rows.push({ h: minRow, lines: [] });

  let y = startY + headerH;
  for (const row of rows) {
    if (y + row.h > bottomLimit) break;
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.25);
    doc.rect(MARGIN, y, tableW, row.h);
    for (const c of cols) {
      if (c.x !== MARGIN) doc.line(c.x, y, c.x, y + row.h);
    }
    if (row.item) {
      const it = row.item;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...STX_BLUE);
      if (it.code) {
        doc.text(it.code, cols[0].x + cols[0].w / 2, y + 4.8, { align: "center" });
      }
      doc.setTextColor(...INK);
      doc.setFont("helvetica", "normal");
      let ty = y + 4.8;
      for (const ln of row.lines) {
        doc.text(ln, cols[1].x + 1.6, ty);
        ty += 3.6;
      }
      const q = qtyDisplay(it.qty, it.unit);
      if (q) doc.text(q, cols[2].x + cols[2].w / 2, y + 4.8, { align: "center" });
      if (it.weight) {
        doc.text(it.weight, cols[3].x + cols[3].w / 2, y + 4.8, { align: "center" });
      }
    }
    y += row.h;
  }
  return y;
}

function drawSignatures(doc: jsPDF, t: Transfer, tableBottom: number) {
  let y = Math.max(tableBottom + 10, 232);
  const colW = (PAGE_W - MARGIN * 2 - 8) / 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...INK);
  doc.text("Carrier:", MARGIN, y);
  fieldLine(doc, "", formatShortDate(t.pickUpDate), MARGIN + 18, y, 55);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Pick Up Date", MARGIN + 18, y + 4.2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text(t.carrierName || "", MARGIN + 80, y);
  line(doc, MARGIN + 80, y + 1.1, PAGE_W - MARGIN, y + 1.1);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Signature", MARGIN + 80, y + 4.2);

  y += 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("Shipper:", MARGIN, y);
  line(doc, MARGIN + 18, y + 1.1, MARGIN + 73, y + 1.1);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Pick Up Date", MARGIN + 18, y + 4.2);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text(t.shipperName || "", MARGIN + 80, y);
  line(doc, MARGIN + 80, y + 1.1, PAGE_W - MARGIN, y + 1.1);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Signature", MARGIN + 80, y + 4.2);

  y += 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("Receiver:", MARGIN, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("All goods received in satisfactory order and accounted for:", MARGIN + 18, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Print Name", MARGIN + 18, y);
  line(doc, MARGIN + 40, y - 3.2, MARGIN + 40 + colW, y - 3.2);
  if (t.receiverName) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text(t.receiverName, MARGIN + 42, y - 3.8);
  }

  y += 10;
  line(doc, MARGIN, y, MARGIN + 50, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Date Received", MARGIN, y + 3.8);
  if (t.dateReceived) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(formatShortDate(t.dateReceived), MARGIN + 2, y - 1.2);
  }
  line(doc, MARGIN + 70, y, PAGE_W - MARGIN, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Signature", MARGIN + 70, y + 3.8);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(90, 98, 108);
  const dir = t.direction === "IN" ? "INBOUND" : "OUTBOUND";
  doc.text(
    `${dir}  ·  ${transferFilename(t).replace(/\.pdf$/i, "")}`,
    MARGIN,
    PAGE_H - 8,
  );
}

export async function buildTransferPdf(t: Transfer) {
  const logo = await loadLogo();
  const doc = new jsPDF({ unit: "mm", format: "letter", orientation: "portrait" });
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  drawHeader(doc, t, logo);
  drawPartyBox(doc, t);
  const tableY = drawMeta(doc, t);
  const tableBottom = drawTable(doc, t.items, tableY);
  drawSignatures(doc, t, tableBottom);

  const extra = t.items.filter((i) => i.code || i.details || i.qty).slice(12);
  if (extra.length) {
    doc.addPage();
    drawHeader(doc, t, logo);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Continued items", MARGIN, 36);
    drawTable(doc, extra, 40);
  }

  const blob = doc.output("blob");
  return { blob, filename: transferFilename(t), doc };
}

export async function downloadTransferPdf(t: Transfer) {
  const { blob, filename } = await buildTransferPdf(t);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  return filename;
}

export async function shareOrEmailTransfer(
  t: Transfer,
  to = "materials@stxrailroad.com",
) {
  const { blob, filename } = await buildTransferPdf(t);
  const file = new File([blob], filename, { type: "application/pdf" });
  const subject = encodeURIComponent(
    `STX Material Transfer ${documentNo(t) || ""} ${t.direction}`.trim(),
  );
  const body = encodeURIComponent(emailBody(t));

  const canShare =
    typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });
  if (canShare) {
    try {
      await navigator.share({
        files: [file],
        title: filename,
        text: `Send to ${to}`,
      });
      return "shared";
    } catch (err) {
      if ((err as Error).name === "AbortError") return "aborted";
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  return "mailed";
}
