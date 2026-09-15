import catalog from "@/data/materials.json";
import type { Material } from "@/lib/types";

export const MATERIALS = catalog as Material[];

const FAMILIES = [
  "Agg",
  "Crossties",
  "SWTies",
  "Rail",
  "Derail",
  "Turnout",
  "Frog",
  "Anchors",
  "Fastening",
  "Insulated Joint",
  "Joint Bars",
  "Tie Plate",
  "Plugging",
  "Restraint",
  "Containment",
  "Crossing",
  "DF",
  "Concrete",
  "EOT",
  "Geo",
  "Paving",
  "Pipe",
  "Sign",
  "Weld",
  "Bridge",
  "MISC",
] as const;

export function familyOf(mat: Material): string {
  const prefix = mat.category.split("-")[0]?.trim() ?? "";
  if (FAMILIES.includes(prefix as (typeof FAMILIES)[number])) return prefix;
  if (mat.category.startsWith("MISC") || !mat.code) return "MISC";
  return prefix || "MISC";
}

export const MATERIAL_FAMILIES = FAMILIES.filter((f) =>
  MATERIALS.some((m) => familyOf(m) === f),
);

function expand(s: string) {
  return s
    .toLowerCase()
    .replace(/(\d+)\s*re\b/g, "$1")
    .replace(/#/g, "")
    .replace(/\bds\b/g, "double shoulder ds")
    .replace(/\bss\b/g, "single shoulder ss")
    .replace(/\bplates?\b/g, "tie plate plates")
    .replace(/\bbars?\b/g, "joint bar bars")
    .replace(/\bcomps?\b/g, "compromise comps")
    .replace(/\bcrossties?\b/g, "crosstie ties")
    .replace(/\bswt(ies|ie)?\b/g, "switchtie swties")
    .replace(/\bagg\b/g, "aggregate ballast agg")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const INDEX = MATERIALS.map((m) => {
  const hay = expand(`${m.code} ${m.category} ${m.name} ${m.unit}`);
  const tokens = new Set(hay.split(" ").filter(Boolean));
  return { m, hay, tokens, code: m.code };
});

export function searchMaterials(query: string, limit = 12): Material[] {
  const raw = query.trim();
  if (!raw) return [];

  const digits = raw.replace(/\D/g, "");
  const q = expand(raw);
  const qTokens = q.split(" ").filter((t) => t.length > 0);
  if (qTokens.length === 0 && digits.length < 2) return [];

  const scored: { m: Material; s: number }[] = [];
  for (const row of INDEX) {
    let s = 0;
    if (row.code && raw === row.code) s += 1000;
    else if (row.code && digits.length >= 3 && row.code.startsWith(digits)) s += 280;
    else if (row.code && digits.length >= 2 && row.code.includes(digits)) s += 80;

    if (q) {
      if (row.hay.includes(q)) s += 120;
      let hits = 0;
      for (const t of qTokens) {
        if (row.tokens.has(t)) {
          hits += 1;
          s += t.length > 2 ? 18 : 10;
        } else if ([...row.tokens].some((tok) => tok.startsWith(t) && t.length >= 2)) {
          hits += 0.6;
          s += 6;
        } else if (row.hay.includes(t)) {
          hits += 0.8;
          s += 8;
        }
      }
      if (qTokens.length > 0 && hits < qTokens.length * 0.45 && s < 80) continue;
    }

    if (s > 0) scored.push({ m: row.m, s });
  }

  scored.sort((a, b) => b.s - a.s || a.m.code.localeCompare(b.m.code));
  return scored.slice(0, limit).map((x) => x.m);
}

export function materialById(id: string) {
  return MATERIALS.find((m) => m.id === id);
}

export function materialsByFamily(family: string) {
  return MATERIALS.filter((m) => familyOf(m) === family);
}
