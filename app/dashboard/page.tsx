import type { Metadata } from "next";
import { listProjects } from "../actions/projects";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = { title: "Tableau de bord — ASIT" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const projects = await listProjects();
  return <DashboardClient projects={projects} />;
}
