import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import invariant from "tiny-invariant";
import { deleteTransSub } from "~/.server/db-queries/transformerSubstationTable";
import { isNotAuthenticated } from "~/.server/services/auth";

export async function loader({ request }: LoaderFunctionArgs) {
  return await isNotAuthenticated(request);
}

export const action = async ({
  params,
}: ActionFunctionArgs) => {
  invariant(params.transSubId, 'Missing transSubId param');
  await deleteTransSub(params.transSubId);
  return redirect('/');
};
