import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";

import { requireUserIdApi } from "~/lib/session.server";
import { getProjectWithLabels } from "~/models/project.server";
import { notFound } from "~/utils/responses";

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await requireUserIdApi(request);
  const project = await getProjectWithLabels(params.project as string);

  if (!project || project.userId !== userId) {
    throw notFound();
  }

  return json({
    project,
  });
};
