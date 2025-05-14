import { Authenticator } from "remix-auth";
import { FormStrategy } from "remix-auth-form";
import { selectUserId, userSelectSchema } from "../db-queries/users";
import { redirect } from "react-router";
import sessionStorage from "./session";
import * as zod from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getValidatedFormData } from "remix-hook-form";
import type { FieldErrors } from "react-hook-form";

type User = {
  userId: string;
}[];

const schema = zod.object({
  login: zod.string().min(1),
  password: zod.string().min(1),
});

export type FormData = zod.infer<typeof schema>;

export const resolver = zodResolver(schema);
export const authenticator = new Authenticator<User | FieldErrors<FormData>>();

authenticator.use(
  new FormStrategy(async ({ request }) => {
    const { errors, data } = await getValidatedFormData<FormData>(
      request,
      resolver,
    );

    if (errors) return errors;

    const user = await selectUserId(data.login, data.password);
    const userId: { userId: string } = userSelectSchema.parse(user[0]);

    return user;
  }),
  "user-login",
);

export async function isNotAuthenticated(request: Request) {
  const session = await sessionStorage.getSession(
    request.headers.get("cookie"),
  );

  const user = session.get("loggedUser") as string | undefined;

  if (!user) return redirect("/login");

  return null;
}
