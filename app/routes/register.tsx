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
  const redirectTo = sanitizeRedirectTo(form.get("redirectTo"));

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
    <div>
      <h1>Register</h1>
      {action?.formError ? <p role="alert">{action.formError}</p> : null}
      <Form method="post">
        <input
          type="hidden"
          id="redirectTo"
          name="redirectTo"
          value={searchParams.get("redirectTo") ?? undefined}
        />
        <div>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            defaultValue={action?.fields.email}
            aria-invalid={Boolean(action?.fieldErrors?.email)}
            aria-errormessage={
              action?.fieldErrors?.email ? "email-error" : undefined
            }
          />
          {action?.fieldErrors?.email ? (
            <p id="email-error" role="alert">
              {action.fieldErrors.email}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            defaultValue={action?.fields.password}
            aria-invalid={Boolean(action?.fieldErrors?.password)}
            aria-errormessage={
              action?.fieldErrors?.password ? "password-error" : undefined
            }
          />
          {action?.fieldErrors?.password ? (
            <p id="password-error" role="alert">
              {action.fieldErrors.password}
            </p>
          ) : null}
        </div>
        <button type="submit">Register</button>
      </Form>
    </div>
  );
}
