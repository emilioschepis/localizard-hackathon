import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";

import { db } from "~/lib/db.server";
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
  const userId = await requireUserId(request);
  const form = await request.formData();

  const key = form.get("key");
  const description = form.get("description");

  if (
    typeof key !== "string" ||
    (typeof description !== "undefined" && typeof description !== "string")
  ) {
    return badRequest<ActionData>({
      formError: "invalid form data",
      fields: { key: "", description: "" },
    });
  }

  const project = await getProject(params.project as string);

  if (!project || project.userId !== userId) {
    throw notFound();
  }

  const fields = { key, description };
  const fieldErrors = {
    key: validateLabelKey(key),
    description: description
      ? validateLabelDescription(description)
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
      formError: "a label with this key already exists",
      fields,
    });
  }

  const label = await createLabel(project.id, key, description);

  return redirect(`/dashboard/${project.name}/${label.id}`);
};

export default function CreateProjectRoute() {
  const action = useActionData<ActionData>();

  return (
    <div>
      <h2 className="mb-2 text-2xl font-bold">Create label</h2>
      {action?.formError ? (
        <p
          role="alert"
          className="my-2 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white"
        >
          {action.formError}
        </p>
      ) : null}
      <Form method="post">
        <div className="mb-4 flex flex-col">
          <label htmlFor="key" className="mb-1 text-sm font-semibold uppercase">
            Label key
          </label>
          <input
            type="text"
            id="key"
            name="key"
            pattern="^[a-z-_]+(?:\.[a-z-_]+)*$"
            required
            defaultValue={action?.fields.key}
            aria-invalid={Boolean(action?.fieldErrors?.key)}
            aria-errormessage={
              action?.fieldErrors?.key ? "key-error" : undefined
            }
            placeholder="your.key.name"
            className={`rounded-lg focus:outline-emerald-500 ${
              action?.fieldErrors?.key
                ? "ring-2 ring-red-600 focus:ring-red-600"
                : ""
            }`}
          />
          <p className="mt-1 text-sm text-gray-700">
            Use lowercase letters, underscores and dashes, separated by dots
          </p>
          {action?.fieldErrors?.key ? (
            <p
              id="key-error"
              role="alert"
              className="mt-2 font-semibold text-red-600"
            >
              {action.fieldErrors.key}
            </p>
          ) : null}
        </div>
        <div className="mb-4 flex flex-col">
          <label
            htmlFor="description"
            className="mb-1 text-sm font-semibold uppercase"
          >
            Label description (optional)
          </label>
          <input
            type="text"
            id="description"
            name="description"
            defaultValue={action?.fields.description}
            aria-invalid={Boolean(action?.fieldErrors?.description)}
            aria-errormessage={
              action?.fieldErrors?.description ? "description-error" : undefined
            }
            placeholder="This label is used..."
            className={`rounded-lg focus:outline-emerald-500 ${
              action?.fieldErrors?.key
                ? "ring-2 ring-red-600 focus:ring-red-600"
                : ""
            }`}
          />
          <p className="mt-1 text-sm text-gray-700">
            Optionally describe how the label is used inside the project to
            simplify the creation of translations
          </p>
          {action?.fieldErrors?.description ? (
            <p
              id="description-error"
              role="alert"
              className="mt-2 font-semibold text-red-600"
            >
              {action.fieldErrors.description}
            </p>
          ) : null}
        </div>
        <button
          type="submit"
          className="h-11 w-full rounded-lg bg-emerald-800 px-2 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          Create
        </button>
      </Form>
    </div>
  );
}
