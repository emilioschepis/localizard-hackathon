import type { Project } from "@prisma/client";

import { db } from "~/lib/db.server";

export type { Project };

export async function getProjects(userId: string) {
  return db.project.findMany({ where: { userId } });
}

export async function createProject(userId: string, name: string) {
  return db.project.create({ data: { userId, name } });
}

export async function getProject(name: string) {
  return db.project.findUnique({ where: { name } });
}

export async function getProjectWithLabels(name: string) {
  return db.project.findUnique({ where: { name }, include: { labels: true } });
}
