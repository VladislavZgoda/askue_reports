import { href, redirect } from "react-router";
import { cookieSchema } from "~/routes/auth/zodLoginSchema";
import sessionStorage from "../services/session";

export default async function authMiddleware({
  request,
}: {
  request: Request;
}): Promise<Response | undefined> {
  const session = await sessionStorage.getSession(
    request.headers.get("cookie"),
  );

  const user = cookieSchema.safeParse(session.get("loggedUser"));

  const url = request.url;
  const pathname = new URL(url).pathname.split("/")?.[1] as string | undefined;

  if (!user.success && pathname !== "login") return redirect(href("/login"));

  if (user.success && pathname === "login") return redirect(href("/"));
}
