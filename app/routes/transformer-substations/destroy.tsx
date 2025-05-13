import { redirect } from "react-router";
import { deleteTransSub } from "~/.server/db-queries/transformerSubstationTable";
import { isNotAuthenticated } from "~/.server/services/auth";
import type { Route } from "./+types/destroy";

export async function loader({ request }: Route.LoaderArgs) {
  return await isNotAuthenticated(request);
}

export const action = async ({ params }: Route.ActionArgs) => {
  await deleteTransSub(params.id);
  return redirect("/");
};
