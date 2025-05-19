import { useFetcher } from "react-router";
import composeReports from "./.server/composeReports";
import SelectMonth from "./SelectMonth";
import SelectYear from "./SelectYear";
import InputExcel from "./InputExcel";
import type { Route } from "./+types/generateReports";
import { isNotAuthenticated } from "~/.server/services/auth";
import * as z from "zod";
import { useRemixForm, getValidatedFormData } from "remix-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "./Input";
import { todayDate } from "~/utils/dateFunctions";
import validateExcel from "./validateExcel";
import { useEffect } from "react";

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
    year: z.union([z.number(), z.string()]).optional(),
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

  link.setAttribute("download", `Отчеты.zip`);

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

  const { handleSubmit, register, reset } = useRemixForm<FormData>({
    resolver,
    fetcher,
    defaultValues: {
      privateDate: defaultDate,
      legalDate: defaultDate,
      odpyDate: defaultDate,
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
        <section className="flex flex-row gap-16 flex-auto">
          <div className="flex-auto">
            <Input
              type="date"
              error={errors?.privateDate?.message}
              legend="Быт"
              {...register("privateDate")}
            />
            <Input
              type="date"
              error={errors?.legalDate?.message}
              legend="Юр"
              {...register("legalDate")}
            />
            <Input
              type="date"
              error={errors?.odpyDate?.message}
              legend="ОДПУ"
              {...register("odpyDate")}
            />
          </div>

          <div className="flex-auto">
            <Input
              type="date"
              legend="Быт прошлый месяц"
              {...register("privateMonth")}
            />
            <Input
              type="date"
              legend="Юр прошлый месяц"
              {...register("legalMonth")}
            />
            <Input
              type="date"
              legend="ОДПУ прошлый месяц"
              {...register("odpyMonth")}
            />
          </div>
        </section>

        <InputExcel error={errors?.upload?.message} {...register("upload")} />

        <section className="flex">
          <div className="mr-auto">
            <SelectMonth
              error={errors?.month?.message}
              {...register("month")}
            />
          </div>
          <SelectYear error={errors?.year?.message} {...register("year")} />
        </section>

        <button
          className={`btn btn-xs sm:btn-sm md:btn-md lg:btn-lg btn-outline btn-primary mt-4
            ${isSubmitting && "btn-active"}`}
          type={isSubmitting ? "button" : "submit"}
        >
          {isSubmitting && <span className="loading loading-spinner"></span>}
          {isSubmitting ? "Создание..." : "Сформировать"}
        </button>
      </fetcher.Form>
    </main>
  );
}
