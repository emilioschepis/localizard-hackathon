export function stringToNestedObject(
  elements: Record<string, string>
): Record<string, any> {
  const output: Record<string, any> = {};

  for (const key in elements) {
    const parts = key.split(".");

    let local = output;
    while (parts.length > 1) {
      const part = parts.shift()!;

      local = local[part] = local[part] || {};
    }

    local[parts[0]] = elements[key];
  }

  return output;
}
