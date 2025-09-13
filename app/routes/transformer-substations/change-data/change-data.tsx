import { href, useFetcher } from "react-router";
import { useState, useEffect, useRef } from "react";

import authMiddleware from "~/.server/middleware/auth";
import { getTransformerSubstationById } from "~/.server/db-queries/transformer-substations";

import {
  loadAllSubstationMeterReports,
  loadTechnicalMeters,
} from "./.server/db-actions/load-data";

import BalanceGroupTabPanel from "./components/BalanceGroupTabPanel";
import TechnicalMetersTabPanel from "./components/TechnicalMetersTabPanel";
import LinkToSubstation from "~/components/LinkToSubstation";
import Toast from "~/components/Toast";

import type { Route } from "./+types/change-data";
import type { BillingFormErrors } from "./validation/billing-form.schema";
import type { TechnicalFormErrors } from "./validation/technical-form.schema";

export const middleware: Route.MiddlewareFunction[] = [authMiddleware];

export const loader = async ({ params }: Route.LoaderArgs) => {
  if (!Number(params.id)) {
    throw new Error("Not Found");
  }

  const substation = await getTransformerSubstationById(Number(params.id));

  if (!substation) {
    throw new Error("Not Found");
  }

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
  const fetcherTechnicalMeters = useFetcher<TechnicalFormErrors>();

  const submissionStateRef = useRef({
    isSubmitting: false,
    lastAction: "",
  });

  const fetcherBillingData = fetcherBillingMeters.data;
  const isSubmittingBilling = fetcherBillingMeters.state === "submitting";

  const billingAction = href(
    "/transformer-substations/:id/change-billing-meters",
    {
      id: substation.id.toString(),
    },
  );

  const fetcherTechnicalData = fetcherTechnicalMeters.data;
  const isSubmittingTechnical = fetcherTechnicalMeters.state === "submitting";

  const technicalAction = href(
    "/transformer-substations/:id/change-technical-meters",
    {
      id: substation.id.toString(),
    },
  );

  useEffect(() => {
    if (isSubmittingTechnical) {
      submissionStateRef.current = {
        isSubmitting: true,
        lastAction: fetcherTechnicalMeters.formAction || "",
      };
    } else if (submissionStateRef.current.isSubmitting) {
      if (fetcherTechnicalData === null) {
        setIsVisible(true);
        setTimeout(() => setIsVisible(false), 4000);

        fetcherTechnicalMeters.data = undefined;
      }
    }
  }, [
    isSubmittingTechnical,
    fetcherTechnicalMeters.formAction,
    fetcherTechnicalData,
    fetcherTechnicalMeters,
  ]);

  useEffect(() => {
    if (isSubmittingBilling) {
      submissionStateRef.current = {
        isSubmitting: true,
        lastAction: fetcherBillingMeters.formAction || "",
      };
    } else if (submissionStateRef.current.isSubmitting) {
      if (submissionStateRef.current.lastAction === billingAction) {
        if (fetcherBillingData === null) {
          setIsVisible(true);
          setTimeout(() => setIsVisible(false), 4000);

          fetcherBillingMeters.data = undefined;
        }
      }

      submissionStateRef.current.isSubmitting = false;
    }
  }, [
    isSubmittingBilling,
    fetcherBillingData,
    billingAction,
    fetcherBillingMeters,
  ]);

  const errorsForPrivate =
    fetcherBillingData?.errors &&
    fetcherBillingData.defaultValues?.balanceGroup === "Быт"
      ? fetcherBillingData.errors
      : undefined;

  const errorsForLegalSims =
    fetcherBillingData?.errors &&
    fetcherBillingData.defaultValues?.balanceGroup === "ЮР Sims"
      ? fetcherBillingData.errors
      : undefined;

  const errorsForLegalP2 =
    fetcherBillingData?.errors &&
    fetcherBillingData.defaultValues?.balanceGroup === "ЮР П2"
      ? fetcherBillingData.errors
      : undefined;

  const errorsForOdpuSims =
    fetcherBillingData?.errors &&
    fetcherBillingData.defaultValues?.balanceGroup === "ОДПУ Sims"
      ? fetcherBillingData.errors
      : undefined;

  const errorsForOdpuP2 =
    fetcherBillingData?.errors &&
    fetcherBillingData.defaultValues?.balanceGroup === "ОДПУ П2"
      ? fetcherBillingData.errors
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

        <TechnicalMetersTabPanel
          errors={fetcherTechnicalData}
          action={technicalAction}
          fetcher={fetcherTechnicalMeters}
          technicalMeters={technicalMeters}
          isSubmitting={isSubmittingTechnical}
        />
      </div>

      <Toast isVisible={isVisible} message="Данные успешно обновлены." />
    </main>
  );
}
