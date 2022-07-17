import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { NavLink, Outlet, useLoaderData, useNavigate } from "@remix-run/react";

import { db } from "~/lib/db.server";
import { requireUserId } from "~/lib/session.server";
import { notFound } from "~/utils/responses";
import { classNames } from "~/utils/style";

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

const tabs = [
  { name: "Labels", href: "." },
  { name: "Locales", href: "locales" },
  { name: "API", href: "api" },
];

export default function ProjectRoute() {
  const data = useLoaderData<LoaderData>();
  const navigate = useNavigate();

  return (
    <div className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          {data.project.name}
        </h1>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="border-b border-gray-200 pb-5 sm:pb-0">
          <div className="mt-3 sm:mt-4">
            <div className="sm:hidden">
              <label htmlFor="current-tab" className="sr-only">
                Select a tab
              </label>
              <select
                id="current-tab"
                name="current-tab"
                className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-emerald-600 focus:outline-none focus:ring-emerald-600 sm:text-sm"
                // defaultValue={tabs.find((tab) => tab.current).name}
                onChange={(el) => navigate(el.target.value)}
              >
                {tabs.map((tab) => (
                  <option key={tab.name} value={tab.href}>
                    {tab.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="hidden sm:block">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => (
                  <NavLink
                    end
                    to={tab.href}
                    key={tab.name}
                    className={({ isActive }) =>
                      classNames(
                        isActive
                          ? "border-emerald-600 text-emerald-700"
                          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                        "whitespace-nowrap border-b-2 px-1 pb-4 text-sm font-medium"
                      )
                    }
                  >
                    {tab.name}
                  </NavLink>
                ))}
              </nav>
            </div>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
