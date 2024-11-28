import type { LoaderFunctionArgs } from "react-router";
import { isNotAuthenticated } from "~/.server/services/auth";

export async function loader({ request }: LoaderFunctionArgs) {
  return await isNotAuthenticated(request);
}

export default function Index() {
  return (
    null
  );
}
