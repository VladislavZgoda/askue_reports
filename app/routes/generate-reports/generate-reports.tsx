import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFetcher } from "react-router";
import { useRemixForm, getValidatedFormData } from "remix-hook-form";
import { useEffect } from "react";

import Select from "../../components/Select";
import InputExcel from "./components/InputExcel";
import Input from "../../components/Input";
import Button from "~/components/Button";
import Fieldset from "~/components/Fieldset";

import composeReports from "./.server/compose-reports";
import authMiddleware from "~/.server/middleware/auth";
import validateExcel from "./utils/validate-excel";

import type { Route } from "./+types/generate-reports";

import {
  todayDate,
  validatePreviousMonthDate,
  cutOutYear,
} from "~/utils/date-functions";

const formSchema = z
  .object({
    privateDate: z.string().min(1, { error: "Выберите дату." }),
    legalDate: z.string().min(1, { error: "Выберите дату." }),
    odpuDate: z.string().min(1, { error: "Выберите дату." }),
    privateMonth: z.optional(z.string()),
    legalMonth: z.optional(z.string()),
    odpuMonth: z.optional(z.string()),
    upload: z.optional(
      z.file().check(async (ctx) => {
        if (ctx.value && ctx.value.size > 0) {
          if (
            ctx.value.type !==
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          ) {
            ctx.issues.push({
              code: "invalid_type",
              message: "Тип файла не xlsx.",
              input: ctx.value,
              expected: "custom",
            });
          } else if (!(await validateExcel(ctx.value))) {
            ctx.issues.push({
              code: "custom",
              message: "Не корректные столбцы в приложении №9.",
              input: ctx.value,
              expected: "custom",
            });
          }
        }
      }),
    ),
    month: z.string({ error: "Выберите месяц." }),
    year: z.custom<string>(
      (year) => {
        if (typeof year === "number") {
          return String(year);
        }
      },
      { error: "Выберите год." },
    ),
  })
  .check((ctx) => {
    if (ctx.value.privateMonth) {
      const { privateDate, privateMonth } = ctx.value;
      const validationResult = validatePreviousMonthDate(
        privateDate,
        privateMonth,
      );
      if (!validationResult) {
        ctx.issues.push({
          code: "custom",
          message: "Диапазон больше одного месяца.",
          input: ctx.value.privateMonth,
          path: ["privateMonth"],
        });
      }
    }
    if (ctx.value.legalMonth) {
      const { legalDate, legalMonth } = ctx.value;
      const validationResult = validatePreviousMonthDate(legalDate, legalMonth);
      if (!validationResult) {
        ctx.issues.push({
          code: "custom",
          message: "Диапазон больше одного месяца.",
          input: ctx.value.legalMonth,
          path: ["legalMonth"],
        });
      }
    }
    if (ctx.value.odpuMonth) {
      const { odpuDate, odpuMonth } = ctx.value;
      const validationResult = validatePreviousMonthDate(odpuDate, odpuMonth);
      if (!validationResult) {
        ctx.issues.push({
          code: "custom",
          message: "Диапазон больше одного месяца.",
          input: ctx.value.odpuMonth,
          path: ["odpyMonth"],
        });
      }
    }
  })
  .readonly();

const resolver = zodResolver(formSchema);

export type FormData = z.infer<typeof formSchema>;

export const middleware: Route.MiddlewareFunction[] = [authMiddleware];

export function loader() {
  return null;
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
  const errors = fetcher.data;
  const defaultDate = todayDate();
  const year = cutOutYear(todayDate());
  const redStar = <span className="text-red-600 text-sm">*</span>;

  const { handleSubmit, register, reset } = useRemixForm<FormData>({
    resolver,
    fetcher,
    defaultValues: {
      privateDate: defaultDate,
      legalDate: defaultDate,
      odpuDate: defaultDate,
      privateMonth: "",
      legalMonth: "",
      odpuMonth: "",
      month: "Выбрать месяц",
      year: "Выбрать год",
    },
  });

  const handleReset = () => {
    if (isSubmitting) return;

    reset();
    fetcher.unstable_reset();
  };

  useEffect(() => {
    if (!fetcher.data && fetcher.state === "idle") {
      reset();
    }
  }, [fetcher.data, fetcher.state, reset]);

  return (
    <main className="mt-5 ml-10">
      <h1 className="font-bold text-xl">
        Выберите даты для данных из балансных групп
      </h1>
      <p className="mb-1.5 text-xs">
        Необязательно: добавить данные из прошлого месяца в текущий
      </p>

      <fetcher.Form
        onSubmit={void handleSubmit}
        className="flex flex-col w-[30vw] gap-6"
        method="post"
        encType="multipart/form-data"
      >
        <section className="flex flex-col">
          <div className="flex gap-18 mb-1">
            <Fieldset className="w-full" legend={<div>Быт{redStar}</div>}>
              <Input
                type="date"
                error={errors?.privateDate?.message}
                {...register("privateDate")}
              />
            </Fieldset>

            <Fieldset
              className="w-full"
              legend="Быт прошлый месяц (необязательно)"
            >
              <Input
                type="date"
                error={errors?.privateMonth?.message}
                {...register("privateMonth")}
              />
            </Fieldset>
          </div>
          <div className="flex gap-18 mb-1">
            <Fieldset className="w-full" legend={<div>Юр{redStar}</div>}>
              <Input
                type="date"
                error={errors?.legalDate?.message}
                {...register("legalDate")}
              />
            </Fieldset>

            <Fieldset
              className="w-full"
              legend="Юр прошлый месяц (необязательно)"
            >
              <Input
                type="date"
                error={errors?.legalMonth?.message}
                {...register("legalMonth")}
              />
            </Fieldset>
          </div>
          <div className="flex gap-18">
            <Fieldset className="w-full" legend={<div>ОДПУ{redStar}</div>}>
              <Input
                type="date"
                error={errors?.odpuDate?.message}
                {...register("odpuDate")}
              />
            </Fieldset>

            <Fieldset
              className="w-full"
              legend="ОДПУ прошлый месяц (необязательно)"
            >
              <Input
                type="date"
                error={errors?.odpuMonth?.message}
                {...register("odpuMonth")}
              />
            </Fieldset>
          </div>
        </section>

        <h2 className="font-semibold -mb-5">
          Выберите месяц и год для заголовков отчётов
        </h2>

        <section className="flex gap-18">
          <Fieldset className="w-full" legend={<div>Месяц{redStar}</div>}>
            <Select error={errors?.month?.message} {...register("month")}>
              <option disabled={true}>Выбрать месяц</option>
              {months.map((item, index) => (
                <option key={index}>{item}</option>
              ))}
            </Select>
          </Fieldset>

          <Fieldset className="w-full" legend={<div>Год{redStar}</div>}>
            <Select error={errors?.year?.message} {...register("year")}>
              <option disabled={true}>Выбрать год</option>
              <option>{year - 1}</option>
              <option>{year}</option>
            </Select>
          </Fieldset>
        </section>

        <h2 className="font-semibold -mb-5">
          Добавить данные из приложения №9 (необязательно)
        </h2>

        <Fieldset legend="Файл Приложение №9">
          <InputExcel error={errors?.upload?.message} {...register("upload")} />
        </Fieldset>

        <div className="mt-2.5 flex gap-18">
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
            onClick={handleReset}
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
