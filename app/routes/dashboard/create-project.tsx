import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { useEffect, useRef } from "react";
import { v4 as uuid } from "uuid";

import { db } from "~/lib/db.server";
import { requireUserId } from "~/lib/session.server";
import { createProject } from "~/models/project.server";
import type { FormActionData } from "~/types/types";
import { badRequest } from "~/utils/responses";
import { validateProjectName } from "~/utils/validators";

type Fields = { name: string };
type ActionData = FormActionData<Fields>;

export const loader: LoaderFunction = async ({ request }) => {
  await requireUserId(request);
  return json(null);
};

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const form = await request.formData();

  const name = form.get("name");

  if (typeof name !== "string") {
    return badRequest<ActionData>({
      formError: "invalid form data",
      fields: { name: "" },
    });
  }

  const fields = { name };
  const fieldErrors = {
    name: validateProjectName(name),
  };

  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest<ActionData>({ fields, fieldErrors });
  }

  const existingProject = await db.project.findFirst({ where: { name } });
  if (existingProject) {
    return badRequest<ActionData>({
      fieldErrors: { name: "a project with this name already exists" },
      fields,
    });
  }

  const project = await createProject(userId, name, uuid());

  return redirect(`/dashboard/${project.name}`);
};

export default function CreateProjectRoute() {
  const action = useActionData<ActionData>();
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (action?.fieldErrors?.name) {
      nameRef.current?.focus();
    }
  }, [action?.fieldErrors?.name]);

  return (
    <div>
      <h1 className="text-3xl font-bold">Create project</h1>
      {action?.formError ? (
        <p
          role="alert"
          className="my-2 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white"
        >
          {action.formError}
        </p>
      ) : null}
      <Form method="post">
        <div className="my-2 flex flex-col">
          <label
            htmlFor="name"
            className="mb-1 text-sm font-semibold uppercase"
          >
            Project name
          </label>
          <input
            ref={nameRef}
            type="text"
            id="name"
            name="name"
            required
            minLength={3}
            pattern="^[a-z0-9-]{3,}$"
            defaultValue={action?.fields.name}
            aria-invalid={Boolean(action?.fieldErrors?.name)}
            aria-errormessage={
              action?.fieldErrors?.name ? "name-error" : undefined
            }
            placeholder="my-project"
            className={`rounded-lg focus:outline-emerald-500 ${
              action?.fieldErrors?.name
                ? "ring-2 ring-red-600 focus:ring-red-600"
                : ""
            }`}
          />
          {action?.fieldErrors?.name ? (
            <p
              id="name-error"
              role="alert"
              className="mt-2 font-semibold text-red-600"
            >
              {action.fieldErrors.name}
            </p>
          ) : null}

          <p className="font-sm mt-2 italic text-gray-800">
            Use at least three lowercase letters, numbers, and dashes. You
            won&apos;t be able to change it later.
          </p>
        </div>
        <button
          type="submit"
          className="h-11 w-full rounded-lg bg-emerald-800 px-2 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-emerald-700 focus:outline-emerald-500"
        >
          Create
        </button>
      </Form>
    </div>
  );
}
