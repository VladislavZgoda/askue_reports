import { useEffect, useRef, useState } from "react";
import { href, useFetcher } from "react-router";
import { useRemixForm } from "remix-hook-form";
import { billingFormResolver } from "./validation/billingFormSchema";
import { techicalFormResolver } from "./validation/technicalFormSchema";
import { isNotAuthenticated } from "~/.server/services/auth";
import { getTransformerSubstationById } from "~/.server/db-queries/transformerSubstations";
import { getRecentActionLogsForSubstation } from "~/.server/db-queries/meterActionLogs";
import { todayDate } from "~/utils/dateFunctions";
import Input from "~/components/Input";
import Select from "~/components/Select";
import Button from "~/components/Button";
import Fieldset from "~/components/Fieldset";
import NumberInput from "./NumberInput";
import addTechnicalMeters from "./.server/db-actions/addTechnicalMeters";
import SubmitButton from "./SubmitButton";
import validateInputTechnicalMeters from "./.server/validation/technicalMetersInput";
import FetcherForm from "./FetcherForm";
import LinkToSubstation from "~/components/LinkToSubstation";
import Toast from "~/components/Toast";
import Log from "./Log";

import type { Route } from "./+types/addData";

import type {
  BillingFormData,
  BillingFormErrors,
} from "./validation/billingFormSchema";

import type {
  TechicalForm,
  TechicalFormErrors,
} from "./validation/technicalFormSchema";

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

// export const action = async ({ request, params }: Route.ActionArgs) => {
//   const formData = await request.formData();
//   const { _action, ...values } = Object.fromEntries(formData);

//   if (_action === "addTechnicalMeters") {
//     const errors = validateInputTechnicalMeters(values);

//     if (Object.keys(errors).length > 0) {
//       return { errors };
//     }

//     const data = {
//       transSubId: params.id,
//       techMeters: values.techMeters as string,
//       underVoltage: values.underVoltage as string,
//     };

//     await addTechnicalMeters(data);
//   }

//   return null;
// };

//type ErrorType = Record<string, string>;

export default function AddData({ loaderData }: Route.ComponentProps) {
  const { substation, actionLogs } = loaderData;
  const defaultDate = todayDate();

  //const fetcher = useFetcher<typeof action>();

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

  const fetcherTechnicalMeters = useFetcher<TechicalFormErrors>();
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

  const techicalForm = useRemixForm<TechicalForm>({
    resolver: techicalFormResolver,
    fetcher: fetcherTechnicalMeters,
  });

  // const actionErrors = fetcher.data;
  // const formAction = fetcher.formData?.get("_action");
  // const isSubmitting = fetcher.state === "submitting";

  // const checkWhatForm = (formBtnName: string) => {
  //   return formAction === formBtnName;
  // };

  // const checkFormSubmit = (dataType: boolean) => {
  //   return dataType && isSubmitting;
  // };

  // const isTechnicalMetersAction = checkWhatForm("addTechnicalMeters");
  // const isSubmittingTechnicalMeters = checkFormSubmit(isTechnicalMetersAction);

  // const technicalMetersRef = useRef<HTMLFormElement>(null);
  // const [errTechnicalMeters, setErrTechnicalMeters] = useState<ErrorType>({});

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
      techicalForm.reset();
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

  // useEffect(() => {
  //   if (
  //     !isSubmittingTechnicalMeters &&
  //     !actionErrors?.errors &&
  //     isTechnicalMetersAction
  //   ) {
  //     technicalMetersRef.current?.reset();
  //     setErrTechnicalMeters({});
  //     handleIsVisible();
  //   }

  //   if (actionErrors?.errors && isTechnicalMetersAction) {
  //     setErrTechnicalMeters(actionErrors.errors);
  //   }
  // }, [isTechnicalMetersAction, actionErrors?.errors]);

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
            onSubmit={void techicalForm.handleSubmit()}
            method="POST"
            action={technicalAction}
            className="flex flex-col gap-5 h-full"
          >
            
          </fetcherTechnicalMeters.Form>
        </section>
        {/* <FetcherForm
          fetcher={fetcher}
          metesRef={technicalMetersRef}
          h2Title="Добавить техучеты"
        >
          <NumberInput
            labelName="Количество Техучетов"
            inputName="techMeters"
            error={
              errTechnicalMeters?.techMeters || errTechnicalMeters?.techDif
            }
          />

          <NumberInput
            labelName="Из них под напряжением"
            inputName="underVoltage"
            error={
              errTechnicalMeters?.underVoltage || errTechnicalMeters?.techDif
            }
          />

          <SubmitButton
            buttonValue="addTechnicalMeters"
            isSubmitting={isSubmittingTechnicalMeters}
          />
        </FetcherForm> */}

        <Log logMessages={actionLogs} />
      </div>

      <Toast isVisible={isVisible} message="Данные успешно добавлены." />
    </main>
  );
}
