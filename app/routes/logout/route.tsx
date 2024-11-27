import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import sessionStorage from "~/.server/services/session";
import { redirect } from "@remix-run/node";
import { isNotAuthenticated } from "~/.server/services/auth";

export async function loader({ request }: LoaderFunctionArgs) {
  return await isNotAuthenticated(request);
}

export async function action({ request }: ActionFunctionArgs) {
  let session = await sessionStorage.getSession(request.headers.get("cookie"));
  return redirect("/login", {
    headers: { "Set-Cookie": await sessionStorage.destroySession(session) },
  });
}
