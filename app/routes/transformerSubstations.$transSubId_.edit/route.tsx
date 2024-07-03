import type {
  LoaderFunctionArgs,
  ActionFunctionArgs
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  useLoaderData,
  useActionData,
  useNavigation,
  useNavigate
} from "@remix-run/react";
import invariant from "tiny-invariant";
import {
  selectTransSub,
  updateTransSub
} from "~/.server/db-queries/transformerSubstationTable";
import TransSubName from "~/components/TransSubName";

export const loader = async ({
  params
}: LoaderFunctionArgs) => {
  invariant(params.transSubId, 'Expected params.transSubId');

  if (!Number(params.transSubId)) {
    throw new Response('Not Found', { status: 404 });
  }

  const transSub = await selectTransSub(params.transSubId);

  if (!transSub) {
    throw new Response('Not Found', { status: 404 });
  }

  return json({ transSub });
};

export const action = async ({
  request,
  params
}: ActionFunctionArgs) => {
  invariant(params.transSubId, 'Expected params.transSubId');
  const formData = await request.formData();
  const name = String(formData.get('name'));

  if (name.length < 3) {
    const error = 'Длина наименования должна быть не меньше 3 символов.'
    return json({ error, name });
  }

  try {
    await updateTransSub(params.transSubId, name);
    return redirect(`/transformerSubstations/${params.transSubId}`);
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

export default function EditTransformerSubstation() {
  const { transSub } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const formAction = `/transformerSubstations/${transSub.id}/edit`;
  const isSubmitting =
    navigation.formAction === formAction;

  return (
    <TransSubName
      transSub={transSub}
      isSubmitting={isSubmitting}
      actionData={actionData}
      navigate={navigate}
      formAction={formAction}
      buttonNames={{ submitName: 'Изменение...', idleName: 'Переименовать' }}
    />
  );
}
