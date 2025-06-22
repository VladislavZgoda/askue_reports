import type { Route } from "./+types/addBillingMeters";
import type { BillingValidationForm } from "./zodSchemes";

import { getValidatedFormData } from "remix-hook-form";
import { billingValidationFormResolver } from "./zodSchemes";
//import addNewMeters from "./.server/db-actions/addNewMeters";

export async function action({ request, params }: Route.ActionArgs) {
  const { errors, data } = await getValidatedFormData<BillingValidationForm>(
    request,
    billingValidationFormResolver,
  );

  console.log(errors);

  if (errors) return errors;

  const substationId = Number(params.id);

  //await addNewMeters(data);
  console.log(substationId);
  console.log(data);

  return null;
}
