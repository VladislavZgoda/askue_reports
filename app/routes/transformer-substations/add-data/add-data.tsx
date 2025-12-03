import { useEffect, useEffectEvent, Activity } from "react";
import { href, useFetcher } from "react-router";
import { useRemixForm } from "remix-hook-form";

import urlMiddleware from "~/.server/middleware/url";
import authMiddleware from "~/.server/middleware/auth";
import { billingFormResolver } from "./validation/billing-form.schema";
import { technicalFormResolver } from "./validation/technical-form.schema";
import { getTransformerSubstationById } from "~/.server/db-queries/transformer-substations";
import { getRecentActionLogsForSubstation } from "~/.server/db-queries/meter-action-logs";
import { todayDate } from "~/utils/date-functions";
import { useToast } from "~/hooks/use-toast";

import Input from "~/components/Input";
import Select from "~/components/Select";
import Button from "~/components/Button";
import Fieldset from "~/components/Fieldset";
import LinkToSubstation from "~/components/LinkToSubstation";
import Toast from "~/components/Toast";
import Log from "./components/Log";

import type { Route } from "./+types/add-data";

import type {
  BillingFormData,
  BillingFormErrors,
} from "./validation/billing-form.schema";

import type {
  TechnicalForm,
  TechnicalFormErrors,
} from "./validation/technical-form.schema";

export const middleware: Route.MiddlewareFunction[] = [
  authMiddleware,
  urlMiddleware,
];

export const loader = async ({ params }: Route.LoaderArgs) => {
  const substation = await getTransformerSubstationById(Number(params.id));

  if (!substation) {
    throw new Error("404 Not Found");
  }

  const actionLogs = await getRecentActionLogsForSubstation(substation.id);

  return { substation, actionLogs };
};

