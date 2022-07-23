import { Dialog, Transition } from "@headlessui/react";
import { ExclamationIcon } from "@heroicons/react/outline";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { Form, Link, useLoaderData, useTransition } from "@remix-run/react";
import { Fragment, useEffect, useRef, useState } from "react";
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
  const transition = useTransition();
  const [deleting, setDeleting] = useState<string | null>(null);
  const cancelButtonRef = useRef(null);

  useEffect(() => {
    if (transition.state === "idle") {
      setDeleting(null);
    }
  }, [transition.state]);

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
                          <button
                            type="button"
                            className="text-red-600"
                            onClick={() => setDeleting(label.id)}
                          >
                            {t("generic.delete")}
                            <span className="sr-only">, {label.key}</span>
                          </button>
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
      <Transition.Root show={!!deleting} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          initialFocus={cancelButtonRef}
          onClose={() => setDeleting(null)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <ExclamationIcon
                        className="h-6 w-6 text-red-600"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-medium leading-6 text-gray-900"
                      >
                        {t("page.project.labels.delete.title")}
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          {t("page.project.labels.delete.description")}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <Form method="post">
                      <input type="hidden" name="intent" value="delete-label" />
                      <input type="hidden" name="labelId" value={deleting!!} />
                      <button
                        type="submit"
                        className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                      >
                        {t("generic.delete")}
                      </button>
                    </Form>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                      onClick={() => setDeleting(null)}
                      ref={cancelButtonRef}
                    >
                      {t("generic.cancel")}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
}
