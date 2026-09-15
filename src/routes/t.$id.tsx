import { Link, createFileRoute, useParams } from "@tanstack/react-router";
import { TransferForm } from "@/components/transfer-form";
import { Button } from "@/components/ui/button";
import { useTransferStore } from "@/lib/store";

export const Route = createFileRoute("/t/$id")({ component: EditTransfer });

export function EditTransfer() {
  const { id } = useParams({ from: "/t/$id" });
  const transfer = useTransferStore((s) => s.transfers.find((t) => t.id === id));

  if (!transfer) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-semibold">Transfer not found</h1>
        <p className="mt-2 text-sm text-muted">It may have been deleted on this device.</p>
        <Button className="mt-6" asChild>
          <Link to="/">Back to transfers</Link>
        </Button>
      </div>
    );
  }

  return <TransferForm key={transfer.id} initial={transfer} />;
}
