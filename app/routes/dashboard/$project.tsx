import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { NavLink, Outlet, useLoaderData } from "@remix-run/react";

import { db } from "~/lib/db.server";
import { requireUserId } from "~/lib/session.server";
import { notFound } from "~/utils/responses";

type LoaderData = {
  project: NonNullable<Awaited<ReturnType<typeof getProject>>>;
};

async function getProject(name: string) {
  return db.project.findUnique({
    where: { name },
    select: {
      id: true,
      name: true,
      userId: true,
    },
  });
}

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  const project = await getProject(params.project!);

  if (!project || project.userId !== userId) {
    throw notFound();
  }

  return json({ project });
};

export default function ProjectRoute() {
  const data = useLoaderData<LoaderData>();

  return (
    <div>
      <h1 className="text-3xl font-bold">{data.project.name}</h1>
      <div className="my-4 flex items-stretch space-x-2 rounded-xl bg-white shadow-md">
        <NavLink
          end
          to="."
          className="flex flex-1 rounded-xl focus:outline-emerald-500"
        >
          {({ isActive }) => (
            <span
              className={`h-full w-full p-4 text-center text-sm font-bold uppercase ${
                isActive ? "text-emerald-600" : "text-gray-700"
              }`}
            >
              Labels
            </span>
          )}
        </NavLink>
        <div aria-hidden className="mx-1 my-2 w-[1px] bg-gray-200" />
        <NavLink
          to="locales"
          className="flex flex-1 rounded-xl focus:outline-emerald-500"
        >
          {({ isActive }) => (
            <span
              className={`h-full w-full p-4 text-center text-sm font-bold uppercase ${
                isActive ? "text-emerald-600" : "text-gray-700"
              }`}
            >
              Locales
            </span>
          )}
        </NavLink>
        <div aria-hidden className="mx-1 my-2 w-[1px] bg-gray-200" />
        <NavLink
          to="api"
          className="flex flex-1 rounded-xl focus:outline-emerald-500"
        >
          {({ isActive }) => (
            <span
              className={`h-full w-full p-4 text-center text-sm font-bold uppercase ${
                isActive ? "text-emerald-600" : "text-gray-700"
              }`}
            >
              API Settings
            </span>
          )}
        </NavLink>
      </div>
      <Outlet />
    </div>
  );
}
