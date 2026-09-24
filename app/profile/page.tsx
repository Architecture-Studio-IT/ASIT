import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { CGU_VERSION } from "@/lib/legal";
import ProfileClient from "./ProfileClient";

export const metadata: Metadata = { title: "Mon profil — ASIT" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/profile");
  return <ProfileClient user={user} cguVersion={CGU_VERSION} />;
}
