import type { 
  LoaderFunctionArgs,
  ActionFunctionArgs
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { 
  Form,
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
  const isSubmitting =
    navigation.formAction === `/transformerSubstations/${transSub.id}/edit`;

  return (
    <main
      className="flex flex-initial items-center justify-center
      h-full text-3xl"
    >
      <Form
        method="post"
        action={`/transformerSubstations/${transSub.id}/edit`}
        className="flex p-8 h-2/5 w-3/5 flex-initial
        bg-neutral-content rounded-lg"
      >
        <fieldset
          className="flex flex-col justify-evenly items-center w-full h-full flex-initial"
          disabled={isSubmitting}
        >
          <div className="form-control w-full max-w-xs">
            <label className="label" htmlFor="name">
              <span className="label-text">Наименование</span>
            </label>
            <input
              type="text"
              placeholder="ТП-1000"
              className={
                `input input-bordered w-full max-w-xs input-xs
               md:input-md sm:input-sm lg:input-lg
               ${actionData?.error ? 'input-error' : 'input-accent'}`
              }
              name="name"
              id="name"
              defaultValue={actionData?.name || transSub.name}
            />
            {actionData?.error ? (
              <div className="label">
                <span className="label-text-alt text-error">
                  {actionData.error}
                </span>
              </div>
            ) : null}
          </div>
          <div className="flex flex-initial justify-evenly w-full text-white font-semibold">
            <button
              type="submit"
              className="btn btn-primary btn-xs sm:btn-sm md:btn-md lg:btn-lg"
            >
              {isSubmitting ? <span className="loading loading-spinner"></span> : null}
              {isSubmitting ? 'Изменение...' : 'Переименовать'}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-xs sm:btn-sm md:btn-md lg:btn-lg"
              onClick={() => navigate(-1)}
            >
              Назад
            </button>
          </div>
        </fieldset>
      </Form>
    </main>
  );
}
