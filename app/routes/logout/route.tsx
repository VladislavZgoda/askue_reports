import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticator } from "~/.server/services/auth";

export async function action({ request }: ActionFunctionArgs) {
  await authenticator.logout(request, { redirectTo: "/login" });
}