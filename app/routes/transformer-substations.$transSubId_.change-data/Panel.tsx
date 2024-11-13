import Form from "./Form";
import Input from "./Input";
import Container from "./Container";
import TabPanel from "./TabPanel";
import Button from "./Button";
import BtnInputContainer from "./BtnInputContainer";
import { isErrors } from "~/utils/checkErrors";
import type { FetcherWithComponents } from "@remix-run/react";

type PanelPropType = {
  label: string;
  checked?: boolean;
  fetcher: FetcherWithComponents<{
    errors: {
      [k: string]: string;
    };
  } | null>;
  isSubmitting: boolean;
  data: {
    totalMeters: {
      quantity: number;
      addedToSystem: number;
    };
    totalYearMeters: {
      quantity: number;
      addedToSystem: number;
    };
    totalMonthMeters: {
      quantity: number;
      addedToSystem: number;
    };
    failedMeters: number;
  };
  errors: {
    [k: string]: string;
  };
  btnValue: string;
};

export default function Panel({
  label, errors, data, checked = false,
  fetcher, isSubmitting, btnValue
}: PanelPropType) {
  return (
    <TabPanel checked={checked} label={label}>
      <Form fetcher={fetcher}>
        <Container heading="Всего счетчиков">
          <Input
            label="Количество ПУ"
            name="totalMeters"
            error={errors?.totalDiff}
            defValue={data.totalMeters.quantity}
            errors={isErrors(errors)} />

          <Input
            label="Из них в системе"
            name="inSystemTotal"
            error={errors?.totalDiff}
            defValue={data.totalMeters.addedToSystem}
            errors={isErrors(errors)} />
        </Container>

        <Container heading="Установлено за год">
          <Input
            label="Количество ПУ"
            name="yearTotal"
            error={errors?.yearDiff}
            defValue={data.totalYearMeters.quantity}
            errors={isErrors(errors)} />

          <Input
            label="Из них в системе"
            name="inSystemYear"
            error={errors?.yearDiff}
            defValue={data.totalYearMeters.addedToSystem}
            errors={isErrors(errors)} />
        </Container>

        <Container heading="Установлено в этом месяце">
          <Input
            label="Количество ПУ"
            name="monthTotal"
            error={errors?.monthDiff}
            defValue={data.totalMonthMeters.quantity}
            errors={isErrors(errors)} />

          <Input
            label="Из них в системе"
            name="inSystemMonth"
            error={errors?.monthDiff}
            defValue={data.totalMonthMeters.addedToSystem}
            errors={isErrors(errors)} />
        </Container>

        <BtnInputContainer errors={isErrors(errors)}>
          <Input
            label="Количество ПУ"
            name="failedMeters"
            defValue={data.failedMeters} />

          <Button
            buttonValue={btnValue}
            isSubmitting={isSubmitting} />
        </BtnInputContainer>
      </Form>
    </TabPanel>
  );
}
