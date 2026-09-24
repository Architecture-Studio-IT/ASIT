import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

/**
 * Droit d'accès et à la portabilité (RGPD art. 15 et 20) :
 * l'utilisateur récupère l'intégralité de ses données dans un format
 * structuré, couramment utilisé et lisible par machine.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentification requise" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, nodes: true, connections: true, notes: true, createdAt: true, updatedAt: true },
  });

  const body = {
    exportedAt: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      authMethods: [user.hasPassword && "password", user.hasGoogle && "google"].filter(Boolean),
      tosAcceptedAt: user.tosAcceptedAt,
      tosVersion: user.tosVersion,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    },
    projects,
  };

  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="asit-export-${user.id}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
