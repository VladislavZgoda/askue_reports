import { Form, useNavigate } from "react-router";
import { useRemixForm } from "remix-hook-form";
import { resolver } from "~/routes/transformer-substations/zod-schemas/substation-name.schema";

import Input from "./Input";
import Button from "./Button";
import Fieldset from "./Fieldset";

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
    <main className="flex h-full items-center justify-center">
      <Form
        method="POST"
        action={formAction}
        onSubmit={void handleSubmit}
        className="bg-base-200 flex h-2/5 w-3/5 flex-initial rounded-lg p-8"
      >
        <div className="flex h-full w-full flex-initial flex-col items-center justify-evenly">
          <Fieldset legend="Наименование ТП">
            <Input
              type="text"
              placeholder="ТП-1000"
              className={`${!error && "input-neutral"} w-80`}
              error={error}
              {...register("name")}
            />
          </Fieldset>

          <div className="-mt-5 flex w-full justify-center gap-8">
            <Button type="submit" className="btn-primary w-48">
              {isSubmitting && (
                <span className="loading loading-spinner"></span>
              )}
              {isSubmitting
                ? `${buttonNames.submitName}`
                : `${buttonNames.idleName}`}
            </Button>
            <Button
              type="button"
              className="btn-success w-48"
              onClick={() => void navigate(-1)}
            >
              Назад
            </Button>
          </div>
        </div>
      </Form>
    </main>
  );
}
