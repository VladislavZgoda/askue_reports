import { Authenticator } from "remix-auth";
import { FormStrategy } from "remix-auth-form";
import { getUserId } from "../db-queries/users";
import { redirect } from "react-router";
import sessionStorage from "./session";
import { getValidatedFormData } from "remix-hook-form";
import type { FieldErrors } from "react-hook-form";
import type { FormData } from "~/routes/auth/zodLoginSchema";
import { resolver, cookieSchema } from "~/routes/auth/zodLoginSchema";

type AuthType =
  | string
  | {
      errors: FieldErrors<FormData>;
      receivedValues: Partial<FormData>;
    };

export const authenticator = new Authenticator<AuthType>();

authenticator.use(
  new FormStrategy(async ({ request }) => {
    const { errors, data, receivedValues } =
      await getValidatedFormData<FormData>(request, resolver);

    if (errors) return { errors, receivedValues };

    const userId = await getUserId(data.login, data.password);

    if (userId) return userId;

    const customErrors = {
      login: {
        message: "Не верный логин/пароль",
        type: "validate",
        ref: undefined,
      },
      password: {
        message: "Не верный логин/пароль",
        type: "validate",
        ref: undefined,
      },
    };

    return {
      errors: customErrors,
      receivedValues,
    };
  }),
  "user-login",
);

export async function isNotAuthenticated(request: Request) {
  const session = await sessionStorage.getSession(
    request.headers.get("cookie"),
  );

  const user = cookieSchema.safeParse(session.get("loggedUser"));

  if (!user.success) return redirect("/login");

  return null;
}
