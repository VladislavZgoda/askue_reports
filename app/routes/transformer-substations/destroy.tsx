import { href, redirect } from "react-router";

import authMiddleware from "~/.server/middleware/auth";
import { deleteTransformerSubstation } from "~/.server/db-queries/transformer-substations";

import type { Route } from "./+types/destroy";

export const middleware: Route.MiddlewareFunction[] = [authMiddleware];

export function loader() {
  return null;
}

export const action = async ({ params }: Route.ActionArgs) => {
  await deleteTransformerSubstation(Number(params.id));

  return redirect(href("/"));
};
