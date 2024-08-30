import { Form, useNavigate } from "@remix-run/react";
import type { TransSubName } from "~/types";

export default function TransSubName({
  transSub,
  isSubmitting,
  actionData,
  formAction,
  buttonNames
}: TransSubName) {
  const navigate = useNavigate();

  return (
    <main
      className="flex flex-initial items-center justify-center h-full text-3xl">
      <Form method="post" action={formAction}
        className="flex p-8 h-2/5 w-3/5 flex-initial bg-neutral-content rounded-lg">
        <fieldset
          className="flex flex-col justify-evenly items-center w-full h-full flex-initial"
          disabled={isSubmitting}>
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
              defaultValue={actionData?.name || transSub?.name || ''}
            />
            {actionData?.error && (
              <div className="label">
                <span className="label-text-alt text-error">
                  {actionData.error}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-initial justify-evenly w-full text-white font-semibold">
            <button
              type="submit"
              className="btn btn-primary btn-xs sm:btn-sm md:btn-md lg:btn-lg">
              {isSubmitting && <span className="loading loading-spinner"></span>}
              {isSubmitting ? `${buttonNames.submitName}` : `${buttonNames.idleName}`}
            </button>
            <button type="button"
              className="btn btn-secondary btn-xs sm:btn-sm md:btn-md lg:btn-lg"
              onClick={() => navigate(-1)}>
              Назад
            </button>
          </div>
        </fieldset>
      </Form>
    </main>
  );
}
