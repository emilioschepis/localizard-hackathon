import { json } from "@remix-run/node";

export function badRequest<T>(data: T) {
  return json<T>(data, { status: 400 });
}

export function notFound() {
  return new Response("Not Found", { status: 404 });
}
