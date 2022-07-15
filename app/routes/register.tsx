import type { ActionFunction } from "@remix-run/node";
import { Form, useActionData, useSearchParams } from "@remix-run/react";

import { register } from "~/lib/auth.server";
import { db } from "~/lib/db.server";
import { createUserSession } from "~/lib/session.server";
import type { FormActionData } from "~/types/types";
import { badRequest } from "~/utils/responses";
import { sanitizeRedirectTo } from "~/utils/sanitizers";
import { validateEmail, validatePassword } from "~/utils/validators";

type Fields = { email: string; password: string };
type ActionData = FormActionData<Fields>;

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  const email = form.get("email");
  const password = form.get("password");
  const redirectTo = sanitizeRedirectTo(form.get("redirectTo"), "/dashboard");

  if (typeof email !== "string" || typeof password !== "string") {
    return badRequest<ActionData>({
      formError: "invalid form data",
      fields: { email: "", password: "" },
    });
  }

  const fields = { email, password };
  const fieldErrors = {
    email: validateEmail(email),
    password: validatePassword(password),
  };

  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({ fields, fieldErrors });
  }

  const existingUser = await db.user.findFirst({ where: { email } });
  if (existingUser) {
    return badRequest<ActionData>({
      formError: "an account with this email already exists",
      fields,
    });
  }

  const user = await register(email, password);

  return createUserSession({ userId: user.id, redirectTo });
};

export default function RegisterRoute() {
  const action = useActionData<ActionData>();
  const [searchParams] = useSearchParams();

  return (
    <div className="flex h-screen items-start justify-center bg-gray-100 p-4">
      <div className="rounded-lg bg-white p-4">
        <h1 className="mb-1 text-xl font-bold">Register</h1>
        <p className="mb-2 text-sm text-gray-700">
          Welcome to Localizard.
          <br />
          Create an account now and start working on your localization labels.
        </p>
        {action?.formError ? (
          <p
            role="alert"
            className="my-2 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white"
          >
            {action.formError}
          </p>
        ) : null}
        <Form method="post">
          <input
            type="hidden"
            id="redirectTo"
            name="redirectTo"
            value={searchParams.get("redirectTo") ?? undefined}
          />
          <div className="mb-4 flex flex-col">
            <label
              htmlFor="email"
              className="mb-1 text-sm font-semibold uppercase"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              autoComplete="username"
              defaultValue={action?.fields.email}
              aria-invalid={Boolean(action?.fieldErrors?.email)}
              aria-errormessage={
                action?.fieldErrors?.email ? "email-error" : undefined
              }
              className={`rounded-lg focus:outline-emerald-500 ${
                action?.fieldErrors?.email
                  ? "ring-2 ring-red-600 focus:ring-red-600"
                  : ""
              }`}
              placeholder="you@email.com"
            />
            {action?.fieldErrors?.email ? (
              <p
                id="email-error"
                role="alert"
                className="mt-2 font-semibold text-red-600"
              >
                {action.fieldErrors.email}
              </p>
            ) : null}
          </div>
          <div className="mb-4 flex flex-col">
            <label
              htmlFor="password"
              className="mb-1 text-sm font-semibold uppercase"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              autoComplete="new-password"
              defaultValue={action?.fields.password}
              aria-invalid={Boolean(action?.fieldErrors?.password)}
              aria-errormessage={
                action?.fieldErrors?.password ? "password-error" : undefined
              }
              className={`rounded-lg focus:outline-emerald-500 ${
                action?.fieldErrors?.password
                  ? "ring-2 ring-red-600 focus:ring-red-600"
                  : ""
              }`}
              placeholder="your password"
            />
            {action?.fieldErrors?.password ? (
              <p
                id="password-error"
                role="alert"
                className="mt-2 font-semibold text-red-600"
              >
                {action.fieldErrors.password}
              </p>
            ) : null}
          </div>
          <button
            type="submit"
            className="h-11 w-full rounded-lg bg-emerald-800 px-2 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-emerald-700 focus:outline-emerald-500"
          >
            Register
          </button>
        </Form>
      </div>
    </div>
  );
}
