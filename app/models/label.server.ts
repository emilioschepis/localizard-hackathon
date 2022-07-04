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
