"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/setup", label: "Interests" },
  { href: "/setup/sources", label: "Sources" },
  { href: "/setup/how-it-works", label: "How it works" },
];

// Setup's tabs, each its own page, so links and the back button work.
export function SetupTabs() {
  const path = usePathname();
  return (
    <nav aria-label="Setup" className="mt-6 flex w-fit gap-1 rounded-lg bg-surface p-1 text-sm">
      {TABS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          aria-current={path === href ? "page" : undefined}
          className="rounded-md px-3 py-1.5 text-muted hover:text-foreground aria-[current=page]:bg-background aria-[current=page]:text-foreground aria-[current=page]:shadow-sm"
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
