import {
  Form,
  useActionData,
  useNavigation
} from "@remix-run/react";
import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect, json } from "@remix-run/node";
import { insertNewTS } from "~/.server/db-queries/transformerSubstationTable";


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
      && error.message.includes('unique constraint')) {
      const error = `Наименование ${name} уже существует.`
      return json({ error, name });
    } else if (error instanceof Error
      && error.message.includes('value too long')) {
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

  return (
    <main
      className="flex flex-initial items-center justify-center
      h-full text-3xl"
    >
      <Form
        method="post"
        className="flex flex-col p-8 h-2/5 w-3/5 flex-initial justify-evenly items-center
        bg-neutral-content rounded-lg"
      >
        <div className="form-control w-full max-w-xs">
          <label className="label" htmlFor="name">
            <span className="label-text">Наименование</span>
          </label>
          <input
            type="text"
            placeholder="ТП-1000"
            className="input input-bordered w-full max-w-xs input-xs
            input-accent md:input-md sm:input-sm lg:input-lg"
            name="name"
            id="name"
            defaultValue={actionData?.name}
          />
          {actionData?.error ? (
            <p style={{ color: "red" }}>
              {actionData.error}
            </p>
          ) : null}
        </div>
        <div className="flex flex-initial justify-evenly w-full text-white font-semibold">
          <button
            type="submit"
            className="btn btn-primary btn-xs sm:btn-sm md:btn-md lg:btn-lg"
          >
            Создать
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-xs sm:btn-sm md:btn-md lg:btn-lg"
          >
            Назад
          </button>
        </div>
      </Form>
    </main>
  );
}

