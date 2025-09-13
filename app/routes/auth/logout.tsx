import { href, redirect } from "react-router";
import sessionStorage from "~/.server/services/session";
import authMiddleware from "~/.server/middleware/auth";

import type { Route } from "./+types/logout";

export const middleware: Route.MiddlewareFunction[] = [authMiddleware];

export function loader() {
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const session = await sessionStorage.getSession(
    request.headers.get("cookie"),
  );

  return redirect(href("/login"), {
    headers: { "Set-Cookie": await sessionStorage.destroySession(session) },
  });
}
