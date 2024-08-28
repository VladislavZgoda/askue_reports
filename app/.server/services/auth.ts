import { Authenticator, AuthorizationError } from "remix-auth";
import { sessionStorage } from "./session";
import { FormStrategy } from "remix-auth-form";
import { selectUserId } from "../db-queries/users";

export const authenticator = new Authenticator<string>(sessionStorage, {
  throwOnError: true
});

authenticator.use(
  new FormStrategy(async ({ form }) => {
    const userLogin = form.get('userLogin') as string;
    const password = form.get('password') as string;

    const user = await selectUserId(userLogin, password);

    if (!user[0]?.userId) {
      throw new AuthorizationError("Не верный логин/пароль", {
        name: "userNotFound",
        message: "user doesn't exist",
        cause: "userNotFound",
      });
    }

    return user[0].userId;
  }),
  'user-login'
);

export async function isNotAuthenticated(request: Request) {
  await authenticator.isAuthenticated(request, {
    failureRedirect: "/login"
  });
}
