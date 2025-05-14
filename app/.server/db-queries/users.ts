import { db } from "../db";
import { Users } from "../schema";
import { eq, and } from "drizzle-orm";
import { createSelectSchema } from "drizzle-zod";

export async function selectUserId(userLogin: string, password: string) {
  const userId = await db
    .select({ userId: Users.userId })
    .from(Users)
    .where(and(eq(Users.useLogin, userLogin), eq(Users.password, password)));

  return userId;
}

export const userSelectSchema = createSelectSchema(Users);