export default function AddData({ loaderData }: Route.ComponentProps) {
  const { substation, actionLogs } = loaderData;
  const { isShowingToast, showToast } = useToast();
  const defaultDate = todayDate();

  const fetcherBillingMeters = useFetcher<BillingFormErrors>();
  const isSubmittingBilling = fetcherBillingMeters.state === "submitting";
  const billingErrors = fetcherBillingMeters.data;

  const billingAction = href(
    "/transformer-substations/:id/add-billing-meters",
    {
      id: substation.id.toString(),
    },
  );

  const isBillingAction = fetcherBillingMeters.formAction === billingAction;

  const billingForm = useRemixForm<BillingFormData>({
    resolver: billingFormResolver,
    fetcher: fetcherBillingMeters,
    defaultValues: {
      balanceGroup: "Выбрать группу",
      date: defaultDate,
    },
  });

  const fetcherTechnicalMeters = useFetcher<TechnicalFormErrors>();
  const isSubmittingTechnical = fetcherTechnicalMeters.state === "submitting";
  const technicalErrors = fetcherTechnicalMeters.data;

  const technicalAction = href(
    "/transformer-substations/:id/add-technical-meters",
    { id: substation.id.toString() },
  );

  const isTechnicalAction =
    fetcherTechnicalMeters.formAction === technicalAction;

  const technicalForm = useRemixForm<TechnicalForm>({
    resolver: technicalFormResolver,
    fetcher: fetcherTechnicalMeters,
  });

  const onSuccessfulSubmit = useEffectEvent(() => showToast());

  useEffect(() => {
    if (!isSubmittingBilling && !fetcherBillingMeters.data && isBillingAction) {
      onSuccessfulSubmit();
      billingForm.reset();
    }
  }, [
    billingForm,
    fetcherBillingMeters.data,
    isBillingAction,
    isSubmittingBilling,
  ]);

  useEffect(() => {
    if (
      !isSubmittingTechnical &&
      !fetcherTechnicalMeters.data &&
      isTechnicalAction
    ) {
      onSuccessfulSubmit();
      technicalForm.reset();
    }
  }, [
    fetcherTechnicalMeters.data,
    isSubmittingTechnical,
    isTechnicalAction,
    technicalForm,
  ]);

  return (
    <main>
      <LinkToSubstation
        substationId={substation.id.toString()}
        name={substation.name}
      />

      <div className="ml-6 flex gap-x-8">
        <section className="card card-border bg-base-200 w-96 shadow-sm">
          <div className="card-body">
            <h2 className="card-title">Добавить новые потребительские ПУ</h2>
            <fetcherBillingMeters.Form
              onSubmit={void billingForm.handleSubmit}
              method="POST"
              action={billingAction}
              className="flex h-full flex-col gap-5"
            >
              <Fieldset legend="Количество ПУ">
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  error={billingErrors?.totalCount?.message}
                  {...billingForm.register("totalCount")}
                />
              </Fieldset>
              <Fieldset legend="Из них добавлено в систему">
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  error={billingErrors?.registeredCount?.message}
                  {...billingForm.register("registeredCount")}
                />
              </Fieldset>
              <Fieldset legend="Балансова группа">
                <Select
                  defaultValue="Выбрать группу"
                  error={billingErrors?.balanceGroup?.message}
                  {...billingForm.register("balanceGroup")}
                >
                  <option disabled={true}>Выбрать группу</option>
                  <option value="Быт">Быт</option>
                  <option value="ЮР Sims">ЮР Sims</option>
                  <option value="ЮР П2">ЮР П2</option>
                  <option value="ОДПУ Sims">ОДПУ Sims</option>
                  <option value="ОДПУ П2">ОДПУ П2</option>
                </Select>
              </Fieldset>
              <Fieldset legend="Дата">
                <Input
                  type="date"
                  error={billingErrors?.date?.message}
                  {...billingForm.register("date")}
                />
              </Fieldset>
              <div className="card-actions mr-4 justify-between">
                <Button
                  type={isSubmittingBilling ? "button" : "submit"}
                  className={`btn btn-success btn-outline ${isSubmittingBilling && "btn-active"}`}
                >
                  {isSubmittingBilling && (
                    <span className="loading loading-spinner"></span>
                  )}
                  {isSubmittingBilling ? "Запись..." : "Добавить"}
                </Button>
                <Button
                  type="button"
                  className="btn btn-neutral btn-outline"
                  onClick={() => {
                    billingForm.reset();
                    fetcherBillingMeters.reset();
                  }}
                >
                  Сбросить
                </Button>
              </div>
            </fetcherBillingMeters.Form>
          </div>
        </section>

        <section className="card card-border bg-base-200 w-96 shadow-sm">
          <div className="card-body">
            <h2 className="card-title">Добавить техучеты</h2>
            <fetcherTechnicalMeters.Form
              onSubmit={void technicalForm.handleSubmit}
              method="POST"
              action={technicalAction}
              className="flex h-full flex-col gap-5"
            >
              <Fieldset legend="Количество Техучетов">
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  error={technicalErrors?.quantity?.message}
                  {...technicalForm.register("quantity")}
                />
              </Fieldset>
              <Fieldset legend="Из них под напряжением">
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  error={technicalErrors?.underVoltage?.message}
                  {...technicalForm.register("underVoltage")}
                />
              </Fieldset>
              <div className="card-actions mt-auto mr-4 justify-between">
                <Button
                  type={isSubmittingTechnical ? "button" : "submit"}
                  className={`btn btn-outline btn-success ${isSubmittingTechnical && "btn-active"}`}
                >
                  {isSubmittingTechnical && (
                    <span className="loading loading-spinner"></span>
                  )}
                  {isSubmittingTechnical ? "Запись..." : "Добавить"}
                </Button>
                <Button
                  type="button"
                  className="btn btn-neutral btn-outline"
                  onClick={() => {
                    technicalForm.reset();
                    fetcherTechnicalMeters.reset();
                  }}
                >
                  Сбросить
                </Button>
              </div>
            </fetcherTechnicalMeters.Form>
          </div>
        </section>

        {actionLogs.length > 0 && <Log actionLogs={actionLogs} />}
      </div>

      <Activity mode={isShowingToast ? "visible" : "hidden"}>
        <Toast message="Данные успешно добавлены." />
      </Activity>
    </main>
  );
}
