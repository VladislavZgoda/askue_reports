import { useRemixForm } from "remix-hook-form";
import { useState, useEffect } from "react";
import { billingFormResolver as resolver } from "../validation/billing-form.schema";

import Input from "~/components/Input";
import Fieldset from "~/components/Fieldset";
import Container from "./Container";
import TabPanel from "./TabPanel";
import Button from "~/components/Button";

import type { FetcherWithComponents } from "react-router";

import type {
  BillingFormData,
  BillingFormErrors,
} from "../validation/billing-form.schema";

interface MeterReport {
  registeredMeters: number;
  unregisteredMeters: number;
  yearlyInstallation: {
    totalInstalled: number;
    registeredCount: number;
  };
  monthlyInstallation: {
    totalInstalled: number;
    registeredCount: number;
  };
}

interface PanelProps {
  errors: BillingFormErrors["errors"] | undefined;
  action: string;
  fetcher: FetcherWithComponents<BillingFormErrors>;
  meterReport: MeterReport;
  isSubmitting: boolean;
  balanceGroup: BalanceGroup;
}

export default function BalanceGroupTabPanel({
  errors,
  action,
  fetcher,
  meterReport,
  isSubmitting,
  balanceGroup,
}: PanelProps) {
  const {
    registeredMeters,
    unregisteredMeters,
    yearlyInstallation,
    monthlyInstallation,
  } = meterReport;

  const [inputErrors, setInputErrors] = useState(errors);

  useEffect(() => {
    setInputErrors(errors);
  }, [errors]);

  const { handleSubmit, register, reset } = useRemixForm<BillingFormData>({
    mode: "onSubmit",
    resolver,
    fetcher,
    defaultValues: {
      totalCount: registeredMeters + unregisteredMeters,
      registeredCount: registeredMeters,
      yearlyTotalInstalled: yearlyInstallation.totalInstalled,
      yearlyRegisteredCount: yearlyInstallation.registeredCount,
      monthlyTotalInstalled: monthlyInstallation.totalInstalled,
      monthlyRegisteredCount: monthlyInstallation.registeredCount,
      balanceGroup,
    },
  });

  const errorStyles = "w-52 text-pretty";

  return (
    <TabPanel checked={balanceGroup === "Быт"} label={balanceGroup}>
      <fetcher.Form method="POST" action={action} onSubmit={void handleSubmit}>
        <div className="flex gap-8">
          <Container heading="Всего счетчиков">
            <Fieldset
              legend="Количество ПУ"
              className={inputErrors && !inputErrors?.totalCount ? "mb-15" : ""}
            >
              <Input
                type="number"
                min={0}
                placeholder="0"
                error={inputErrors?.totalCount?.message}
                errorClassName={errorStyles}
                {...register("totalCount")}
              />
            </Fieldset>
            <Fieldset
              legend="Из них в системе"
              className={
                inputErrors && !inputErrors?.registeredCount ? "mb-15" : ""
              }
            >
              <Input
                type="number"
                min={0}
                placeholder="0"
                error={inputErrors?.registeredCount?.message}
                errorClassName={errorStyles}
                {...register("registeredCount")}
              />
            </Fieldset>
          </Container>
          <Container heading="Установлено за год">
            <Fieldset
              legend="Количество ПУ"
              className={
                inputErrors && !inputErrors?.yearlyTotalInstalled ? "mb-15" : ""
              }
            >
              <Input
                type="number"
                min={0}
                placeholder="0"
                error={inputErrors?.yearlyTotalInstalled?.message}
                errorClassName={errorStyles}
                {...register("yearlyTotalInstalled")}
              />
            </Fieldset>
            <Fieldset
              legend="Из них в системе"
              className={
                inputErrors && !inputErrors?.yearlyRegisteredCount
                  ? "mb-15"
                  : ""
              }
            >
              <Input
                type="number"
                min={0}
                placeholder="0"
                error={inputErrors?.yearlyRegisteredCount?.message}
                errorClassName={errorStyles}
                {...register("yearlyRegisteredCount")}
              />
            </Fieldset>
          </Container>
          <Container heading="Установлено в этом месяце">
            <Fieldset
              legend="Количество ПУ"
              className={
                inputErrors && !inputErrors?.monthlyTotalInstalled
                  ? "mb-15"
                  : ""
              }
            >
              <Input
                type="number"
                min={0}
                placeholder="0"
                error={inputErrors?.monthlyTotalInstalled?.message}
                errorClassName={errorStyles}
                {...register("monthlyTotalInstalled")}
              />
            </Fieldset>
            <Fieldset
              legend="Из них в системе"
              className={
                inputErrors && !inputErrors?.monthlyTotalInstalled
                  ? "mb-15"
                  : ""
              }
            >
              <Input
                type="number"
                min={0}
                placeholder="0"
                error={inputErrors?.monthlyRegisteredCount?.message}
                errorClassName={errorStyles}
                {...register("monthlyRegisteredCount")}
              />
            </Fieldset>
          </Container>

          <Input hidden {...register("balanceGroup")} />
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
            setInputErrors(undefined);
          }}
        >
          Очистить форму
        </Button>
      </fetcher.Form>
    </TabPanel>
  );
}
