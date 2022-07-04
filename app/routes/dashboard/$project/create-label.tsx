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
      <h1>Create label</h1>
      {action?.formError ? <p role="alert">{action.formError}</p> : null}
      <Form method="post">
        <div>
          <label htmlFor="key">Label key</label>
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
          />
          <p>
            Use lowercase letters, underscores and dashes, separated by dots
          </p>
          {action?.fieldErrors?.key ? (
            <p id="key-error" role="alert">
              {action.fieldErrors.key}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="description">Label description (optional)</label>
          <input
            type="text"
            id="description"
            name="description"
            defaultValue={action?.fields.description}
            aria-invalid={Boolean(action?.fieldErrors?.description)}
            aria-errormessage={
              action?.fieldErrors?.description ? "description-error" : undefined
            }
          />
          {action?.fieldErrors?.description ? (
            <p id="description-error" role="alert">
              {action.fieldErrors.description}
            </p>
          ) : null}
        </div>
        <button type="submit">Create</button>
      </Form>
    </div>
  );
}
