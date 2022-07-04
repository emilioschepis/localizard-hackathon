import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";

import { getProjectWithLabelsAndKey } from "~/models/project.server";
import { notFound, unauthorized } from "~/utils/responses";

export const loader: LoaderFunction = async ({ request, params }) => {
  const apiKey = request.headers.get("X-Api-Key");
  if (typeof apiKey !== "string") {
    throw unauthorized();
  }

  const project = await getProjectWithLabelsAndKey(params.project as string);
  if (!project || project.apiKey?.key !== apiKey) {
    throw notFound();
  }

  return json({
    project: {
      id: project.id,
      name: project.name,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      labels: project.labels.map((label) => ({
        key: label.key,
        description: label.description,
      })),
    },
  });
};
