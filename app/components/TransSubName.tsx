import { Form, useNavigate } from "react-router";

interface TransSubNameProps {
  transSub:
    | {
        id: number;
        name: string;
      }
    | undefined;
  isSubmitting: boolean;
  actionData:
    | {
        error: string;
        name: string;
      }
    | undefined;
  formAction: string;
  buttonNames: {
    submitName: string;
    idleName: string;
  };
}

export default function TransSubName({
  transSub,
  isSubmitting,
  actionData,
  formAction,
  buttonNames,
}: TransSubNameProps) {
  const navigate = useNavigate();

  return (
    <main className="flex flex-initial items-center justify-center h-full text-3xl">
      <Form
        method="post"
        action={formAction}
        className="flex p-8 h-2/5 w-3/5 flex-initial bg-base-200 rounded-lg"
      >
        <div className="flex flex-col justify-evenly items-center w-full h-full flex-initial">
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Наименование ТП</legend>
            <input
              type="text"
              placeholder="ТП-1000"
              className={`input input-xs md:input-md sm:input-sm lg:input-lg w-80
                ${actionData?.error ? "input-error" : "input-neutral"}`}
              name="name"
              defaultValue={actionData?.name ?? transSub?.name ?? ""}
            />
            {actionData?.error && (
              <p className="fieldset-label text-error">{actionData.error}</p>
            )}
          </fieldset>

          <div className="flex flex-initial justify-evenly w-full">
            <button
              type={isSubmitting ? "button" : "submit"}
              className="btn btn-primary btn-xs sm:btn-sm md:btn-md lg:btn-lg w-48"
            >
              {isSubmitting && (
                <span className="loading loading-spinner"></span>
              )}
              {isSubmitting
                ? `${buttonNames.submitName}`
                : `${buttonNames.idleName}`}
            </button>

            <button
              type="button"
              className="btn btn-success btn-xs sm:btn-sm md:btn-md lg:btn-lg w-48"
              onClick={() => void navigate(-1)}
            >
              Назад
            </button>
          </div>
        </div>
      </Form>
    </main>
  );
}
