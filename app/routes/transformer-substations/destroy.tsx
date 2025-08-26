import { href, redirect } from "react-router";
import { deleteTransformerSubstation } from "~/.server/db-queries/transformer-substations";
import { isNotAuthenticated } from "~/.server/services/auth";

import type { Route } from "./+types/destroy";

export async function loader({ request }: Route.LoaderArgs) {
  return await isNotAuthenticated(request);
}

export const action = async ({ params }: Route.ActionArgs) => {
  await deleteTransformerSubstation(Number(params.id));

  return redirect(href("/"));
};
