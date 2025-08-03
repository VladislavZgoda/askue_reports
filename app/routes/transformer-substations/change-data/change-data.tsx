import { getTransformerSubstationById } from "~/.server/db-queries/transformerSubstations";
import { href, useFetcher } from "react-router";
import LinkToSubstation from "~/components/LinkToSubstation";

import {
  loadAllSubstationMeterReports,
  loadTechnicalMeters,
} from "./.server/db-actions/load-data";

import BalanceGroupTabPanel from "./components/BalanceGroupTabPanel";
import Toast from "~/components/Toast";
import { useState, useEffect, useRef } from "react";
import { isNotAuthenticated } from "~/.server/services/auth";
import type { Route } from "./+types/change-data";
import type { BillingFormErrors } from "./validation/billing-form.schema";

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  if (!Number(params.id)) {
    throw new Error("Not Found");
  }

  const substation = await getTransformerSubstationById(Number(params.id));

  if (!substation) {
    throw new Error("Not Found");
  }

  await isNotAuthenticated(request);

  const balanceGroups = [
    "Быт",
    "ЮР Sims",
    "ЮР П2",
    "ОДПУ Sims",
    "ОДПУ П2",
  ] as const;

  const [meterReports, technicalMeters] = await Promise.all([
    loadAllSubstationMeterReports(substation.id, balanceGroups),
    loadTechnicalMeters(substation.id),
  ]);

  return {
    substation,
    meterReports,
    technicalMeters,
  };
};

export default function ChangeData({ loaderData }: Route.ComponentProps) {
  const { substation, meterReports, technicalMeters } = loaderData;

  const [isVisible, setIsVisible] = useState(false);

  const fetcherBillingMeters = useFetcher<BillingFormErrors>();

  const submissionStateRef = useRef({
    isSubmitting: false,
    lastAction: "",
  });

  const fetcherData = fetcherBillingMeters.data;
  const isSubmittingBilling = fetcherBillingMeters.state === "submitting";

  const billingAction = href(
    "/transformer-substations/:id/change-billing-meters",
    {
      id: substation.id.toString(),
    },
  );

  const isBillingAction = fetcherBillingMeters.formAction === billingAction;

  useEffect(() => {
    if (isSubmittingBilling) {
      submissionStateRef.current = {
        isSubmitting: true,
        lastAction: fetcherBillingMeters.formAction || "",
      };
    } else if (submissionStateRef.current.isSubmitting) {
      if (submissionStateRef.current.lastAction === billingAction) {
        if (fetcherData === null) {
          setIsVisible(true);
          setTimeout(() => setIsVisible(false), 4000);

          fetcherBillingMeters.data = undefined;
        }
      }

      submissionStateRef.current.isSubmitting = false;
    }
  }, [isSubmittingBilling, fetcherData, billingAction, fetcherBillingMeters]);

  const errorsForPrivate =
    fetcherData?.errors && fetcherData.defaultValues?.balanceGroup === "Быт"
      ? fetcherData.errors
      : undefined;

  const errorsForLegalSims =
    fetcherData?.errors && fetcherData.defaultValues?.balanceGroup === "ЮР Sims"
      ? fetcherData.errors
      : undefined;

  const errorsForLegalP2 =
    fetcherData?.errors && fetcherData.defaultValues?.balanceGroup === "ЮР П2"
      ? fetcherData.errors
      : undefined;

  const errorsForOdpuSims =
    fetcherData?.errors &&
    fetcherData.defaultValues?.balanceGroup === "ОДПУ Sims"
      ? fetcherData.errors
      : undefined;

  const errorsForOdpuP2 =
    fetcherData?.errors && fetcherData.defaultValues?.balanceGroup === "ОДПУ П2"
      ? fetcherData.errors
      : undefined;

  return (
    <main>
      <LinkToSubstation
        substationId={substation.id.toString()}
        name={substation.name}
      />

      <div
        role="tablist"
        className="tabs tabs-lift ml-14 mr-14 shadow-md bg-base-200"
      >
        <BalanceGroupTabPanel
          errors={errorsForPrivate}
          action={billingAction}
          fetcher={fetcherBillingMeters}
          meterReport={meterReports.Быт}
          isSubmitting={isSubmittingBilling}
          balanceGroup="Быт"
        />

        <BalanceGroupTabPanel
          errors={errorsForLegalSims}
          action={billingAction}
          fetcher={fetcherBillingMeters}
          meterReport={meterReports["ЮР Sims"]}
          isSubmitting={isSubmittingBilling}
          balanceGroup="ЮР Sims"
        />

        <BalanceGroupTabPanel
          errors={errorsForLegalP2}
          action={billingAction}
          fetcher={fetcherBillingMeters}
          meterReport={meterReports["ЮР П2"]}
          isSubmitting={isSubmittingBilling}
          balanceGroup="ЮР П2"
        />

        <BalanceGroupTabPanel
          errors={errorsForOdpuSims}
          action={billingAction}
          fetcher={fetcherBillingMeters}
          meterReport={meterReports["ОДПУ Sims"]}
          isSubmitting={isSubmittingBilling}
          balanceGroup="ОДПУ Sims"
        />

        <BalanceGroupTabPanel
          errors={errorsForOdpuP2}
          action={billingAction}
          fetcher={fetcherBillingMeters}
          meterReport={meterReports["ОДПУ П2"]}
          isSubmitting={isSubmittingBilling}
          balanceGroup="ОДПУ П2"
        />
      </div>

      <Toast isVisible={isVisible} message="Данные успешно обновлены." />
    </main>
  );
}
