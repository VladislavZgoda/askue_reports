import Form from "./Form";
import Input from "./Input";
import Container from "./Container";
import TabPanel from "./components/TabPanel";
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
            defValue={data.registeredMeters + data.unregisteredMeters}
            errors={isErrors(errors)}
          />

          <Input
            label="Из них в системе"
            name="inSystemTotal"
            error={errors?.totalDiff}
            defValue={data.registeredMeters}
            errors={isErrors(errors)}
          />
        </Container>

        <Container heading="Установлено за год">
          <Input
            label="Количество ПУ"
            name="yearTotal"
            error={errors?.yearDiff}
            defValue={data.yearlyInstallation.totalInstalled}
            errors={isErrors(errors)}
          />

          <Input
            label="Из них в системе"
            name="inSystemYear"
            error={errors?.yearDiff}
            defValue={data.yearlyInstallation.registeredCount}
            errors={isErrors(errors)}
          />
        </Container>

        <Container heading="Установлено в этом месяце">
          <Input
            label="Количество ПУ"
            name="monthTotal"
            error={errors?.monthDiff}
            defValue={data.monthlyInstallation.totalInstalled}
            errors={isErrors(errors)}
          />

          <Input
            label="Из них в системе"
            name="inSystemMonth"
            error={errors?.monthDiff}
            defValue={data.monthlyInstallation.registeredCount}
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
