import type { FetcherFormType } from "~/types";

const FetcherForm = ({
  children,
  fetcher,
  isSubmitting,
  metesRef,
  h2Title,
  formID
}: FetcherFormType) => {
  return (
    <fieldset
      className='flex flex-col gap-3 bg-base-200 p-5 rounded-lg'
      disabled={isSubmitting}
      form={formID}
    >
      <h2>{h2Title}</h2>
      <fetcher.Form
        className='flex flex-col gap-5 h-full'
        method='post'
        id={formID}
        ref={metesRef}
      >
        {children}
      </fetcher.Form>
    </fieldset>
  )
};

export default FetcherForm;
