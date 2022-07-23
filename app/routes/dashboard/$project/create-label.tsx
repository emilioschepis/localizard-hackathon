import { ExclamationCircleIcon } from "@heroicons/react/outline";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { db } from "~/lib/db.server";
import i18next from "~/lib/i18n.server";
import { requireUserId } from "~/lib/session.server";
import { createLabel } from "~/models/label.server";
import { getProject } from "~/models/project.server";
import type { FormActionData } from "~/types/types";
import { badRequest, notFound } from "~/utils/responses";
import { validateLabelDescription, validateLabelKey } from "~/utils/validators";

type Fields = { key: string; description?: string };
type ActionData = FormActionData<Fields>;

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

  const key = form.get("key");
  const description = form.get("description");

  if (
    typeof key !== "string" ||
    (typeof description !== "undefined" && typeof description !== "string")
  ) {
    return badRequest<ActionData>({
      formError: t("error.invalid_form_data"),
      fields: { key: "", description: "" },
    });
  }

  const project = await getProject(params.project as string);

  if (!project || project.userId !== userId) {
    throw notFound();
  }

  const fields = { key, description };
  const fieldErrors = {
    key: t(validateLabelKey(key) ?? ""),
    description: description
      ? t(validateLabelDescription(description) ?? "")
      : undefined,
  };

  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest<ActionData>({ fields, fieldErrors });
  }

  const existingLabel = await db.label.findFirst({
    where: { AND: { projectId: project.id, key } },
  });

  if (existingLabel) {
    return badRequest<ActionData>({
      fieldErrors: {
        key: t("error.label_already_exists"),
        description: undefined,
      },
      fields,
    });
  }

  const label = await createLabel(project.id, key, description);

  return redirect(`/dashboard/${project.name}/${label.id}`);
};

export default function CreateProjectRoute() {
  const { t } = useTranslation();
  const action = useActionData<ActionData>();

  return (
    <div className="py-4">
      <div className="mb-2 sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h2 className="text-xl font-semibold text-gray-900">
            {t("page.create_label.title")}
          </h2>
        </div>
      </div>
      <Form method="post">
        <div className="flex flex-col space-y-2">
          <div>
            <label
              htmlFor="key"
              className="block text-sm font-medium text-gray-700"
            >
              {t("form.label.label_key")}
            </label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <input
                type="text"
                name="key"
                id="key"
                required
                pattern="^[a-z-_]+(?:\.[a-z-_]+)*$"
                className={`block w-full rounded-md  border-gray-300 pr-10  shadow-sm  focus:border-emerald-600 focus:outline-none  focus:ring-emerald-600 sm:text-sm ${
                  action?.fieldErrors?.key
                    ? "border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500"
                    : ""
                }`}
                placeholder={t("form.placeholder.label_key")}
                defaultValue={action?.fields.key}
                aria-invalid={Boolean(action?.fieldErrors?.key)}
                aria-describedby="key-description"
                aria-errormessage={
                  action?.fieldErrors?.key ? "key-error" : undefined
                }
              />
              {action?.fieldErrors?.key ? (
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <ExclamationCircleIcon
                    className="h-5 w-5 text-red-500"
                    aria-hidden="true"
                  />
                </div>
              ) : null}
            </div>
            {action?.fieldErrors?.key ? (
              <p className="mt-2 text-sm text-red-600" id="key-error">
                {action.fieldErrors.key}
              </p>
            ) : null}
            <p className="mt-2 text-sm text-gray-500" id="key-description">
              {t("form.hint.label_key")}
            </p>
          </div>
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              {t("form.label.label_description")}
            </label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <input
                type="text"
                name="description"
                id="description"
                className={`block w-full rounded-md  border-gray-300 pr-10  shadow-sm  focus:border-emerald-600 focus:outline-none  focus:ring-emerald-600 sm:text-sm ${
                  action?.fieldErrors?.description
                    ? "border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500"
                    : ""
                }`}
                placeholder={t("form.placeholder.label_description")}
                defaultValue={action?.fields.description}
                aria-invalid={Boolean(action?.fieldErrors?.description)}
                aria-describedby="description-description"
                aria-errormessage={
                  action?.fieldErrors?.description
                    ? "description-error"
                    : undefined
                }
              />
              {action?.fieldErrors?.description ? (
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <ExclamationCircleIcon
                    className="h-5 w-5 text-red-500"
                    aria-hidden="true"
                  />
                </div>
              ) : null}
            </div>
            {action?.fieldErrors?.description ? (
              <p className="mt-2 text-sm text-red-600" id="description-error">
                {action.fieldErrors.key}
              </p>
            ) : null}
            <p
              className="mt-2 text-sm text-gray-500"
              id="description-description"
            >
              {t("form.hint.label_description")}
            </p>
          </div>

          <button
            type="submit"
            className="inline-flex justify-center self-end rounded-md border border-transparent bg-emerald-700 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
          >
            {t("page.create_label.cta")}
          </button>
        </div>
      </Form>
    </div>
  );
}
