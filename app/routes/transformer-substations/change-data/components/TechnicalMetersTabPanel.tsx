import { useEffect, useEffectEvent } from "react";
import { useRemixForm } from "remix-hook-form";
import { technicalFormResolver as resolver } from "../validation/technical-form.schema";

import Input from "~/components/Input";
import Fieldset from "~/components/Fieldset";
import Container from "./Container";
import TabPanel from "./TabPanel";
import Button from "~/components/Button";

import type { FetcherWithComponents } from "react-router";

import type {
  TechnicalFormData,
  TechnicalFormErrors,
} from "../validation/technical-form.schema";

interface TechnicalMetersStats {
  totalCount: number;
  underVoltageCount: number;
}

interface PanelProps {
  action: string;
  fetcher: FetcherWithComponents<TechnicalFormErrors>;
  technicalMeters: TechnicalMetersStats;
  showToast: () => void;
}

export default function TechnicalMetersTabPanel({
  action,
  fetcher,
  technicalMeters,
  showToast,
}: PanelProps) {
  const { totalCount, underVoltageCount } = technicalMeters;
  const isTechnicalAction = fetcher.formAction === action;
  const isSubmitting = fetcher.state === "submitting";
  const errors = fetcher.data;
  const errorStyles = "w-52 text-pretty";

  const { handleSubmit, register, reset } = useRemixForm<TechnicalFormData>({
    resolver,
    fetcher,
    defaultValues: {
      quantity: totalCount,
      underVoltage: underVoltageCount,
    },
  });

  const onSeccessfulSubmit = useEffectEvent(() => showToast());

  useEffect(() => {
    if (!isSubmitting && !errors && isTechnicalAction) {
      onSeccessfulSubmit();
    }
  }, [errors, isSubmitting, isTechnicalAction]);

  return (
    <TabPanel checked={false} label="Техучёт">
      <fetcher.Form method="POST" action={action} onSubmit={void handleSubmit}>
        <div className="flex gap-8">
          <Container heading="Всего счетчиков">
            <Fieldset legend="Количество ПУ">
              <Input
                type="number"
                min={0}
                placeholder="0"
                error={errors?.quantity?.message}
                errorClassName={errorStyles}
                {...register("quantity")}
              />
            </Fieldset>
            <Fieldset legend="Из них под напряжением">
              <Input
                type="number"
                min={0}
                placeholder="0"
                error={errors?.underVoltage?.message}
                errorClassName={errorStyles}
                {...register("underVoltage")}
              />
            </Fieldset>
          </Container>
        </div>

        <Button
          type={isSubmitting ? "button" : "submit"}
          className={`mt-5 w-50 btn-outline btn-accent ${isSubmitting && "btn-active"}`}
        >
          {isSubmitting && <span className="loading loading-spinner"></span>}
          {isSubmitting ? "Изменение..." : "Изменить данные"}
        </Button>
        <Button
          type="button"
          className="mt-5 ml-5 w-50 btn-neutral btn-outline"
          onClick={() => {
            reset();
            fetcher.unstable_reset();
          }}
        >
          Очистить форму
        </Button>
      </fetcher.Form>
    </TabPanel>
  );
}
