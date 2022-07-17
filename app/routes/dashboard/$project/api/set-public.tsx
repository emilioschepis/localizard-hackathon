import type { ActionFunction } from "@remix-run/node";

import { db } from "~/lib/db.server";
import { requireUserId } from "~/lib/session.server";
import { unauthorized } from "~/utils/responses";

export const action: ActionFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  const project = await db.project.findUniqueOrThrow({
    where: { name: params.project as string },
    select: { id: true, userId: true },
  });

  if (project.userId !== userId) {
    throw unauthorized();
  }

  const form = await request.formData();
  const setPublic = form.get("setPublic");

  await db.project.update({
    where: { id: project.id },
    data: { public: setPublic === "true" ? true : false },
  });

  return null;
};
