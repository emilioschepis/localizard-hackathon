import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";

import { requireUserIdApi } from "~/lib/session.server";
import { getProjects } from "~/models/project.server";

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserIdApi(request);
  const projects = await getProjects(userId);

  return json({
    projects,
  });
};
