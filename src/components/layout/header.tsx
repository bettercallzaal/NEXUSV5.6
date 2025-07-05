"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { WalletConnectButton } from "@/components/wallet/connect-button";
import { ClientOnly } from "@/components/client-only";

export function Header() {
  const pathname = usePathname();
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">ZAO Nexus</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link 
              href="/" 
              className="text-sm font-medium transition-colors hover:text-primary text-primary"
            >
              ZAO Nexus
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <ClientOnly>
            <WalletConnectButton />
          </ClientOnly>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
