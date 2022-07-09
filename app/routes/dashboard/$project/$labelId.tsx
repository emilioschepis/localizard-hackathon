import type { PrismaPromise } from "@prisma/client";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";

import { db } from "~/lib/db.server";
import { requireUserId } from "~/lib/session.server";
import { badRequest, notFound } from "~/utils/responses";

type LoaderData = {
  label: NonNullable<Awaited<ReturnType<typeof getLabel>>>;
};

async function getLabel(id: string) {
  return db.label.findUnique({
    where: { id },
    include: {
      project: { include: { locales: true } },
      translations: true,
    },
  });
}

export const action: ActionFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  const label = await getLabel(params.labelId as string);

  if (!label || label.project.userId !== userId) {
    throw notFound();
  }

  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "update") {
    const operations: Array<PrismaPromise<any>> = [];

    for (const [localeId, value] of form) {
      if (localeId === "intent") {
        // Skip the intent key
        continue;
      }

      if (typeof value !== "string") {
        continue;
      }

      // Do not update non-existent locales
      if (!label.project.locales.some((locale) => locale.id === localeId)) {
        continue;
      }

      // Do not update translations that haven't changed
      const translation = label.translations.find(
        (t) => t.localeId === localeId
      );
      if (translation && translation.value === value) {
        continue;
      }

      if (translation) {
        operations.push(
          db.translation.update({
            where: { id: translation.id },
            data: { value },
          })
        );
      } else {
        operations.push(
          db.translation.create({
            data: { labelId: label.id, localeId, value },
          })
        );
      }
    }

    await db.$transaction(operations);

    return new Response("OK", { status: 200 });
  }

  if (intent === "delete") {
    await db.label.delete({ where: { id: label.id } });

    return redirect(`dashboard/${label.project.name}`);
  }

  throw badRequest({});
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  const label = await getLabel(params.labelId as string);

  if (!label || label.project.userId !== userId) {
    throw notFound();
  }

  return { label };
};

export default function LabelRoute() {
  const data = useLoaderData<LoaderData>();

  return (
    <div>
      <h1>{data.label.key}</h1>
      <p>{data.label.description || <em>no description</em>}</p>
      <h2>Translations</h2>
      <Form method="post" replace>
        <input type="hidden" name="intent" value="update" />

        {data.label.project.locales.map((locale) => {
          const translation = data.label.translations.find(
            (t) => t.localeId === locale.id
          );

          return (
            <div key={locale.id}>
              <label htmlFor={locale.id}>{locale.name}</label>
              <input
                type="text"
                id={locale.id}
                name={locale.id}
                defaultValue={translation?.value}
              />
            </div>
          );
        })}
        <button type="submit">Update</button>
      </Form>
      <Form method="post">
        <input type="hidden" name="intent" value="delete" />
        <button type="submit">Delete</button>
      </Form>
    </div>
  );
}
