import { redirect } from "react-router";
import invariant from "tiny-invariant";
import { deleteTransSub } from "~/.server/db-queries/transformerSubstationTable";
import { isNotAuthenticated } from "~/.server/services/auth";
import type { Route } from "./+types/destroy";

export async function loader({ request }: Route.LoaderArgs) {
  return await isNotAuthenticated(request);
}

export const action = async ({
  params,
}: Route.ActionArgs) => {
  invariant(params.id, 'Missing id param');
  await deleteTransSub(params.id);
  return redirect('/');
};
