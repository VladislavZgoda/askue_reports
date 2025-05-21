import { useFetcher } from "react-router";
import composeReports from "./.server/composeReports";
import Select from "../../components/Select";
import InputExcel from "./components/InputExcel";
import type { Route } from "./+types/generateReports";
import { isNotAuthenticated } from "~/.server/services/auth";
import * as z from "zod";
import { useRemixForm, getValidatedFormData } from "remix-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "../../components/Input";
import validateExcel from "./utils/validateExcel";
import { useEffect } from "react";
import Button from "~/components/Button";
import Fieldset from "~/components/Fieldset";

import {
  todayDate,
  validatePreviousMonthDate,
  cutOutYear,
} from "~/utils/dateFunctions";

const formSchema = z
  .object({
    privateDate: z.string().min(1, { message: "Выберите дату." }),
    legalDate: z.string().min(1, { message: "Выберите дату." }),
    odpyDate: z.string().min(1, { message: "Выберите дату." }),
    privateMonth: z.string().optional(),
    legalMonth: z.string().optional(),
    odpyMonth: z.string().optional(),
    upload: z
      .instanceof(File)
      .optional()
      .superRefine(async (file, ctx) => {
        if (file && file.size > 0) {
          if (
            file.type !==
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Тип файла не xlsx.",
            });
          } else if (!(await validateExcel(file))) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Не корректные столбцы в приложении №9.",
            });
          }
        }
      }),
    month: z.string().optional(),
    year: z.coerce.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.upload && data.upload.size > 0) {
      if (!data.month) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Выберите месяц.",
          path: ["month"],
        });
      }
      if (!data.year) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Выберите год.",
          path: ["year"],
        });
      }
    }
    if (data.privateMonth) {
      const { privateDate, privateMonth } = data;
      const validationResult = validatePreviousMonthDate(
        privateDate,
        privateMonth,
      );
      if (!validationResult) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Диапазон больше одного месяца.",
          path: ["privateMonth"],
        });
      }
    }
    if (data.legalMonth) {
      const { legalDate, legalMonth } = data;
      const validationResult = validatePreviousMonthDate(legalDate, legalMonth);
      if (!validationResult) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Диапазон больше одного месяца.",
          path: ["legalMonth"],
        });
      }
    }
    if (data.odpyMonth) {
      const { odpyDate, odpyMonth } = data;
      const validationResult = validatePreviousMonthDate(odpyDate, odpyMonth);
      if (!validationResult) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Диапазон больше одного месяца.",
          path: ["odpyMonth"],
        });
      }
    }
  })
  .readonly();

const resolver = zodResolver(formSchema);

export type FormData = z.infer<typeof formSchema>;

export async function loader({ request }: Route.LoaderArgs) {
  return await isNotAuthenticated(request);
}

export async function action({ request }: Route.ActionArgs) {
  const { errors, data } = await getValidatedFormData<FormData>(
    request,
    resolver,
  );

  if (errors) return errors;

  await composeReports(data);

  return null;
}

export async function clientAction({ serverAction }: Route.ClientActionArgs) {
  const serverErrors = await serverAction();

  if (serverErrors) return serverErrors;

  const link = document.createElement("a");
  link.href = "/download";

  link.setAttribute("download", "Отчеты.zip");

  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);

  return null;
}

export default function GenerateReports() {
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state === "submitting";
  const defaultDate = todayDate();
  const errors = fetcher.data;
  const year = cutOutYear(todayDate());

  const { handleSubmit, register, reset } = useRemixForm<FormData>({
    resolver,
    fetcher,
    defaultValues: {
      privateDate: defaultDate,
      legalDate: defaultDate,
      odpyDate: defaultDate,
      privateMonth: "",
      legalMonth: "",
      odpyMonth: "",
      month: "Выбрать месяц",
      year: "Выбрать год",
    },
  });

  useEffect(() => {
    if (!fetcher.data) reset();
  }, [fetcher.data]);

  return (
    <main className="mt-5 ml-10">
      <p className="mb-3 font-bold">Выберите даты для балансных групп</p>

      <fetcher.Form
        onSubmit={void handleSubmit}
        className="flex flex-col w-[30vw] gap-6"
        method="post"
        encType="multipart/form-data"
      >
        <section className="flex flex-col">
          <div className="flex gap-18 mb-1">
            <Fieldset className="w-full" legend="Быт">
              <Input
                type="date"
                error={errors?.privateDate?.message}
                {...register("privateDate")}
              />
            </Fieldset>

            <Fieldset className="w-full" legend="Быт прошлый месяц">
              <Input
                type="date"
                error={errors?.privateMonth?.message}
                {...register("privateMonth")}
              />
            </Fieldset>
          </div>
          <div className="flex gap-18 mb-1">
            <Fieldset className="w-full" legend="Юр">
              <Input
                type="date"
                error={errors?.legalDate?.message}
                {...register("legalDate")}
              />
            </Fieldset>

            <Fieldset className="w-full" legend="Юр прошлый месяц">
              <Input
                type="date"
                error={errors?.legalMonth?.message}
                {...register("legalMonth")}
              />
            </Fieldset>
          </div>
          <div className="flex gap-18">
            <Fieldset className="w-full" legend="ОДПУ">
              <Input
                type="date"
                error={errors?.odpyDate?.message}
                {...register("odpyDate")}
              />
            </Fieldset>

            <Fieldset className="w-full" legend="ОДПУ прошлый месяц">
              <Input
                type="date"
                error={errors?.odpyMonth?.message}
                {...register("odpyMonth")}
              />
            </Fieldset>
          </div>
        </section>

        <InputExcel error={errors?.upload?.message} {...register("upload")} />

        <section className="flex gap-18">
          <Fieldset
            className="w-full"
            legend="Выберете месяц для заголовков таблиц Excel"
          >
            <Select error={errors?.month?.message} {...register("month")}>
              <option disabled={true}>Выбрать месяц</option>
              {months.map((item, index) => (
                <option key={index}>{item}</option>
              ))}
            </Select>
          </Fieldset>

          <Fieldset
            className="w-full"
            legend="Выберете год для заголовков таблиц Excel"
          >
            <Select error={errors?.year?.message} {...register("year")}>
              <option disabled={true}>Выбрать год</option>
              <option>{year - 1}</option>
              <option>{year}</option>
            </Select>
          </Fieldset>
        </section>

        <div className="mt-4 flex gap-18">
          <Button
            className={`flex-1 btn-primary ${isSubmitting && "btn-active"}`}
            type={isSubmitting ? "button" : "submit"}
          >
            {isSubmitting && <span className="loading loading-spinner"></span>}
            {isSubmitting ? "Создание..." : "Сформировать"}
          </Button>

          <Button
            className="flex-1 btn-neutral"
            type="button"
            onClick={() => reset()}
          >
            Очистить форму
          </Button>
        </div>
      </fetcher.Form>
    </main>
  );
}

const months = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
] as const;
