import Form from "./Form";
import Input from "./Input";
import Container from "./Container";
import TabPanel from "./TabPanel";
import Button from "./Button";
import BtnInputContainer from "./BtnInputContainer";
import type { PanelPropType } from "~/types";

export default function Panel({
  label, errors, data, checked = false,
  fetcher, isSubmitting, btnValue
}: PanelPropType) {
  const isErrors = (
    errors: { [k: string]: string; }
  ) => {
    return Object.keys(errors).length > 0;
  };

  return (
    <TabPanel checked={checked} label={label}>
      <Form fetcher={fetcher} isSubmitting={isSubmitting}>
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
