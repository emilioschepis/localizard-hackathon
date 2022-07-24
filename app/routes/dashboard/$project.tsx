import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { NavLink, Outlet, useLoaderData, useNavigate } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { db } from "~/lib/db.server";
import i18next from "~/lib/i18n.server";
import { requireUserId } from "~/lib/session.server";
import { notFound } from "~/utils/responses";
import { classNames } from "~/utils/style";

type LoaderData = {
  title: string;
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
  const t = await i18next.getFixedT(request);
  const userId = await requireUserId(request);
  const project = await getProject(params.project!);

  if (!project || project.userId !== userId) {
    throw notFound();
  }

  return json<LoaderData>({
    title: `${project.name} / ${t("name")}`,
    project,
  });
};

export const meta: MetaFunction = ({ data }) => {
  return {
    title: (data as LoaderData).title,
  };
};

const tabs = [
  { name: "page.project.labels.title", href: "." },
  { name: "page.project.locales.title", href: "locales" },
  { name: "page.project.api.title", href: "api" },
];

export default function ProjectRoute() {
  const { t } = useTranslation();
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
                {t("accessibility.select_tab")}
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
                    {t(tab.name)}
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
                    {t(tab.name)}
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
