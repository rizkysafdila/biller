import Link from "next/link";
import { Receipt } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { AppNav } from "@/components/app-nav";
import { LogoutButton } from "@/components/logout-button";
import { InstallPrompt } from "@/components/install-prompt";
import { WelcomeModal } from "@/components/welcome-modal";
import { NavProgress } from "@/components/nav-progress";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Real authorization gate (the proxy only does an optimistic check).
  await requireUser();

  return (
    <div className="flex min-h-dvh flex-col">
      <NavProgress />
      <header className="bg-background/95 sticky top-0 z-40 border-b backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold">
            <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-lg">
              <Receipt className="size-4" />
            </span>
            Patungan
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-4 pb-24">
        <InstallPrompt />
        <WelcomeModal />
        {children}
      </main>

      <AppNav />
    </div>
  );
}
