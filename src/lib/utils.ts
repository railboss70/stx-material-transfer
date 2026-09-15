import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function publicUrl(path: string) {
  const base = import.meta.env.BASE_URL ?? "/";
  const clean = path.replace(/^\//, "");
  return `${base.endsWith("/") ? base : `${base}/`}${clean}`;
}

export function uid() {
  return crypto.randomUUID();
}

export function formatShortDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${m}/${d}/${y.slice(2)}`;
}

export function yymmdd(iso: string) {
  if (!iso) return "";
  const compact = iso.replaceAll("-", "");
  return compact.length === 8 ? compact.slice(2) : compact;
}

export function todayIso() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function qtyDisplay(qty: string, unit: string) {
  const q = qty.trim();
  if (!q) return "";
  if (/[a-zA-Z]/.test(q)) return q;
  return unit ? `${q} ${unit}` : q;
}
