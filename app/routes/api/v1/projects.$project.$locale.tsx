import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";

import { db } from "~/lib/db.server";
import { notFound, unauthorized } from "~/utils/responses";

async function getProject(name: string, locale: string) {
  return db.project.findUnique({
    where: { name },
    include: {
      apiKey: true,
      locales: {
        where: {
          name: locale,
        },
        select: {
          translations: {
            where: {
              locale: {
                name: locale,
              },
            },
            select: {
              value: true,
              label: {
                select: {
                  key: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

export const loader: LoaderFunction = async ({ request, params }) => {
  const apiKey = request.headers.get("X-Api-Key");
  if (typeof apiKey !== "string") {
    throw unauthorized();
  }

  const project = await getProject(
    params.project as string,
    params.locale as string
  );

  if (!project || project.apiKey?.key !== apiKey) {
    throw notFound();
  }

  if (project.locales.length === 0) {
    throw notFound();
  }

  const locale = project.locales[0];

  const translations = locale.translations.reduce(
    (loc, trans) => ({ ...loc, [trans.label.key]: trans.value }),
    {}
  );

  return json({
    project: {
      name: project.name,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      translations,
    },
  });
};
