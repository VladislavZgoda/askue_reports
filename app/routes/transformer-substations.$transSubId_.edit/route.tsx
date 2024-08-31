import type {
  LoaderFunctionArgs,
  ActionFunctionArgs
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  useLoaderData,
  useActionData,
  useNavigation,
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
import { isNotAuthenticated } from "~/.server/services/auth";

export const loader = async ({
  params, request
}: LoaderFunctionArgs) => {
  invariant(params.transSubId, 'Expected params.transSubId');

  if (!Number(params.transSubId)) {
    throw new Response('Not Found', { status: 404 });
  }

  const transSub = await selectTransSub(params.transSubId);

  if (!transSub) {
    throw new Response('Not Found', { status: 404 });
  }

  await isNotAuthenticated(request);

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
    return redirect(`/transformer-substations/${params.transSubId}`);
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
  const navigation = useNavigation();
  const formAction = `/transformer-substations/${transSub.id}/edit`;
  const isSubmitting =
    navigation.formAction === formAction;

  return (
    <TransSubName
      transSub={transSub}
      isSubmitting={isSubmitting}
      actionData={actionData}
      formAction={formAction}
      buttonNames={{ submitName: 'Изменение...', idleName: 'Переименовать' }}
    />
  );
}
