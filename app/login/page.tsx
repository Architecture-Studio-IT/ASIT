import type { Metadata } from "next";
import { authConfigIssue } from "@/lib/env";
import ConfigNotice from "../components/ConfigNotice";
import { LoginForm } from "../components/AuthForms";

export const metadata: Metadata = { title: "Connexion — ASIT" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const issue = authConfigIssue();
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-bold">Connexion</h1>
        <p className="mt-1 text-sm text-text-cool">Accédez à vos projets d&apos;infrastructure.</p>
      </div>
      {issue ? <ConfigNotice issue={issue} /> : <LoginForm next={next} />}
    </div>
  );
}
