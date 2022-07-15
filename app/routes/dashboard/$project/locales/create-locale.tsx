import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";

import { db } from "~/lib/db.server";
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
  const userId = await requireUserId(request);
  const form = await request.formData();

  const name = form.get("name");

  if (typeof name !== "string") {
    return badRequest<ActionData>({
      formError: "invalid form data",
      fields: { name: "" },
    });
  }

  const project = await getProject(params.project as string);

  if (!project || project.userId !== userId) {
    throw notFound();
  }

  const fields = { name };
  const fieldErrors = {
    name: validateLocaleName(name),
  };

  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest<ActionData>({ fields, fieldErrors });
  }

  const existingLocale = await db.locale.findFirst({
    where: { AND: { projectId: project.id, name } },
  });

  if (existingLocale) {
    return badRequest<ActionData>({
      formError: "a locale with this name already exists",
      fields,
    });
  }

  await db.locale.create({ data: { projectId: project.id, name } });

  return redirect(`/dashboard/${project.name}/locales`);
};

export default function CreateProjectRoute() {
  const action = useActionData<ActionData>();

  return (
    <div>
      <h2 className="mb-2 text-2xl font-bold">Create locale</h2>
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
            Locale name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            pattern="^[a-z-_]+$"
            required
            defaultValue={action?.fields.name}
            aria-invalid={Boolean(action?.fieldErrors?.name)}
            aria-errormessage={
              action?.fieldErrors?.name ? "name-error" : undefined
            }
            placeholder="en-gb"
            className={`rounded-lg focus:outline-emerald-500 ${
              action?.fieldErrors?.name
                ? "ring-2 ring-red-600 focus:ring-red-600"
                : ""
            }`}
          />
          <p className="mt-1 text-sm text-gray-700">
            Use lowercase letters, underscores and dashes
          </p>
          {action?.fieldErrors?.name ? (
            <p
              id="name-error"
              role="alert"
              className="mt-2 font-semibold text-red-600"
            >
              {action.fieldErrors.name}
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
