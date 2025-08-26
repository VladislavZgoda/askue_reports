import { resolver } from "./zod-schemas/substation-name.schema";
import { getValidatedFormData } from "remix-hook-form";
import { href, useNavigation, redirect } from "react-router";
import { isNotAuthenticated } from "~/.server/services/auth";
import SubstationNameForm from "~/components/SubstationNameForm";

import {
  createTransformerSubstation,
  findTransformerSubstationByName,
} from "~/.server/db-queries/transformer-substations";

import type { FormData } from "./zod-schemas/substation-name.schema";
import type { Route } from "./+types/new";

export async function loader({ request }: Route.LoaderArgs) {
  return await isNotAuthenticated(request);
}

export async function action({ request }: Route.ActionArgs) {
  const { errors, data, receivedValues } = await getValidatedFormData<FormData>(
    request,
    resolver,
  );

  if (errors) return { errors, receivedValues };

  const nameExists = await findTransformerSubstationByName(data.name);

  if (nameExists) {
    return {
      errors: {
        name: { message: `Наименование ${data.name} уже существует.` },
      },
      receivedValues,
    };
  }

  const substation = await createTransformerSubstation(data.name);

  return redirect(
    href("/transformer-substations/:id", { id: substation.id.toString() }),
  );
}

export default function CreateTransformerSubstation({
  actionData,
}: Route.ComponentProps) {
  const navigation = useNavigation();
  const formAction = href("/transformer-substations/new");
  const isSubmitting = navigation.formAction === formAction;

  return (
    <SubstationNameForm
      name={undefined}
      error={actionData?.errors?.name?.message}
      formAction={formAction}
      receivedValues={actionData?.receivedValues.name}
      isSubmitting={isSubmitting}
      buttonNames={{ submitName: "Создание...", idleName: "Создать" }}
    />
  );
}
