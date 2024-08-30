import {
  useActionData,
  useNavigation
} from "@remix-run/react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { insertNewTS } from "~/.server/db-queries/transformerSubstationTable";
import TransSubName from "~/components/TransSubName";
import {
  checkNameConstrains,
  checkNameLength
} from "~/.server/helpers/validateInput";
import { isNotAuthenticated } from "~/.server/services/auth";

export async function loader({ request }: LoaderFunctionArgs) {
  return await isNotAuthenticated(request);
}


export async function action({
  request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const name = String(formData.get('name'));
  const errNameLength = checkNameLength(name);

  if (errNameLength) {
    return errNameLength;
  }

  try {
    const transSub = await insertNewTS(name);

    return redirect(`/transformerSubstations/${transSub.id}`);
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
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const formAction = '/transformer-substations/new';
  const isSubmitting =
    navigation.formAction === formAction;

  return (
    <TransSubName
      transSub={undefined}
      isSubmitting={isSubmitting}
      actionData={actionData}
      formAction={formAction}
      buttonNames={{ submitName: 'Создание...', idleName: 'Создать' }} />
  );
}

