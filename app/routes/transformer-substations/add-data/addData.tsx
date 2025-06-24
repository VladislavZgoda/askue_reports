import { useEffect, useState } from "react";
import { href, useFetcher } from "react-router";
import { useRemixForm } from "remix-hook-form";
import { billingFormResolver } from "./validation/billing-form-schema";
import { technicalFormResolver } from "./validation/technical-form-schema";
import { isNotAuthenticated } from "~/.server/services/auth";
import { getTransformerSubstationById } from "~/.server/db-queries/transformerSubstations";
import { getRecentActionLogsForSubstation } from "~/.server/db-queries/meterActionLogs";
import { todayDate } from "~/utils/dateFunctions";
import Input from "~/components/Input";
import Select from "~/components/Select";
import Button from "~/components/Button";
import Fieldset from "~/components/Fieldset";
import LinkToSubstation from "~/components/LinkToSubstation";
import Toast from "~/components/Toast";
import Log from "./Log";

import type { Route } from "./+types/addData";

import type {
  BillingFormData,
  BillingFormErrors,
} from "./validation/billing-form-schema";

import type {
  TechnicalForm,
  TechnicalFormErrors,
} from "./validation/technical-form-schema";

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  if (!Number(params.id)) {
    throw new Error("Not Found");
  }

  const substation = await getTransformerSubstationById(Number(params.id));

  if (!substation) {
    throw new Error("Not Found");
  }

  await isNotAuthenticated(request);

  const actionLogs = await getRecentActionLogsForSubstation(substation.id);

  return { substation, actionLogs };
};

export default function AddData({ loaderData }: Route.ComponentProps) {
  const { substation, actionLogs } = loaderData;
  const defaultDate = todayDate();

  const fetcherBillingMeters = useFetcher<BillingFormErrors>();
  const isSubmittingBilling = fetcherBillingMeters.state === "submitting";

  const billingAction = href(
    "/transformer-substations/:id/add-billing-meters",
    {
      id: substation.id.toString(),
    },
  );

  const isBillingAction = fetcherBillingMeters.formAction === billingAction;
  const [billingErrors, setBillingErrors] = useState(fetcherBillingMeters.data);

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

  const technicalAction = href(
    "/transformer-substations/:id/add-technical-meters",
    { id: substation.id.toString() },
  );

  const isTechnicalAction =
    fetcherTechnicalMeters.formAction === technicalAction;

  const [technicalErrors, setTechnicalErrors] = useState(
    fetcherTechnicalMeters.data,
  );

  const technicalForm = useRemixForm<TechnicalForm>({
    resolver: technicalFormResolver,
    fetcher: fetcherTechnicalMeters,
  });

  const [isVisible, setIsVisible] = useState(false);

  const showToast = () => {
    setIsVisible(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 4000);
  };

  useEffect(() => {
    if (!isSubmittingBilling && !fetcherBillingMeters.data && isBillingAction) {
      setBillingErrors(undefined);
      showToast();
      billingForm.reset();
    }

    if (fetcherBillingMeters.data) setBillingErrors(fetcherBillingMeters.data);

    if (
      !isSubmittingTechnical &&
      !fetcherTechnicalMeters.data &&
      isTechnicalAction
    ) {
      setTechnicalErrors(undefined);
      showToast();
      technicalForm.reset();
    }

    if (fetcherTechnicalMeters.data) {
      setTechnicalErrors(fetcherTechnicalMeters.data);
    }
  }, [
    fetcherBillingMeters.data,
    isSubmittingBilling,
    isBillingAction,
    fetcherTechnicalMeters.data,
    isSubmittingTechnical,
    isTechnicalAction,
  ]);

  return (
    <main>
      <LinkToSubstation
        substationId={substation.id.toString()}
        name={substation.name}
      />

      <div className="flex ml-6 gap-x-8">
        <section className="flex flex-col gap-3 bg-base-200 p-5 rounded-lg w-80 shadow-md">
          <h2>Добавить новые потребительские ПУ</h2>
          <fetcherBillingMeters.Form
            onSubmit={void billingForm.handleSubmit()}
            method="POST"
            action={billingAction}
            className="flex flex-col gap-5 h-full"
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
            <Button
              type={isSubmittingBilling ? "button" : "submit"}
              className={`btn-outline btn-success ${isSubmittingBilling && "btn-active"}`}
            >
              {isSubmittingBilling && (
                <span className="loading loading-spinner"></span>
              )}
              {isSubmittingBilling ? "Запись..." : "Добавить"}
            </Button>
          </fetcherBillingMeters.Form>
        </section>

        <section className="flex flex-col gap-3 bg-base-200 p-5 rounded-lg w-80 shadow-md">
          <h2>Добавить техучеты</h2>
          <fetcherTechnicalMeters.Form
            onSubmit={void technicalForm.handleSubmit()}
            method="POST"
            action={technicalAction}
            className="flex flex-col gap-5 h-full"
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
            <Button
              type={isSubmittingTechnical ? "button" : "submit"}
              className={`btn-outline btn-success mt-auto ${isSubmittingTechnical && "btn-active"}`}
            >
              {isSubmittingTechnical && (
                <span className="loading loading-spinner"></span>
              )}
              {isSubmittingTechnical ? "Запись..." : "Добавить"}
            </Button>
          </fetcherTechnicalMeters.Form>
        </section>

        <Log logMessages={actionLogs} />
      </div>

      <Toast isVisible={isVisible} message="Данные успешно добавлены." />
    </main>
  );
}
