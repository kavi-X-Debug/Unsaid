"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import logo from "../../icon.jpg";

const links = [
  { href: "/", label: "Home" },
  { href: "/inbox", label: "Inbox" },
  { href: "/profile", label: "Profile" }
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-30 border-b border-slate-200/60 bg-slate-50/80 backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-950/80">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative h-7 w-7 overflow-hidden rounded-full border border-slate-300 dark:border-slate-700">
            <Image src={logo} alt="Unsaid" fill sizes="28px" className="object-cover" />
          </div>
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Unsaid
          </span>
        </Link>
        <div className="flex items-center gap-1 rounded-full bg-slate-100 px-1 py-0.5 text-xs border border-slate-200 dark:bg-slate-900/80 dark:border-slate-800">
          {links.map(link => {
            const active =
              pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1 rounded-full transition ${
                  active
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-50"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

