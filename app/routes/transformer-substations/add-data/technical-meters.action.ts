import type { Route } from "./+types/technical-meters.action";
import { getValidatedFormData } from "remix-hook-form";

export async function action({ request, params }: Route.ActionArgs) {
  const substationId = Number(params.id);

  return null;
}
