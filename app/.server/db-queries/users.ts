import { db } from "../db";
import { users } from "../schema";
import { eq, and } from "drizzle-orm";
import { createSelectSchema } from "drizzle-zod";

export async function selectUserId(name: string, password: string) {
  const userId = await db
    .select({ userId: users.userId })
    .from(users)
    .where(and(eq(users.name, name), eq(users.password, password)));

  return userId;
}

const userSelectSchema = createSelectSchema(users);
export const userIdSchema = userSelectSchema.pick({ userId: true });
