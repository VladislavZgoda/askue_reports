import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticator } from "~/.server/services/auth";

export async function loader({ request }: LoaderFunctionArgs) {
  return await authenticator.isAuthenticated(request, {
    failureRedirect: "/login"
  });
}

export default function Index() {
  return (
    null
  );
}
