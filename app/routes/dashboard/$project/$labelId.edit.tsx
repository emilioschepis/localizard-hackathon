import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";

import { db } from "~/lib/db.server";
import { requireUserId } from "~/lib/session.server";
import { getLabel, updateLabel } from "~/models/label.server";
import { getProject } from "~/models/project.server";
import type { FormActionData } from "~/types/types";
import { badRequest, notFound } from "~/utils/responses";
import { validateLabelDescription, validateLabelKey } from "~/utils/validators";

type Fields = { key: string; description?: string };
type ActionData = FormActionData<Fields>;

type LoaderData = {
  label: NonNullable<Awaited<ReturnType<typeof getLabel>>>;
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

  const label = await getLabel(params.labelId as string);

  if (!label) {
    throw notFound();
  }

  if (label.key === key) {
    // Only update the description
    await updateLabel(label.id, label.key, description);
  } else {
    // Also update the key
    // This requires verifying that the key is unique
    const existingLabel = await db.label.findFirst({
      where: { AND: { key, NOT: { id: label.id } } },
    });

    if (existingLabel) {
      return badRequest<ActionData>({
        formError: "a label with this key already exists",
        fields,
      });
    }

    await updateLabel(label.id, key, description);
  }

  return redirect(`/dashboard/${project.name}/${label.id}`);
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  const project = await getProject(params.project as string);

  if (!project || project.userId !== userId) {
    throw notFound();
  }

  const label = await getLabel(params.labelId as string);

  if (!label) {
    throw notFound();
  }

  return json({
    label,
  });
};

export default function LabelRoute() {
  const data = useLoaderData<LoaderData>();
  const action = useActionData<ActionData>();

  return (
    <div>
      <h1>Edit label</h1>
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
            defaultValue={action?.fields.key ?? data.label.key}
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
            defaultValue={
              action?.fields.description ?? data.label.description ?? undefined
            }
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
        <button type="submit">Update</button>
      </Form>
    </div>
  );
}
