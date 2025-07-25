import Form from "./Form";
import Input from "./Input";
import Container from "./Container";
import TabPanel from "./TabPanel";
import Button from "./Button";
import BtnContainer from "./BtnContainer";
import { isErrors } from "~/utils/checkErrors";
import type { FetcherWithComponents } from "react-router";

interface PanelProps {
  label: string;
  checked?: boolean;
  fetcher: FetcherWithComponents<{
    errors: Record<string, string>;
  } | null>;
  isSubmitting: boolean;
  data: {
    registeredMeterCount: number;
    unregisteredMeterCount: number;
    yearlyMeterInstallations: {
      totalInstalled: number;
      registeredCount: number;
    };
    monthlyMeterInstallations: {
      totalInstalled: number;
      registeredCount: number;
    };
  };
  errors: Record<string, string>;
  btnValue: string;
}

export default function Panel({
  label,
  errors,
  data,
  checked = false,
  fetcher,
  isSubmitting,
  btnValue,
}: PanelProps) {
  return (
    <TabPanel checked={checked} label={label}>
      <Form fetcher={fetcher}>
        <Container heading="Всего счетчиков">
          <Input
            label="Количество ПУ"
            name="totalMeters"
            error={errors?.totalDiff}
            defValue={data.registeredMeterCount + data.unregisteredMeterCount}
            errors={isErrors(errors)}
          />

          <Input
            label="Из них в системе"
            name="inSystemTotal"
            error={errors?.totalDiff}
            defValue={data.registeredMeterCount}
            errors={isErrors(errors)}
          />
        </Container>

        <Container heading="Установлено за год">
          <Input
            label="Количество ПУ"
            name="yearTotal"
            error={errors?.yearDiff}
            defValue={data.yearlyMeterInstallations.totalInstalled}
            errors={isErrors(errors)}
          />

          <Input
            label="Из них в системе"
            name="inSystemYear"
            error={errors?.yearDiff}
            defValue={data.yearlyMeterInstallations.registeredCount}
            errors={isErrors(errors)}
          />
        </Container>

        <Container heading="Установлено в этом месяце">
          <Input
            label="Количество ПУ"
            name="monthTotal"
            error={errors?.monthDiff}
            defValue={data.monthlyMeterInstallations.totalInstalled}
            errors={isErrors(errors)}
          />

          <Input
            label="Из них в системе"
            name="inSystemMonth"
            error={errors?.monthDiff}
            defValue={data.monthlyMeterInstallations.registeredCount}
            errors={isErrors(errors)}
          />
        </Container>

        <BtnContainer errors={isErrors(errors)}>
          <Button buttonValue={btnValue} isSubmitting={isSubmitting} />
        </BtnContainer>
      </Form>
    </TabPanel>
  );
}
