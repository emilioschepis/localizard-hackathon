import { ExclamationCircleIcon } from "@heroicons/react/outline";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { db } from "~/lib/db.server";
import i18next from "~/lib/i18n.server";
import { requireUserId } from "~/lib/session.server";
import { getProject } from "~/models/project.server";
import type { FormActionData } from "~/types/types";
import { badRequest, notFound } from "~/utils/responses";
import { validateLocaleName } from "~/utils/validators";

type ActionData = FormActionData<{ name: string }>;

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  const project = await getProject(params.project as string);

  if (!project || project.userId !== userId) {
    throw notFound();
  }

  return json(null);
};

export const action: ActionFunction = async ({ request, params }) => {
  const t = await i18next.getFixedT(request);
  const userId = await requireUserId(request);
  const form = await request.formData();

  const name = form.get("name");

  if (typeof name !== "string") {
    return badRequest<ActionData>({
      formError: t("error.invalid_form_data"),
      fields: { name: "" },
    });
  }

  const project = await getProject(params.project as string);

  if (!project || project.userId !== userId) {
    throw notFound();
  }

  const fields = { name };
  const fieldErrors = {
    name: t(validateLocaleName(name) ?? ""),
  };

  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest<ActionData>({ fields, fieldErrors });
  }

  const existingLocale = await db.locale.findFirst({
    where: { AND: { projectId: project.id, name } },
  });

  if (existingLocale) {
    return badRequest<ActionData>({
      fieldErrors: {
        name: t("error.locale_already_exists"),
      },
      fields,
    });
  }

  await db.locale.create({ data: { projectId: project.id, name } });

  return redirect(`/dashboard/${project.name}/locales`);
};

export default function CreateProjectRoute() {
  const { t } = useTranslation();
  const action = useActionData<ActionData>();

  return (
    <div className="py-4">
      <div className="mb-2 sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h2 className="text-xl font-semibold text-gray-900">
            {t("page.create_locale.title")}
          </h2>
        </div>
      </div>
      <Form method="post">
        <div className="flex flex-col space-y-2">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              {t("form.label.locale_name")}
            </label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <input
                type="text"
                name="name"
                id="name"
                required
                pattern="^[a-z-_]+$"
                className={`block w-full rounded-md  border-gray-300 pr-10  shadow-sm  focus:border-emerald-600 focus:outline-none  focus:ring-emerald-600 sm:text-sm ${
                  action?.fieldErrors?.name
                    ? "border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500"
                    : ""
                }`}
                placeholder={t("form.placeholder.locale_name")}
                defaultValue={action?.fields.name}
                aria-invalid={Boolean(action?.fieldErrors?.name)}
                aria-describedby="name-description"
                aria-errormessage={
                  action?.fieldErrors?.name ? "name-error" : undefined
                }
              />
              {action?.fieldErrors?.name ? (
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <ExclamationCircleIcon
                    className="h-5 w-5 text-red-500"
                    aria-hidden="true"
                  />
                </div>
              ) : null}
            </div>
            {action?.fieldErrors?.name ? (
              <p className="mt-2 text-sm text-red-600" id="name-error">
                {action.fieldErrors.name}
              </p>
            ) : null}
            <p className="mt-2 text-sm text-gray-500" id="name-description">
              {t("form.hint.locale_name")}
            </p>
          </div>
          <button
            type="submit"
            className="inline-flex justify-center self-end rounded-md border border-transparent bg-emerald-700 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
          >
            {t("page.create_locale.cta")}
          </button>
        </div>
      </Form>
    </div>
  );
}
