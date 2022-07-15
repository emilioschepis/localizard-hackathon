import type { LoaderFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { db } from "~/lib/db.server";

type LoaderData = {
  project: NonNullable<Awaited<ReturnType<typeof getProject>>>;
};

async function getProject(name: string) {
  return db.project.findUniqueOrThrow({
    where: { name },
    select: {
      labels: {
        select: {
          id: true,
          key: true,
          description: true,
          translations: {
            where: { value: { not: { equals: "" } } },
            orderBy: { updatedAt: "desc" },
            select: {
              updatedAt: true,
              locale: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { key: "asc" },
      },
    },
  });
}

export const loader: LoaderFunction = async ({ request, params }) => {
  const project = await getProject(params.project!);

  return {
    project,
  };
};

export default function ProjectIndexRoute() {
  const data = useLoaderData<LoaderData>();

  return (
    <div className="flex flex-col">
      <h2 className="text-2xl font-bold">Labels</h2>
      <Link
        to="create-label"
        className="mt-2 flex h-11 w-full items-center justify-center rounded-lg bg-emerald-800 px-2 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        Create label
      </Link>
      <div className="mt-2 space-y-4">
        {data.project.labels.map((label) => {
          const updatedAt =
            label.translations.length > 0
              ? new Date(label.translations[0].updatedAt)
              : null;

          const locales = label.translations
            .map((translation) => translation.locale.name)
            .sort();

          return (
            <Link
              key={label.id}
              to={label.id}
              className="rounded-lg focus:outline-emerald-500"
            >
              <div className="my-2 rounded-lg bg-white p-4 shadow-md">
                <h3 className="text-xl font-bold">{label.key}</h3>
                {label.description ? (
                  <p>{label.description}</p>
                ) : (
                  <p className="italic">no description</p>
                )}
                {label.translations.length > 0 ? (
                  <>
                    <p>Last updated: {updatedAt?.toLocaleString()}</p>
                    <p>
                      Translated in:{" "}
                      <span className="font-semibold">
                        {locales.join(", ")}
                      </span>
                    </p>
                  </>
                ) : (
                  <p className="font-semibold">No translations provided</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
