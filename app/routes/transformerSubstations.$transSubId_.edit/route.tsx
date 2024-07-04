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
import { 
  checkNameConstrains,
  checkNameLength 
} from "~/.server/helpers/validateInput";

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
  const errNameLength = checkNameLength(name);
  
  if (errNameLength) {
    return errNameLength;
  }

  try {
    await updateTransSub(params.transSubId, name);
    return redirect(`/transformerSubstations/${params.transSubId}`);
  } catch (error) {
    const err = checkNameConstrains(error, name);
    if (err) {
      return err;
    } else {
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
