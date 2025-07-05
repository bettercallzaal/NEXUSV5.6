"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePrivy } from "@privy-io/react-auth";

interface NavItem {
  name: string;
  href: string;
  requiresAuth?: boolean;
}

export function LinksNav() {
  const pathname = usePathname();
  const { authenticated } = usePrivy();
  
  const navItems: NavItem[] = [
    { name: "Links", href: "/links" },
    { name: "Demo", href: "/demo" },
    { name: "Batch Tag", href: "/admin/batch-tag", requiresAuth: true },
  ];
  
  // Filter items based on authentication
  const filteredItems = navItems.filter(item => 
    !item.requiresAuth || (item.requiresAuth && authenticated)
  );
  
  return (
    <nav className="flex items-center space-x-4 lg:space-x-6 mb-8">
      {filteredItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === item.href
              ? "text-primary"
              : "text-muted-foreground"
          )}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  );
}
