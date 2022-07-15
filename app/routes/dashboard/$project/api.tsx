import type { LoaderFunction } from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react";

import { db } from "~/lib/db.server";
import { requireUserId } from "~/lib/session.server";
import { notFound } from "~/utils/responses";

type LoaderData = {
  key: NonNullable<Awaited<ReturnType<typeof getApiKey>>>;
  baseUrl: string;
};

async function getApiKey(projectName: string) {
  return db.apiKey.findFirst({
    where: {
      project: {
        name: projectName,
      },
    },
    select: {
      key: true,
      updatedAt: true,
      project: {
        select: {
          userId: true,
          locales: {
            select: {
              name: true,
            },
            take: 1,
          },
        },
      },
    },
  });
}

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  const apiKey = await getApiKey(params.project as string);

  if (!apiKey || apiKey.project.userId !== userId) {
    throw notFound();
  }

  return {
    key: apiKey,
    baseUrl: new URL(request.url).origin,
  };
};

export default function ApiRoute() {
  const params = useParams();
  const data = useLoaderData<LoaderData>();

  return (
    <div>
      <h2 className="mb-2 text-2xl font-bold">API key</h2>
      <details>
        <summary>Your API key for this project</summary>
        <div className="my-1 rounded-md bg-white p-2">
          <code>{data.key.key}</code>
        </div>
      </details>
      <p className="mt-1 text-sm text-gray-700">
        To make requests to the Localizard REST API, you must include this API
        key in the <code>X-Api-Key</code> header.
        <br />
        This key was updated on{" "}
        <time dateTime={new Date(data.key.updatedAt).toISOString()}>
          {new Date(data.key.updatedAt).toLocaleString()}
        </time>
      </p>
      <h3 className="mt-2 mb-1 text-xl font-semibold">
        Request all the project&apos;s labels
      </h3>
      <pre>
        {data.baseUrl}/api/v1/projects/{params.project}
      </pre>
      <h3 className="mt-2 mb-1 text-xl font-semibold">
        Request the project&apos;s labels for a specific locale
      </h3>
      <pre>
        {data.baseUrl}/api/v1/projects/{params.project}/
        {data.key.project.locales[0]?.name ?? "en"}
      </pre>
    </div>
  );
}
