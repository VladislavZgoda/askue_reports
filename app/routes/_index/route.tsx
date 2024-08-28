import type { LoaderFunctionArgs } from "@remix-run/node";
import { isNotAuthenticated } from "~/.server/services/auth";

export async function loader({ request }: LoaderFunctionArgs) {
  return await isNotAuthenticated(request);
}

export default function Index() {
  return (
    null
  );
}
