import type { Route } from "./+types/billing-meters.action";
import type { BillingValidationForm } from "./validation/billingFormSchema";

import { getValidatedFormData } from "remix-hook-form";
import { billingValidationFormResolver } from "./validation/billingFormSchema";
import addBillingMeters from "./.server/db-actions/add-billing-meters";

export async function action({ request, params }: Route.ActionArgs) {
  const { errors, data } = await getValidatedFormData<BillingValidationForm>(
    request,
    billingValidationFormResolver,
  );

  if (errors) return errors;

  const substationId = Number(params.id);

  await addBillingMeters({
    ...data,
    substationId,
  });

  return null;
}
