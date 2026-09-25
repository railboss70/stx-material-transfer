import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Plus, Rows3, Share, X } from "lucide-react";
import { Toaster } from "sonner";
import { cn, publicUrl } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-dvh bg-bg text-fg">
      {/* pt: keep header below the iPhone clock/battery when opened from the home screen */}
      <header className="sticky top-0 z-20 border-b border-border bg-bg/92 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link to="/" className="flex min-w-0 shrink items-center gap-3">
            <img
              src={publicUrl("stx-logo.png")}
              alt="STX Corporation"
              width={160}
              height={60}
              className="h-9 w-auto max-w-[7.75rem] object-contain object-left sm:h-11 sm:max-w-[12rem]"
            />
            <span className="hidden min-w-0 flex-col leading-tight md:flex">
              <span className="font-display text-lg font-semibold tracking-wide text-fg">
                Material Transfer
              </span>
              <span className="text-[11px] uppercase tracking-[0.16em] text-muted">
                Inventory · Bill of Lading
              </span>
            </span>
          </Link>
          <nav className="ml-auto flex shrink-0 items-center gap-0.5">
            <NavLink to="/" active={pathname === "/"} icon={<Rows3 className="size-4" />}>
              Transfers
            </NavLink>
            <NavLink
              to="/catalog"
              active={pathname.startsWith("/catalog")}
              icon={<BookOpen className="size-4" />}
            >
              Catalog
            </NavLink>
            <Link
              to="/new"
              className="ml-1 inline-flex h-10 items-center gap-2 rounded-full bg-primary px-3.5 text-sm font-semibold text-primary-fg sm:px-4"
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">New transfer</span>
              <span className="sm:hidden">New</span>
            </Link>
          </nav>
        </div>
      </header>
      <InstallHint />
      <main>{children}</main>
      <Toaster
        theme="dark"
        position="top-center"
        mobileOffset={{ top: "calc(env(safe-area-inset-top) + 12px)" }}
        toastOptions={{
          className: "bg-surface border-border text-fg",
        }}
      />
    </div>
  );
}

function InstallHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/i.test(ua);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && Boolean((navigator as { standalone?: boolean }).standalone));
    const dismissed = localStorage.getItem("stx-mt-install-dismissed");
    if (ios && !standalone && !dismissed) setShow(true);
  }, []);

  if (!show) return null;
  return (
    <div className="border-b border-border bg-surface-2 px-4 py-2.5 sm:px-6">
      <div className="mx-auto flex max-w-6xl items-start gap-3 text-sm">
        <Share className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="min-w-0 flex-1 leading-snug text-fg">
          <span className="font-semibold">Add to Home Screen.</span> Tap Share, then{" "}
          <span className="font-semibold">Add to Home Screen</span> — Safari only.
        </p>
        <button
          type="button"
          aria-label="Dismiss"
          className="shrink-0 rounded-full p-1 text-muted hover:bg-surface hover:text-fg"
          onClick={() => {
            localStorage.setItem("stx-mt-install-dismissed", "1");
            setShow(false);
          }}
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

function NavLink({
  to,
  active,
  icon,
  children,
}: {
  to: "/" | "/catalog";
  active: boolean;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-medium",
        active ? "bg-surface-2 text-fg" : "text-muted hover:bg-surface-2 hover:text-fg",
      )}
    >
      {icon}
      <span className="hidden sm:inline">{children}</span>
    </Link>
  );
}
