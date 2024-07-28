import type { LoaderFunctionArgs } from "@remix-run/node";
import invariant from "tiny-invariant";
import { selectTransSub } from "~/.server/db-queries/transformerSubstationTable";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import LinkToTransSub from "~/components/LinkToTransSub";

export const loader = async ({
  params
}: LoaderFunctionArgs) => {
  invariant(params.transSubId, 'Expected params.transSubId');

  if (!Number(params.transSubId)) {
    throw new Response('Not Found', { status: 404 });
  }

  const transSub = await selectTransSub(params.transSubId);

  if (!transSub) {
    throw new Response('Not Found', { status: 404 });
  }

  return json({ transSub });
};

export default function ChangeData() {
  const { transSub } = useLoaderData<typeof loader>();

  return (
    <main>
      <LinkToTransSub
        id={transSub.id}
        name={transSub.name}
      />
    </main>
  );
}
