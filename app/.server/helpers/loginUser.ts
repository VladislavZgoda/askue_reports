import { selectUserId } from "../db-queries/users";

export default async function loginUser(
  userLogin: string, password: string
) {
  const userId = await selectUserId(userLogin, password);

  return userId[0].userId;
}
