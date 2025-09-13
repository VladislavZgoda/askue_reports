import { resolver } from "./zod-schemas/substation-name.schema";
import { getValidatedFormData } from "remix-hook-form";
import { href, useNavigation, redirect } from "react-router";

import authMiddleware from "~/.server/middleware/auth";
import SubstationNameForm from "~/components/SubstationNameForm";

import {
  createTransformerSubstation,
  isTransformerSubstationNameTaken,
} from "~/.server/db-queries/transformer-substations";

import type { FormData } from "./zod-schemas/substation-name.schema";
import type { Route } from "./+types/new";

export const middleware: Route.MiddlewareFunction[] = [authMiddleware];

export function loader() {
  return null;
}

export async function action({ request }: Route.ActionArgs) {
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
