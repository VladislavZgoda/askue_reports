import { db } from "../db";
import { users } from "../schema";
import { eq, and } from "drizzle-orm";

export async function getUserId(
  name: string,
  password: string,
): Promise<string | undefined> {
  const result = await db.query.users.findFirst({
    columns: {
      userId: true,
    },
    where: and(eq(users.name, name), eq(users.password, password)),
  });

  return result?.userId;
}
