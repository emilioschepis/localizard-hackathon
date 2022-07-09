export function validateEmail(email: unknown) {
  if (typeof email !== "string") {
    return "email must be a string";
  }

  // TODO: Improve email validation
  if (!email.includes("@") || !email.includes(".")) {
    return "email must be valid";
  }
}

export function validatePassword(password: unknown) {
  if (typeof password !== "string") {
    return "password must be a string";
  }

  if (password.length < 6) {
    return "password is too weak";
  }
}

export function validateProjectName(name: unknown) {
  if (typeof name !== "string") {
    return "project name must be a string";
  }

  if (name.length < 3) {
    return "project name is too short";
  }

  const expression = /^[a-z0-9-]{3,}$/;

  if (!expression.test(name)) {
    return "project name must be lowercase letters, numbers, and dashes";
  }
}

export function validateLabelKey(key: unknown) {
  if (typeof key !== "string") {
    return "label key must be a string";
  }

  const expression = /^[a-z-_]+(?:\.[a-z-_]+)*$/;

  if (!expression.test(key)) {
    return "label key must be lowercase letters, underscores and dashes, separated by dots";
  }
}

export function validateLabelDescription(description: unknown) {
  if (typeof description !== "string") {
    return "label description must be a string";
  }
}

export function validateLocaleName(name: unknown) {
  if (typeof name !== "string") {
    return "locale name must be a string";
  }

  const expression = /^[a-z-_]+$/;

  if (!expression.test(name)) {
    return "locale name must be lowercase letters, underscores and dashes";
  }
}
