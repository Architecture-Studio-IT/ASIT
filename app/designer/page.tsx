import type { Metadata } from "next";
import { createProject, listProjects } from "../actions/projects";
import DesignerClient from "./DesignerClient";

export const metadata: Metadata = { title: "Designer — ASIT" };
export const dynamic = "force-dynamic";

export default async function DesignerPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project } = await searchParams;
  let projects = await listProjects();

  // Premier passage : un projet vide pour ne pas ouvrir un designer sans onglet.
  if (projects.length === 0) {
    projects = [await createProject("Projet 1")];
  }

  const activeId = projects.some((p) => p.id === project) ? project! : projects[0].id;

  return <DesignerClient initialProjects={projects} initialActiveId={activeId} />;
}
