import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { v4 as uuid } from "uuid";

import { db } from "~/lib/db.server";
import { requireUserId } from "~/lib/session.server";
import { badRequest, notFound } from "~/utils/responses";

type LoaderData = {
  project: NonNullable<Awaited<ReturnType<typeof getProject>>>;
};

async function getProject(name: string) {
  return db.project.findUnique({
    where: { name },
    select: {
      id: true,
      name: true,
      userId: true,
      apiKey: {
        select: {
          key: true,
        },
      },
      locales: {
        select: {
          id: true,
          name: true,
        },
      },
      labels: {
        select: {
          id: true,
          key: true,
          description: true,
          translations: {
            select: {
              id: true,
              localeId: true,
              value: true,
            },
          },
        },
      },
    },
  });
}

export const action: ActionFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  const form = await request.formData();

  const intent = form.get("intent");

  const project = await getProject(params.project as string);
  if (!project || project.userId !== userId) {
    throw notFound();
  }

  if (intent === "regenerate-api-key") {
    await db.apiKey.upsert({
      where: { projectId: project.id },
      create: {
        projectId: project.id,
        key: uuid(),
      },
      update: {
        key: uuid(),
      },
    });

    return new Response("OK", { status: 200 });
  }

  throw badRequest({});
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  const project = await getProject(params.project as string);

  if (!project || project.userId !== userId) {
    throw notFound();
  }

  return {
    project,
  };
};

export default function ProjectRoute() {
  const data = useLoaderData<LoaderData>();

  return (
    <div>
      <h1>{data.project.name}</h1>
      <details>
        <summary>Api Key</summary>
        {data.project.apiKey ? <code>{data.project.apiKey.key}</code> : null}
        <Form method="post" replace>
          <input type="hidden" name="intent" value="regenerate-api-key" />
          <button type="submit">Regenerate</button>
        </Form>
      </details>
      <h2>Labels</h2>
      <table>
        <thead>
          <tr>
            <th>key</th>
            <th>description</th>
            {data.project.locales.map((locale) => (
              <th key={locale.id}>{locale.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.project.labels.map((label) => (
            <tr key={label.id}>
              <td>
                <Link to={label.id}>{label.key}</Link>
              </td>
              <td>{label.description ?? "-"}</td>
              {data.project.locales.map((locale) => {
                const translation = label.translations.find(
                  (t) => t.localeId === locale.id
                );

                return <td key={label.id + locale.id}>{translation?.value}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Locales</h2>
      <ul>
        {data.project.locales.map((locale) => (
          <li key={locale.id}>{locale.name}</li>
        ))}
        <li>
          <Link to="create-locale">Create locale</Link>
        </li>
      </ul>

      <Link to="create-label">Create label</Link>
    </div>
  );
}
