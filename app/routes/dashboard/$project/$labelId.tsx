import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { requireUserId } from "~/lib/session.server";
import { getLabel } from "~/models/label.server";
import { getProject } from "~/models/project.server";
import { notFound } from "~/utils/responses";

type LoaderData = {
  label: NonNullable<Awaited<ReturnType<typeof getLabel>>>;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  const project = await getProject(params.project as string);

  if (!project || project.userId !== userId) {
    throw notFound();
  }

  const label = await getLabel(params.labelId as string);

  if (!label) {
    throw notFound();
  }

  return json({
    label,
  });
};

export default function LabelRoute() {
  const data = useLoaderData<LoaderData>();

  return (
    <div>
      <h1>{data.label.key}</h1>
      <p>{data.label.description || <em>no description</em>}</p>
      <Link to="edit">Edit label</Link>
    </div>
  );
}
