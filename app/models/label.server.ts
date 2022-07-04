import { db } from "~/lib/db.server";

export async function createLabel(
  projectId: string,
  key: string,
  description?: string
) {
  return db.label.create({
    data: {
      projectId,
      key,
      description,
    },
  });
}

export async function getLabel(id: string) {
  return db.label.findUnique({ where: { id } });
}

export async function updateLabel(
  id: string,
  key: string,
  description?: string
) {
  return db.label.update({ where: { id }, data: { key, description } });
}
