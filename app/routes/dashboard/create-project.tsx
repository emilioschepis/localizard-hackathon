import { ExclamationCircleIcon } from "@heroicons/react/outline";
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
    <div className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">
              Create project
            </h1>
          </div>
        </div>
      </div>
      <div className="mx-auto my-6 max-w-7xl px-4 sm:px-6 md:px-8">
        <Form method="post">
          <div className="flex flex-col">
            <div className="mb-4">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Name
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  minLength={3}
                  pattern="^[a-z0-9-]{3,}$"
                  className={`block w-full rounded-md  border-gray-300 pr-10  shadow-sm  focus:border-emerald-600 focus:outline-none  focus:ring-emerald-600 sm:text-sm ${
                    action?.fieldErrors?.name
                      ? "border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                  placeholder="my-project"
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
                Use at least three lowercase letters, numbers, and dashes. You
                won&apos;t be able to change it later.
              </p>
            </div>
            <button
              type="submit"
              className="inline-flex justify-center self-end rounded-md border border-transparent bg-emerald-700 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
            >
              Create
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
