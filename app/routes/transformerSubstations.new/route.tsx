import {
  useActionData,
  useNavigate,
  useNavigation
} from "@remix-run/react";
import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect, json } from "@remix-run/node";
import { insertNewTS } from "~/.server/db-queries/transformerSubstationTable";
import TransSubName from "~/components/TransSubName";


export const action = async ({
  request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const name = String(formData.get('name'));

  if (name.length < 3) {
    const error = 'Длина наименования должна быть не меньше 3 символов.'
    return json({ error, name });
  }

  try {
    const transSub = await insertNewTS(name);
    return redirect(`/transformerSubstations/${transSub.id}`);
  } catch (error) {
    if (error instanceof Error
      && error.message.includes('name_unique')) {
      const error = `Наименование ${name} уже существует.`
      return json({ error, name });
    } else if (error instanceof Error
      && error.message.includes('character varying')) {
      const error = `Максимальная длина наименования - 8 символов.`
      return json({ error, name });
    }
    else {
      throw error;
    }
  }
};

export default function CreateNewTransformerSubstation() {
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const formAction = '/transformerSubstations/new';
  const isSubmitting =
    navigation.formAction === formAction;

  return (
    <TransSubName
      transSub={undefined}
      isSubmitting={isSubmitting}
      actionData={actionData}
      navigate={navigate}
      formAction={formAction}
      buttonNames={{ submitName: 'Создание...', idleName: 'Создать' }}
    />
  );
}

