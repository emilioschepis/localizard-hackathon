import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { v4 as uuid } from "uuid";

import { db } from "~/lib/db.server";
import { requireUserId } from "~/lib/session.server";
import {
  getProject,
  getProjectWithLabelsAndKey,
} from "~/models/project.server";
import { notFound } from "~/utils/responses";

type LoaderData = {
  project: NonNullable<Awaited<ReturnType<typeof getProjectWithLabelsAndKey>>>;
};

export const action: ActionFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);

  const project = await getProject(params.project as string);
  if (!project || project.userId !== userId) {
    throw notFound();
  }

  await db.apiKey.upsert({
    where: { projectId: project.id },
    create: {
      projectId: project.id,
      key: uuid(),
    },
    update: {
      key: uuid(),
    },
  });

  return new Response("OK", { status: 200 });
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  const project = await getProjectWithLabelsAndKey(params.project as string);

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
      <details>
        <summary>Api Key</summary>
        {data.project.apiKey ? <code>{data.project.apiKey.key}</code> : null}
        <Form method="post">
          <button type="submit">Regenerate</button>
        </Form>
      </details>
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
