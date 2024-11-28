import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import sessionStorage from "~/.server/services/session";
import { redirect } from "react-router";
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
