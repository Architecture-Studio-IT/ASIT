"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "lucide-react";
import { APP_NAME, APP_LOGO, NAV_LINKS } from "../constants";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="flex h-14 items-center bg-foreground px-6">
      <Link href="/" className="mr-8 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white">
          {APP_LOGO}
        </span>
        <span className="text-lg font-bold text-white">{APP_NAME}</span>
      </Link>

      <div className="flex flex-1 items-center justify-center gap-1">
        {NAV_LINKS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:text-white/80"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </div>

      <button className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/60 hover:text-white/80">
        <User size={16} />
      </button>
    </nav>
  );
}
