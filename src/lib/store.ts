import { create } from "zustand";
import { persist } from "zustand/middleware";
import { emptyParty, type LineItem, type SavedJob, type Transfer } from "@/lib/types";
import { todayIso, uid } from "@/lib/utils";

const EXAMPLE_ID = "example-ampacet-palmetto";

function exampleTransfer(): Transfer {
  return {
    id: EXAMPLE_ID,
    createdAt: "2026-03-26T14:00:00.000Z",
    updatedAt: "2026-03-26T14:00:00.000Z",
    status: "issued",
    direction: "OUT",
    pickUpDate: "2026-03-26",
    from: {
      company: "STX",
      jobName: "AMPACET",
      jobNumber: "25139",
      address: "",
    },
    to: {
      company: "STX",
      jobName: "Palmetto Yard",
      jobNumber: "26000",
      address: "",
    },
    carrier: "STX",
    bol: "",
    specialInstructions: "",
    items: [
      {
        id: "ex-item-1",
        materialId: "31582-672",
        code: "31582",
        details: "100# DS PLATES RELAY",
        qty: "1750",
        unit: "EA",
        weight: "",
      },
      {
        id: "ex-item-2",
        materialId: "31529-555",
        code: "31529",
        details: "100RE BARS 4 HOLE RELAY",
        qty: "50",
        unit: "PR",
        weight: "",
      },
      {
        id: "ex-item-3",
        materialId: "31562-602",
        code: "31562",
        details: "100RE/115RE COMPS, LH/RH",
        qty: "1 PR LH, 1 PR RH",
        unit: "PR",
        weight: "",
      },
    ],
    carrierName: "Caleb Riechman",
    shipperName: "",
    receiverName: "",
    dateReceived: "",
  };
}

const DEFAULT_JOBS: SavedJob[] = [
  {
    id: "job-25139",
    company: "STX",
    jobName: "AMPACET",
    jobNumber: "25139",
    address: "",
  },
  {
    id: "job-26000",
    company: "STX",
    jobName: "Palmetto Yard",
    jobNumber: "26000",
    address: "",
  },
];

export function blankItem(): LineItem {
  return {
    id: uid(),
    materialId: "",
    code: "",
    details: "",
    qty: "",
    unit: "",
    weight: "",
  };
}

export function blankTransfer(): Transfer {
  return {
    id: uid(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "draft",
    direction: "OUT",
    pickUpDate: todayIso(),
    from: emptyParty(),
    to: emptyParty(),
    carrier: "STX",
    bol: "",
    specialInstructions: "",
    items: [blankItem(), blankItem(), blankItem()],
    carrierName: "",
    shipperName: "",
    receiverName: "",
    dateReceived: "",
  };
}

interface TransferState {
  transfers: Transfer[];
  jobs: SavedJob[];
  recentMaterialIds: string[];
  upsert: (t: Transfer) => void;
  remove: (id: string) => void;
  duplicate: (id: string) => Transfer | undefined;
  getById: (id: string) => Transfer | undefined;
  rememberJob: (party: {
    company: string;
    jobName: string;
    jobNumber: string;
    address: string;
  }) => void;
  rememberMaterial: (id: string) => void;
}

export const useTransferStore = create<TransferState>()(
  persist(
    (set, get) => ({
      transfers: [exampleTransfer()],
      jobs: DEFAULT_JOBS,
      recentMaterialIds: ["31582-672", "31529-555", "31562-602"],
      getById: (id) => get().transfers.find((t) => t.id === id),
      upsert: (t) =>
        set((s) => {
          const next = { ...t, updatedAt: new Date().toISOString() };
          const idx = s.transfers.findIndex((x) => x.id === next.id);
          const transfers =
            idx === -1
              ? [next, ...s.transfers]
              : s.transfers.map((x, i) => (i === idx ? next : x));
          return { transfers };
        }),
      remove: (id) =>
        set((s) => ({ transfers: s.transfers.filter((x) => x.id !== id) })),
      duplicate: (id) => {
        const src = get().transfers.find((x) => x.id === id);
        if (!src) return undefined;
        const copy: Transfer = {
          ...src,
          id: uid(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: "draft",
          pickUpDate: todayIso(),
          items: src.items.map((i) => ({ ...i, id: uid() })),
          receiverName: "",
          dateReceived: "",
        };
        set((s) => ({ transfers: [copy, ...s.transfers] }));
        return copy;
      },
      rememberJob: (party) => {
        const num = party.jobNumber.trim();
        const name = party.jobName.trim();
        if (!num && !name) return;
        set((s) => {
          const existing = s.jobs.find(
            (j) =>
              (num && j.jobNumber === num) ||
              (!num && name && j.jobName.toLowerCase() === name.toLowerCase()),
          );
          if (existing) {
            return {
              jobs: s.jobs.map((j) =>
                j.id === existing.id
                  ? {
                      ...j,
                      company: party.company.trim() || j.company,
                      jobName: name || j.jobName,
                      jobNumber: num || j.jobNumber,
                      address: party.address.trim() || j.address,
                    }
                  : j,
              ),
            };
          }
          const job: SavedJob = {
            id: uid(),
            company: party.company.trim() || "STX",
            jobName: name,
            jobNumber: num,
            address: party.address.trim(),
          };
          return { jobs: [job, ...s.jobs].slice(0, 40) };
        });
      },
      rememberMaterial: (id) => {
        if (!id) return;
        set((s) => ({
          recentMaterialIds: [id, ...s.recentMaterialIds.filter((x) => x !== id)].slice(
            0,
            24,
          ),
        }));
      },
    }),
    { name: "stx-material-transfers-v1" },
  ),
);
