import { EyeIcon, EyeOffIcon, KeyIcon } from "@heroicons/react/outline";
import type { LoaderFunction } from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react";
import { useState } from "react";

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
  const [show, setShow] = useState(false);

  return (
    <div className="py-4">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h2 className="text-xl font-semibold text-gray-900">API</h2>
          <p className="mt-2 text-sm text-gray-700">
            Use the credentials displayed in this page to access Localizard's
            REST API.
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-col">
        <div className="flex rounded-md shadow-sm">
          <div className="relative flex flex-grow items-stretch focus-within:z-10">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <KeyIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type={show ? "text" : "password"}
              value={data.key.key}
              contentEditable={false}
              className="block w-full rounded-none rounded-l-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <button
            type="button"
            className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            onClick={() => setShow((s) => !s)}
          >
            {show ? (
              <EyeOffIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            ) : (
              <EyeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            )}
            <span>{show ? "Hide" : "Show"}</span>
          </button>
        </div>
      </div>
      <div className="mt-6 sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h2 className="text-xl font-semibold text-gray-900">How to use</h2>
          <p className="mt-2 text-sm text-gray-700">
            These are the endpoints you can use to retrieve the labels in your
            projects. You need to set the <code>X-Api-Key</code> header with the
            key above.
          </p>

          <h3 className="mt-4 text-lg">Retrieve all languages</h3>
          <p className="mt-1 text-gray-700">
            <code>
              GET {data.baseUrl}/api/v1/projects/{params.project}
            </code>
          </p>

          <h3 className="mt-4 text-lg">Retrieve specific language</h3>
          <p className="mt-1 text-gray-700">
            <code>
              GET {data.baseUrl}/api/v1/projects/{params.project}/
              {data.key.project.locales[0]?.name ?? "en-gb"}
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
