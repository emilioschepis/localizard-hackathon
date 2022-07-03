import bcrypt from "bcryptjs";

import { db } from "./db.server";

export async function login(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return null;
  }

  const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordsMatch) {
    return null;
  }

  return { id: user.id };
}

export async function register(email: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await db.user.create({ data: { email, passwordHash } });

  return { id: user.id };
}
