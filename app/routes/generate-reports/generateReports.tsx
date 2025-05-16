import { useFetcher } from "react-router";
import DateInput from "~/components/DateInput";
import composeReports from "./.server/composeReports";
import DateInputWithoutDef from "./DateInputWithoutDef";
import SelectMonth from "./SelectMonth";
import SelectYear from "./SelectYear";
import InputExcel from "./InputExcel";
import { type FileUpload, parseFormData } from "@mjackson/form-data-parser";
import excelStorage from "~/routes/generate-reports/.server/fileStorage";
import type { Route } from "./+types/generateReports";
import { isNotAuthenticated } from "~/.server/services/auth";
import * as z from "zod";
import { useRemixForm, getValidatedFormData } from "remix-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  privateDate: z.string().min(1),
  legalDate: z.string().min(1),
  odpyDate: z.string().min(1),
  privateMonth: z.string().optional(),
  legalMonth: z.string().optional(),
  odpyMonth: z.string().optional(),
  month: z.string().min(1),
  year: z.string().min(1),
});

const resolver = zodResolver(formSchema);

export type FormData = z.infer<typeof formSchema>;

export async function loader({ request }: Route.LoaderArgs) {
  return await isNotAuthenticated(request);
}

export async function action({ request }: Route.ActionArgs) {
  const uploadHandler = async (fileUpload: FileUpload) => {
    if (
      fileUpload.fieldName === "upload" &&
      fileUpload.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      await excelStorage.set("supplementNine", fileUpload);
    }
  };

  const formData = await parseFormData(request, uploadHandler);
  const { errors, data } = await getValidatedFormData<FormData>(
    formData,
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
  const isSubmitting = fetcher.state === "loading";

  const {
    handleSubmit,
    formState: { errors },
    register,
    reset,
  } = useRemixForm<FormData>({
    mode: "onSubmit",
    resolver,
    fetcher,
  });

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
            <DateInput labelText="Быт" inputName="privateDate" />
            <DateInput labelText="Юр" inputName="legalDate" />
            <DateInput labelText="ОДПУ" inputName="odpyDate" />
          </div>

          <div className="flex-auto">
            <DateInputWithoutDef
              labelText="Быт прошлый месяц"
              inputName="privateMonth"
            />
            <DateInputWithoutDef
              labelText="Юр прошлый месяц"
              inputName="legalMonth"
            />
            <DateInputWithoutDef
              labelText="ОДПУ прошлый месяц"
              inputName="odpyMonth"
            />
          </div>
        </section>

        <InputExcel />

        <section className="flex">
          <div className="mr-auto">
            <SelectMonth />
          </div>
          <SelectYear />
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
