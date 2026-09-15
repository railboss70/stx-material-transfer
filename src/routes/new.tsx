import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TransferForm } from "@/components/transfer-form";
import { blankTransfer } from "@/lib/store";

export const Route = createFileRoute("/new")({ component: NewTransfer });

export function NewTransfer() {
  const [initial] = useState(() => blankTransfer());
  return <TransferForm initial={initial} />;
}
