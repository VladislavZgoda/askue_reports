import { redirect } from "react-router";
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

  if (!user.success) return redirect("/login");
}
