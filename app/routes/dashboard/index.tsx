import type { LoaderFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { requireUserId } from "~/lib/session.server";
import { getProjects } from "~/models/project.server";

type LoaderData = {
  projects: Awaited<ReturnType<typeof getProjects>>;
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const projects = await getProjects(userId);

  return {
    projects,
  };
};

export default function DashboardRoute() {
  const data = useLoaderData<LoaderData>();

  return (
    <div>
      <h1 className="text-3xl font-bold">Projects</h1>
      <Link
        to="create-project"
        className="mt-4 flex h-11 w-full items-center justify-center rounded-lg bg-emerald-800 px-2 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        Create project
      </Link>
      <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2">
        {data.projects.map((project) => (
          <Link
            key={project.id}
            to={`/dashboard/${project.name}`}
            className="rounded-lg bg-white p-4 shadow-md hover:ring-2 hover:ring-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <p className="text-xl font-bold">{project.name}</p>
            <p>
              Created:{" "}
              <time dateTime={new Date(project.createdAt).toISOString()}>
                {new Date(project.createdAt).toLocaleString()}
              </time>
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
