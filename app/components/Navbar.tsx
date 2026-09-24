"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, User } from "lucide-react";
import { APP_NAME, APP_LOGO, NAV_LINKS } from "../constants";

export interface NavbarUser {
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

export default function Navbar({ user }: { user: NavbarUser | null }) {
  const pathname = usePathname();

  return (
    <nav className="flex h-14 items-center bg-foreground px-6" aria-label="Navigation principale">
      <Link href={user ? "/dashboard" : "/"} className="mr-8 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white" aria-hidden="true">
          {APP_LOGO}
        </span>
        <span className="text-lg font-bold text-white">{APP_NAME}</span>
      </Link>

      <div className="flex flex-1 items-center justify-center gap-1">
        {user &&
          NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                  isActive ? "bg-white/15 text-white" : "text-white/80 hover:text-white"
                }`}
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </Link>
            );
          })}
      </div>

      {user ? (
        <Link
          href="/profile"
          aria-label={`Mon profil — ${user.name ?? user.email}`}
          className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-white/30 text-white/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt="" width={32} height={32} className="h-8 w-8" referrerPolicy="no-referrer" />
          ) : (
            <User size={16} aria-hidden="true" />
          )}
        </Link>
      ) : (
        <Link
          href="/login"
          className="flex items-center gap-2 rounded-full border border-white/30 px-4 py-1.5 text-sm text-white/90 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <LogIn size={14} aria-hidden="true" />
          Connexion
        </Link>
      )}
    </nav>
  );
}
