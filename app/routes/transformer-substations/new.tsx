import { useActionData, useNavigation, redirect } from "react-router";
import { insertNewTS } from "~/.server/db-queries/transformerSubstationTable";
import TransSubName from "~/components/TransSubName";
import { checkNameConstrains, checkNameLength } from "~/utils/validateInput";
import { isNotAuthenticated } from "~/.server/services/auth";
import type { Route } from "./+types/new";

export async function loader({ request }: Route.LoaderArgs) {
  return await isNotAuthenticated(request);
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const name = String(formData.get("name"));
  const errNameLength = checkNameLength(name);

  if (errNameLength) {
    return errNameLength;
  }

  try {
    const transSub = await insertNewTS(name);

    return redirect(`/transformer-substations/${transSub.id}`);
  } catch (error) {
    const err = checkNameConstrains(error, name);
    if (err) {
      return err;
    } else {
      throw error;
    }
  }
}

export default function CreateNewTransformerSubstation() {
  const actionData = useActionData<typeof action>() as
    | { error: string; name: string }
    | undefined;
  const navigation = useNavigation();
  const formAction = "/transformer-substations/new";
  const isSubmitting = navigation.formAction === formAction;

  return (
    <TransSubName
      transSub={undefined}
      isSubmitting={isSubmitting}
      actionData={actionData}
      formAction={formAction}
      buttonNames={{ submitName: "Создание...", idleName: "Создать" }}
    />
  );
}
