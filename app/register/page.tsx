import type { Metadata } from "next";
import { authConfigIssue } from "@/lib/env";
import { getPendingGoogleIdentity } from "@/lib/session";
import ConfigNotice from "../components/ConfigNotice";
import { GoogleCompleteForm, RegisterForm } from "../components/AuthForms";

export const metadata: Metadata = { title: "Créer un compte — ASIT" };
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const issue = authConfigIssue();
  if (issue) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-12">
        <h1 className="text-2xl font-bold">Créer un compte</h1>
        <ConfigNotice issue={issue} />
      </div>
    );
  }

  const pending = await getPendingGoogleIdentity();

  if (pending) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-12">
        <div>
          <h1 className="text-2xl font-bold">Finaliser l&apos;inscription</h1>
          <p className="mt-1 text-sm text-text-cool">
            Votre identité Google est vérifiée. Il ne reste qu&apos;à accepter les conditions d&apos;utilisation.
          </p>
        </div>
        <GoogleCompleteForm email={pending.email} name={pending.name} picture={pending.picture} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-bold">Créer un compte</h1>
        <p className="mt-1 text-sm text-text-cool">
          Un compte est nécessaire pour enregistrer vos projets. Nous ne collectons que votre nom, votre adresse
          email et vos projets.
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
