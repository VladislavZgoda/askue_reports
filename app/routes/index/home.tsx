import { isNotAuthenticated } from "~/.server/services/auth";
import type { Route } from "./+types/home";

export async function loader({ request }: Route.LoaderArgs) {
  return await isNotAuthenticated(request);
}

export default function Index() {
  return (
    null
  );
}
