export function validateEmail(email: unknown) {
  if (typeof email !== "string") {
    return "error.validation.email_string";
  }

  // TODO: Improve email validation
  if (!email.includes("@") || !email.includes(".")) {
    return "error.validation.email_valid";
  }
}

export function validatePassword(password: unknown) {
  if (typeof password !== "string") {
    return "error.validation.password_string";
  }

  if (password.length < 6) {
    return "error.validation.password_length";
  }
}

export function validateProjectName(name: unknown) {
  if (typeof name !== "string") {
    return "error.validation.project_name_string";
  }

  if (name.length < 3) {
    return "error.validation.project_name_length";
  }

  const expression = /^[a-z0-9-]{3,}$/;

  if (!expression.test(name)) {
    return "error.validation.project_name_valid";
  }
}

export function validateLabelKey(key: unknown) {
  if (typeof key !== "string") {
    return "error.validation.label_key_string";
  }

  const expression = /^[a-z-_]+(?:\.[a-z-_]+)*$/;

  if (!expression.test(key)) {
    return "error.validation.label_key_valid";
  }
}

export function validateLabelDescription(description: unknown) {
  if (typeof description !== "string") {
    return "error.validation.label_description_string";
  }
}

export function validateLocaleName(name: unknown) {
  if (typeof name !== "string") {
    return "error.validation.locale_name_string";
  }

  const expression = /^[a-z-_]+$/;

  if (!expression.test(name)) {
    return "error.validation.locale_name_valid";
  }
}
