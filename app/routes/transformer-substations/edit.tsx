import { useActionData, useNavigation, redirect } from "react-router";
import {
  updateTransSub,
  getTransformerSubstationById,
} from "~/.server/db-queries/transformerSubstations";
import TransSubName from "~/components/TransSubName";
import { checkNameConstrains, checkNameLength } from "~/utils/validateInput";
import { isNotAuthenticated } from "~/.server/services/auth";
import type { Route } from "./+types/edit";

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  if (!Number(params.id)) {
    throw new Error("Not Found");
  }

  const transSub = await getTransformerSubstationById(Number(params.id));

  if (!transSub) {
    throw new Error("Not Found");
  }

  await isNotAuthenticated(request);

  return transSub;
};

export const action = async ({ request, params }: Route.ActionArgs) => {
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const errNameLength = checkNameLength(name);

  if (errNameLength) {
    return errNameLength;
  }

  try {
    await updateTransSub(params.id, name);
    return redirect(`/transformer-substations/${params.id}`);
  } catch (error) {
    const err = checkNameConstrains(error, name);
    if (err) {
      return err;
    } else {
      throw error;
    }
  }
};

export default function EditTransformerSubstation({
  loaderData,
}: Route.ComponentProps) {
  const transSub = loaderData;
  const actionData = useActionData<typeof action>() as
    | { error: string; name: string }
    | undefined;
  const navigation = useNavigation();
  const formAction = `/transformer-substations/${transSub.id}/edit`;
  const isSubmitting = navigation.formAction === formAction;

  return (
    <TransSubName
      transSub={transSub}
      isSubmitting={isSubmitting}
      actionData={actionData}
      formAction={formAction}
      buttonNames={{ submitName: "Изменение...", idleName: "Переименовать" }}
    />
  );
}
