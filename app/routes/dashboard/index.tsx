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
      <h1>Localizard</h1>
      <h2>Your projects</h2>
      <ul>
        {data.projects.map((project) => (
          <li key={project.id}>
            <Link to={`/dashboard/${project.name}`}>{project.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
