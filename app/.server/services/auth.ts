import { Authenticator } from "remix-auth";
import { sessionStorage } from "./session";
import { FormStrategy } from "remix-auth-form";
import { selectUserId } from "../db-queries/users";

export const authenticator = new Authenticator<string>(sessionStorage);

authenticator.use(
  new FormStrategy(async ({ form }) => {
    const userLogin = form.get('userLogin') as string;
    const password = form.get('password') as string;

    const user = await selectUserId(userLogin, password);

    return user[0]?.userId;
  }),
  'user-login'
);
