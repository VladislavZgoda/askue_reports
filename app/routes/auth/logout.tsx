import type { Route } from "./+types/logout";
import sessionStorage from "~/.server/services/session";
import { href, redirect } from "react-router";
import { isNotAuthenticated } from "~/.server/services/auth";

export async function loader({ request }: Route.LoaderArgs) {
  return await isNotAuthenticated(request);
}

export async function action({ request }: Route.ActionArgs) {
  const session = await sessionStorage.getSession(
    request.headers.get("cookie"),
  );

  return redirect(href("/login"), {
    headers: { "Set-Cookie": await sessionStorage.destroySession(session) },
  });
}
