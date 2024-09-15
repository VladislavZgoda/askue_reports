import type { FetcherWithComponents } from "@remix-run/react";
import type { SerializeFrom } from "@remix-run/node";

type FetcherFormType = {
  children: React.ReactNode;
  fetcher: FetcherWithComponents<SerializeFrom<{
    errors: {
      [k: string]: string;
    };
  }> | null>;
  metesRef: React.RefObject<HTMLFormElement>;
  h2Title: string;
};

export default function FetcherForm({
  children,
  fetcher,
  metesRef,
  h2Title,
}: FetcherFormType) {
  return (
    <div className='flex flex-col gap-3 bg-base-200 p-5 rounded-lg'>

      <h2>{h2Title}</h2>

      <fetcher.Form className='flex flex-col gap-5 h-full' method='post' ref={metesRef}>

        {children}

      </fetcher.Form>
    </div>
  );
}
