import type {
  LinksFunction,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { useChangeLanguage } from "remix-i18next";

import i18next from "./lib/i18n.server";
import tailwind from "./styles/tailwind.css";

type LoaderData = { locale: string };

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Localizard",
  viewport: "width=device-width,initial-scale=1",
});

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: tailwind }];
};

export let loader: LoaderFunction = async ({ request }) => {
  const locale = await i18next.getLocale(request);
  return json<LoaderData>({ locale });
};

export default function App() {
  const data = useLoaderData<LoaderData>();
  const { i18n } = useTranslation();

  useChangeLanguage(data.locale);

  return (
    <html lang={data.locale} dir={i18n.dir()} className="h-full bg-gray-100">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
