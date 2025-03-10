import { useFetcher } from "react-router";
import DateInput from "~/components/DateInput";
import { useEffect, useRef } from "react";
import composeReports from "./.server/composeReports";
import DateInputWithoutDef from "./DateInputWithoutDef";
import SelectMonth from "./SelectMonth";
import SelectYear from "./SelectYear";
import InputExcel from "./InputExcel";
import { type FileUpload, parseFormData } from "@mjackson/form-data-parser";
import excelStorage from "~/routes/generate-reports/.server/fileStorage";
import type { Route } from "./+types/generateReports";

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
  const dates = Object.fromEntries(formData);

  await composeReports(dates);

  return Math.random() * 1000;
}

export default function GenerateReports() {
  const fetcher = useFetcher<typeof action>();
  const afterAction = fetcher.data;
  const isSubmitting = fetcher.state === "submitting";
  const formRef = useRef<HTMLFormElement>(null);

  const download = () => {
    const link = document.createElement("a");
    link.href = "/download";

    link.setAttribute("download", `Отчеты.zip`);

    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  };

  useEffect(() => {
    if (afterAction) download();
  }, [afterAction]);

  useEffect(() => {
    if (!isSubmitting) formRef.current?.reset();
  }, [isSubmitting]);

  return (
    <main className="mt-5 ml-10">
      <p className="mb-3 font-bold">Выберите даты для балансных групп</p>

      <fetcher.Form
        className="flex flex-col w-[30vw] gap-6"
        method="post"
        encType="multipart/form-data"
        ref={formRef}
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

        <section className="flex gap-19">
          <SelectMonth />
          <SelectYear />
        </section>

        <button
          className={`btn btn-xs sm:btn-sm md:btn-md lg:btn-lg btn-outline btn-primary mt-4 ${isSubmitting && "btn-active"}`}
          type={isSubmitting ? "button" : "submit"}
        >
          {isSubmitting && <span className="loading loading-spinner"></span>}
          {isSubmitting ? "Создание..." : "Сформировать"}
        </button>
      </fetcher.Form>
    </main>
  );
}
