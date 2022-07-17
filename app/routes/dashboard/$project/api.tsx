import { Switch } from "@headlessui/react";
import {
  EyeIcon,
  EyeOffIcon,
  KeyIcon,
  LockClosedIcon,
  LockOpenIcon,
} from "@heroicons/react/outline";
import type { LoaderFunction } from "@remix-run/node";
import { useFetcher, useLoaderData, useParams } from "@remix-run/react";
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
          public: true,
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
  const fetcher = useFetcher();

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
              readOnly
              type={show ? "text" : "password"}
              value={data.key.key}
              className="block w-full rounded-none rounded-l-md border-gray-300 pl-10 focus:border-emerald-600 focus:ring-emerald-600 sm:text-sm"
            />
          </div>
          <button
            type="button"
            className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
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
        <div>
          <Switch.Group>
            <div className="mt-4 flex items-center">
              {data.key.project.public ? (
                <LockOpenIcon aria-hidden className="h-5 w-5 text-red-600" />
              ) : (
                <LockClosedIcon aria-hidden className="h-5 w-5 text-gray-700" />
              )}
              <Switch.Label className="mx-2 text-gray-700">
                Project is currently{" "}
                {data.key.project.public ? "public" : "private"}
              </Switch.Label>
              <Switch
                disabled={fetcher.state !== "idle"}
                checked={data.key.project.public}
                onChange={(value) => {
                  fetcher.submit(
                    { setPublic: `${value}` },
                    {
                      method: "post",
                      action: `/dashboard/${params.project}/api/set-public`,
                    }
                  );
                }}
                className={`${
                  data.key.project.public ? "bg-emerald-600" : "bg-gray-200"
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2`}
              >
                <span
                  className={`${
                    data.key.project.public ? "translate-x-6" : "translate-x-1"
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch>
            </div>
          </Switch.Group>
        </div>
      </div>
      <div className="mt-4 sm:flex sm:items-center">
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
