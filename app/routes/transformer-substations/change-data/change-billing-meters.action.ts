import type { Route } from "./+types/change-billing-meters.action";
import type { BillingFormData } from "./validation/billing-form.schema";

import { getValidatedFormData } from "remix-hook-form";
import { billingFormResolver } from "./validation/billing-form.schema";

import changeData from "./.server/db-actions/upsert-billing-meters";

export async function action({ request, params }: Route.ActionArgs) {
  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<BillingFormData>(request, billingFormResolver);

  if (errors) return { errors, defaultValues };

  const substationId = Number(params.id);

  await changeData({
    ...data,
    substationId,
  });

  return null;
}
