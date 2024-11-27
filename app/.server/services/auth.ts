import { Authenticator } from "remix-auth";
import { FormStrategy } from "remix-auth-form";
import { selectUserId } from "../db-queries/users";
import { redirect } from "@remix-run/node";
import sessionStorage from "./session";

type User = {
  userId: string;
}[];

export const authenticator = new Authenticator<User>();

authenticator.use(
  new FormStrategy(async ({ form }) => {
    const userLogin = form.get('userLogin') as string;
    const password = form.get('password') as string;

    const user = await selectUserId(userLogin, password);

    return user;
  }),
  'user-login'
);

export async function isNotAuthenticated(request: Request) {
  let session = await sessionStorage.getSession(request.headers.get("cookie"));
  let user = session.get('loggedUser');
  if (!user) throw redirect("/login");
  return null;
}
