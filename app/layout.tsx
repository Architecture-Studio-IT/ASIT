import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Navbar from "./components/Navbar";
import { getCurrentUser } from "@/lib/session";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ASIT — Architect Studio IT",
  description: "Concevoir, chiffrer et documenter une infrastructure informatique.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="fr">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col h-screen overflow-hidden`}>
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-white"
        >
          Aller au contenu
        </a>
        <Navbar user={user ? { name: user.name, email: user.email, avatarUrl: user.avatarUrl } : null} />
        <main id="contenu" className="flex-1 overflow-auto">
          {children}
        </main>
        <footer className="flex h-8 shrink-0 items-center justify-center gap-4 border-t border-border bg-white px-4 text-xs text-text-cool">
          <Link href="/cgu" className="hover:text-foreground">
            Conditions d&apos;utilisation et données personnelles
          </Link>
          <span aria-hidden="true">·</span>
          <span>Fiches produits : Database Right data-sheet {new Date().getFullYear()} Icecat. All rights reserved.</span>
        </footer>
      </body>
    </html>
  );
}
