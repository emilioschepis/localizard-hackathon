import { ExclamationCircleIcon } from "@heroicons/react/outline";
import type { ActionFunction } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { register } from "~/lib/auth.server";
import { db } from "~/lib/db.server";
import i18next from "~/lib/i18n.server";
import { createUserSession } from "~/lib/session.server";
import type { FormActionData } from "~/types/types";
import { badRequest } from "~/utils/responses";
import { sanitizeRedirectTo } from "~/utils/sanitizers";
import { validateEmail, validatePassword } from "~/utils/validators";

type Fields = { email: string; password: string };
type ActionData = FormActionData<Fields>;

export const action: ActionFunction = async ({ request }) => {
  const t = await i18next.getFixedT(request);
  const form = await request.formData();
  const email = form.get("email");
  const password = form.get("password");
  const redirectTo = sanitizeRedirectTo(form.get("redirectTo"), "/dashboard");

  if (typeof email !== "string" || typeof password !== "string") {
    return badRequest<ActionData>({
      formError: t("error.invalid_form_data"),
      fields: { email: "", password: "" },
    });
  }

  const fields = { email, password };
  const fieldErrors = {
    email: t(validateEmail(email) ?? ""),
    password: t(validatePassword(password) ?? ""),
  };

  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({ fields, fieldErrors });
  }

  const existingUser = await db.user.findFirst({ where: { email } });
  if (existingUser) {
    return badRequest<ActionData>({
      formError: t("error.auth.already_registered"),
      fields,
    });
  }

  const user = await register(email, password);

  return createUserSession({ userId: user.id, redirectTo });
};

export default function RegisterRoute() {
  const { t } = useTranslation();
  const action = useActionData<ActionData>();
  const [searchParams] = useSearchParams();

  return (
    <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {t("auth.register.prompt")}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t("generic.or")}{" "}
          <Link
            to="/login"
            className="font-medium text-emerald-600 hover:text-emerald-500"
          >
            {t("auth.register.login_prompt")}
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Form className="space-y-6" method="post">
            <input
              type="hidden"
              id="redirectTo"
              name="redirectTo"
              value={searchParams.get("redirectTo") ?? undefined}
            />
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                {t("form.label.email")}
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  autoComplete="email"
                  className={`block w-full rounded-md  border-gray-300 pr-10  shadow-sm  focus:border-emerald-600 focus:outline-none  focus:ring-emerald-600 sm:text-sm ${
                    action?.fieldErrors?.email
                      ? "border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                  placeholder={t("form.placeholder.email")}
                  defaultValue={action?.fields.email}
                  aria-invalid={Boolean(action?.fieldErrors?.email)}
                  aria-errormessage={
                    action?.fieldErrors?.email ? "email-error" : undefined
                  }
                />
                {action?.fieldErrors?.email ? (
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <ExclamationCircleIcon
                      className="h-5 w-5 text-red-500"
                      aria-hidden="true"
                    />
                  </div>
                ) : null}
              </div>
              {action?.fieldErrors?.email ? (
                <p className="mt-2 text-sm text-red-600" id="email-error">
                  {action.fieldErrors.email}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                {t("form.label.password")}
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <input
                  type="password"
                  name="password"
                  id="password"
                  required
                  autoComplete="new-password"
                  className={`block w-full rounded-md  border-gray-300 pr-10  shadow-sm  focus:border-emerald-600 focus:outline-none  focus:ring-emerald-600 sm:text-sm ${
                    action?.fieldErrors?.password
                      ? "border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                  placeholder={t("form.placeholder.new_password")}
                  defaultValue={action?.fields.password}
                  aria-invalid={Boolean(action?.fieldErrors?.password)}
                  aria-errormessage={
                    action?.fieldErrors?.password ? "password-error" : undefined
                  }
                />
                {action?.fieldErrors?.password ? (
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <ExclamationCircleIcon
                      className="h-5 w-5 text-red-500"
                      aria-hidden="true"
                    />
                  </div>
                ) : null}
              </div>
              {action?.fieldErrors?.password ? (
                <p className="mt-2 text-sm text-red-600" id="password-error">
                  {action.fieldErrors.password}
                </p>
              ) : null}
            </div>

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md border border-transparent bg-emerald-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                Register
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
