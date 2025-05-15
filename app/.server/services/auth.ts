import { Authenticator } from "remix-auth";
import { FormStrategy } from "remix-auth-form";
import { selectUserId, userIdSchema } from "../db-queries/users";
import { redirect } from "react-router";
import sessionStorage from "./session";
import * as zod from "zod";
import { getValidatedFormData } from "remix-hook-form";
import type { FieldErrors } from "react-hook-form";
import type { FormData } from "~/routes/auth/zodLoginSchema";
import { resolver, cookieSchema } from "~/routes/auth/zodLoginSchema";

type UserId = zod.infer<typeof userIdSchema>;

type AuthType =
  | UserId["userId"]
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

    const userIdRow = await selectUserId(data.login, data.password);
    const parsedUserId = userIdSchema.safeParse(userIdRow[0]);

    if (parsedUserId.success) return parsedUserId.data.userId;

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
