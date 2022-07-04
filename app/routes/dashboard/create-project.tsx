import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
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
      formError: "a project with this name already exists",
      fields,
    });
  }

  const project = await createProject(userId, name, uuid());

  return redirect(`/dashboard/${project.name}`);
};

export default function CreateProjectRoute() {
  const action = useActionData<ActionData>();

  return (
    <div>
      <h1>Create project</h1>
      {action?.formError ? <p role="alert">{action.formError}</p> : null}
      <Form method="post">
        <div>
          <label htmlFor="name">Project name</label>
          <input
            type="text"
            id="name"
            name="name"
            pattern="^[a-z0-9-]{3,}$"
            defaultValue={action?.fields.name}
            aria-invalid={Boolean(action?.fieldErrors?.name)}
            aria-errormessage={
              action?.fieldErrors?.name ? "name-error" : undefined
            }
          />
          <p>Use at least three lowercase letters, numbers, and dashes</p>
          {action?.fieldErrors?.name ? (
            <p id="name-error" role="alert">
              {action.fieldErrors.name}
            </p>
          ) : null}
        </div>
        <button type="submit">Create</button>
      </Form>
    </div>
  );
}
