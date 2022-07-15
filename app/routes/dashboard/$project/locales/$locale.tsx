import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";

import { db } from "~/lib/db.server";
import { requireUserId } from "~/lib/session.server";
import { notFound } from "~/utils/responses";

type LoaderData = {
  locale: NonNullable<Awaited<ReturnType<typeof getLocale>>>;
};

async function getLocale(name: string, projectName: string) {
  return db.locale.findFirst({
    where: { AND: { name, project: { name: projectName } } },
    select: {
      id: true,
      name: true,
      translations: {
        select: {
          id: true,
        },
      },
      project: {
        select: {
          userId: true,
        },
      },
    },
  });
}

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  const locale = await getLocale(
    params.locale as string,
    params.project as string
  );

  if (!locale || locale.project.userId !== userId) {
    throw notFound();
  }

  return json<LoaderData>({
    locale,
  });
};

export const action: ActionFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  const locale = await getLocale(
    params.locale as string,
    params.project as string
  );

  if (!locale || locale.project.userId !== userId) {
    throw notFound();
  }

  await db.locale.delete({
    where: {
      id: locale.id,
    },
  });

  return redirect(`/dashboard/${params.project}/locales`);
};

export default function LocaleRoute() {
  const data = useLoaderData<LoaderData>();

  return (
    <div className="flex flex-col">
      <h2 className="text-2xl font-bold">{data.locale.name}</h2>
      <p className="my-2">{data.locale.translations.length} translations</p>
      <Form method="post">
        <input type="hidden" name="intent" value="delete" />
        <button
          type="submit"
          className="h-11 w-full rounded-lg bg-red-700 px-2 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-red-700 focus:outline-emerald-500"
        >
          Delete
        </button>
      </Form>
    </div>
  );
}
