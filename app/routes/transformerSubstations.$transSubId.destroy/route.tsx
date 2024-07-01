import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import invariant from "tiny-invariant";
import { deleteTransSub } from "~/.server/db-queries/transformerSubstationTable";

export const action = async ({
  params,
}: ActionFunctionArgs) => {
  invariant(params.transSubId, 'Missing transSubId param');
  await deleteTransSub(params.transSubId);
  return redirect('/');
};
