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
    select: {
      id: true,
      key: true,
      description: true,
      project: {
        select: {
          userId: true,
          name: true,
          locales: {
            orderBy: { name: "asc" },
            select: {
              id: true,
              name: true,
              translations: {
                where: { labelId: id },
                take: 1,
                select: {
                  id: true,
                  value: true,
                },
              },
            },
          },
        },
      },
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

    for (const [key, value] of form) {
      if (!key.startsWith("locale.")) {
        // SKip non-locale keys
        continue;
      }

      const localeId = key.replace("locale.", "");

      if (typeof value !== "string") {
        continue;
      }

      const locale = label.project.locales.find(
        (locale) => locale.id === localeId
      );

      // Do not update non-existent locales
      if (!locale) {
        continue;
      }

      const translation = locale.translations[0];

      // Do not update translations that haven't changed
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

    return redirect(`dashboard/${label.project.name}`);
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
      <h2 className="text-2xl font-bold">{data.label.key}</h2>
      {data.label.description ? (
        <p>{data.label.description}</p>
      ) : (
        <p className="italic">no description</p>
      )}
      <Form method="post">
        <input type="hidden" name="intent" value="update" />
        {data.label.project.locales.map((locale) => {
          const translation = locale.translations[0]?.value;

          return (
            <div key={locale.id} className="my-4 flex flex-col">
              <label
                htmlFor={locale.id}
                className="mb-1 text-sm font-semibold uppercase"
              >
                {locale.name}
              </label>
              <input
                type="text"
                id={locale.id}
                name={`locale.${locale.id}`}
                defaultValue={translation}
                placeholder={`Translation for ${locale.name}`}
                className="rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          );
        })}
        <button
          type="submit"
          className="h-11 w-full rounded-lg bg-emerald-800 px-2 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          Update
        </button>
      </Form>
    </div>
  );
}
