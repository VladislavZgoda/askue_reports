import { Form, useNavigate } from "react-router";
import { useRemixForm } from "remix-hook-form";
import { resolver } from "~/routes/transformer-substations/zod-schemas/substation-name.schema";

import type { FormData } from "~/routes/transformer-substations/zod-schemas/substation-name.schema";

interface SubstationNameFormProps {
  name: string | undefined;
  error: string | undefined;
  formAction: string;
  isSubmitting: boolean;
  receivedValues: string | undefined;
  buttonNames: {
    submitName: string;
    idleName: string;
  };
}

export default function SubstationNameForm({
  name,
  error,
  formAction,
  isSubmitting,
  receivedValues,
  buttonNames,
}: SubstationNameFormProps) {
  const { handleSubmit, register } = useRemixForm<FormData>({
    mode: "onSubmit",
    resolver,
    defaultValues: {
      name: receivedValues ?? name,
    },
  });

  const navigate = useNavigate();

  return (
    <main className="flex flex-initial items-center justify-center h-full text-3xl">
      <Form
        method="POST"
        action={formAction}
        onSubmit={void handleSubmit}
        className="flex p-8 h-2/5 w-3/5 flex-initial bg-base-200 rounded-lg"
      >
        <div className="flex flex-col justify-evenly items-center w-full h-full flex-initial">
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Наименование ТП</legend>
            <input
              type="text"
              placeholder="ТП-1000"
              className={`input input-xs md:input-md sm:input-sm lg:input-lg w-80
                ${error ? "input-error" : "input-neutral"}`}
              {...register("name")}
            />
            {error && <p className="fieldset-label text-error">{error}</p>}
          </fieldset>

          <div className="flex flex-initial justify-evenly w-full">
            <button
              type={isSubmitting ? "button" : "submit"}
              className="btn btn-primary btn-xs sm:btn-sm md:btn-md lg:btn-lg w-48"
            >
              {isSubmitting && (
                <span className="loading loading-spinner"></span>
              )}
              {isSubmitting
                ? `${buttonNames.submitName}`
                : `${buttonNames.idleName}`}
            </button>

            <button
              type="button"
              className="btn btn-success btn-xs sm:btn-sm md:btn-md lg:btn-lg w-48"
              onClick={() => void navigate(-1)}
            >
              Назад
            </button>
          </div>
        </div>
      </Form>
    </main>
  );
}
