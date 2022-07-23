import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { db } from "~/lib/db.server";
import { requireUserId } from "~/lib/session.server";
import { notFound } from "~/utils/responses";

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

export const action: ActionFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  const form = await request.formData();

  const labelId = form.get("labelId");

  const label = await db.label.findUnique({
    where: { id: labelId as string },
    select: {
      id: true,
      project: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!label || label.project.userId !== userId) {
    throw notFound();
  }

  await db.label.delete({ where: { id: label.id } });

  return null;
};

export default function ProjectIndexRoute() {
  const { t } = useTranslation();
  const data = useLoaderData<LoaderData>();

  return (
    <div className="py-4">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h2 className="text-xl font-semibold text-gray-900">
            {t("page.project.labels.title")}
          </h2>
          <p className="mt-2 text-sm text-gray-700">
            {t("page.project.labels.description")}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            to="create-label"
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-emerald-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 sm:w-auto"
          >
            {t("page.project.labels.create_label_cta")}
          </Link>
        </div>
      </div>
      <div className="mt-4 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                    >
                      {t("page.project.labels.key_column")}
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      {t("page.project.labels.description_column")}
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      {t("page.project.labels.translations_column")}
                    </th>
                    <th
                      scope="col"
                      className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                    >
                      <span className="sr-only">{t("generic.edit")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {data.project.labels.map((label) => (
                    <tr key={label.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {label.key}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {label.description || "-"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {label.translations.length}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={label.id}
                            className="text-emerald-700 hover:text-emerald-900"
                          >
                            {t("generic.edit")}
                            <span className="sr-only">, {label.key}</span>
                          </Link>
                          <Form method="post">
                            <input
                              type="hidden"
                              name="intent"
                              value="delete-label"
                            />
                            <input
                              type="hidden"
                              name="labelId"
                              value={label.id}
                            />
                            <button type="submit" className="text-red-600">
                              {t("generic.delete")}
                              <span className="sr-only">, {label.key}</span>
                            </button>
                          </Form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
