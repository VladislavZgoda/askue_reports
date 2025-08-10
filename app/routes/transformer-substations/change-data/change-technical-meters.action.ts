import type { Route } from "./+types/change-technical-meters.action";
import type { TechnicalFormData } from "./validation/technical-form.schema";

import { getValidatedFormData } from "remix-hook-form";
import { technicalFormResolver } from "./validation/technical-form.schema";
import upsertTechnicalMeters from "./.server/db-actions/upsert-technical-meters";

export async function action({ request, params }: Route.ActionArgs) {
  const { errors, data } = await getValidatedFormData<TechnicalFormData>(
    request,
    technicalFormResolver,
  );

  if (errors) return errors;

  const substationId = Number(params.id);

  await upsertTechnicalMeters({
    substationId,
    ...data,
  });

  return null;
}
