export function sanitizeRedirectTo(
  redirectTo: unknown,
  defaultValue: string = "/"
): string {
  if (typeof redirectTo !== "string") {
    return defaultValue;
  }

  if (!redirectTo.startsWith("/")) {
    return defaultValue;
  }

  return redirectTo;
}
