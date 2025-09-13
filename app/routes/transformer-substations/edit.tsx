import { resolver } from "./zod-schemas/substation-name.schema";
import { getValidatedFormData } from "remix-hook-form";
import { href, useNavigation, redirect } from "react-router";

import authMiddleware from "~/.server/middleware/auth";
import SubstationNameForm from "~/components/SubstationNameForm";

import {
  updateTransformerSubstation,
  getTransformerSubstationById,
  isTransformerSubstationNameTaken,
} from "~/.server/db-queries/transformer-substations";

import type { FormData } from "./zod-schemas/substation-name.schema";
import type { Route } from "./+types/edit";

export const middleware: Route.MiddlewareFunction[] = [authMiddleware];

export const loader = async ({ params }: Route.LoaderArgs) => {
  if (!Number(params.id)) {
    throw new Error("Not Found");
  }

  const substation = await getTransformerSubstationById(Number(params.id));

  if (!substation) {
    throw new Error("Not Found");
  }

  return substation;
};

export const action = async ({ request, params }: Route.ActionArgs) => {
  const { errors, data, receivedValues } = await getValidatedFormData<FormData>(
    request,
    resolver,
  );

  if (errors) return { errors, receivedValues };

  const nameTaken = await isTransformerSubstationNameTaken(data.name);

  if (nameTaken) {
    return {
      errors: {
        name: { message: `Наименование ${data.name} уже существует.` },
      },
      receivedValues,
    };
  }

  await updateTransformerSubstation(Number(params.id), data.name);

  return redirect(href("/transformer-substations/:id", { id: params.id }));
};

export default function EditTransformerSubstation({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const substation = loaderData;

  const navigation = useNavigation();

  const formAction = href("/transformer-substations/:id/edit", {
    id: substation.id.toString(),
  });

  const isSubmitting = navigation.formAction === formAction;

  return (
    <SubstationNameForm
      name={substation.name}
      error={actionData?.errors?.name?.message}
      formAction={formAction}
      receivedValues={actionData?.receivedValues?.name}
      isSubmitting={isSubmitting}
      buttonNames={{ submitName: "Изменение...", idleName: "Переименовать" }}
    />
  );
}
