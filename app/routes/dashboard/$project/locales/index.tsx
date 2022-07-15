import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { db } from "~/lib/db.server";

type LoaderData = {
  locales: Awaited<ReturnType<typeof getLocales>>;
};

async function getLocales(projectName: string) {
  return db.locale.findMany({
    where: {
      project: { name: projectName },
    },
    select: {
      id: true,
      name: true,
      translations: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
}

export const loader: LoaderFunction = async ({ params }) => {
  const locales = await getLocales(params.project as string);

  return json<LoaderData>({
    locales,
  });
};

export default function LocalesRoute() {
  const data = useLoaderData<LoaderData>();

  return (
    <div className="flex flex-col">
      <h2 className="text-2xl font-bold">Locales</h2>
      <Link
        to="create-locale"
        className="mt-2 flex h-11 w-full items-center justify-center rounded-lg bg-emerald-800 px-2 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        Create locale
      </Link>
      <div className="mt-2 flex flex-wrap gap-4">
        {data.locales.map((locale) => {
          return (
            <Link
              key={locale.id}
              to={locale.name}
              className="rounded-lg focus:outline-emerald-500"
            >
              <div className="my-2 rounded-lg bg-white p-4 shadow-md">
                <h3 className="text-xl font-bold">{locale.name}</h3>
                <p>{locale.translations.length} translations</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
