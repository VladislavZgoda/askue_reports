import type { Route } from "./+types/technical-meters.action";
import type { TechnicalForm } from "./validation/technical-form.schema";

import { getValidatedFormData } from "remix-hook-form";
import { technicalFormResolver } from "./validation/technical-form.schema";
import addOrUpdateTechnicalMeters from "./.server/db-actions/add-technical-meters";

export async function action({ request, params }: Route.ActionArgs) {
  const { errors, data } = await getValidatedFormData<TechnicalForm>(
    request,
    technicalFormResolver,
  );

  if (errors) return errors;

  const substationId = Number(params.id);

  await addOrUpdateTechnicalMeters({
    substationId,
    ...data,
  });

  return null;
}
