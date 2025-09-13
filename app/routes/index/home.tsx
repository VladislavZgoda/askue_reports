import authMiddleware from "~/.server/middleware/auth";

import type { Route } from "./+types/home";

export const middleware: Route.MiddlewareFunction[] = [authMiddleware];

export function loader() {
  return null;
}

export default function Index() {
  return null;
}
