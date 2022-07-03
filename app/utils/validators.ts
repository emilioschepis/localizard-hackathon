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
