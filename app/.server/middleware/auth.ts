import { href, redirect } from "react-router";
import { cookieSchema } from "~/routes/auth/zodLoginSchema";
import sessionStorage from "../services/session";

export default async function authMiddleware({
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore: TS7031
  request,
}): Promise<Response | undefined> {
  const session = await sessionStorage.getSession(
    // eslint-disable-next-line
    request.headers.get("cookie"),
  );

  const user = cookieSchema.safeParse(session.get("loggedUser"));

  // eslint-disable-next-line
  const url = request.url as string;
  const pathname = new URL(url).pathname.split("/")?.[1] as string | undefined;

  if (!user.success && pathname !== "login") return redirect(href("/login"));

  if (user.success && pathname === "login") return redirect(href("/"));
}
