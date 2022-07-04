import type { LoaderFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { requireUserId } from "~/lib/session.server";
import { getProjectWithLabels } from "~/models/project.server";
import { notFound } from "~/utils/responses";

type LoaderData = {
  project: NonNullable<Awaited<ReturnType<typeof getProjectWithLabels>>>;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  const project = await getProjectWithLabels(params.project as string);

  if (!project || project.userId !== userId) {
    throw notFound();
  }

  return {
    project,
  };
};

export default function ProjectRoute() {
  const data = useLoaderData<LoaderData>();

  return (
    <div>
      <h1>{data.project.name}</h1>
      <h2>Labels</h2>
      <ul>
        {data.project.labels.map((label) => (
          <li key={label.id}>
            <Link to={label.id}>{label.key}</Link>
          </li>
        ))}
      </ul>
      <Link to="create-label">Create label</Link>
    </div>
  );
}
