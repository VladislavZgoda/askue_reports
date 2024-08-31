import { Link } from "@remix-run/react";
import type { LinkType } from "~/types";

export default function LinkToTransSub({
  id, name
}: LinkType) {
  return (
    <Link to={`/transformer-substations/${id}`}
      className='link link-neutral'>
      <h1 className='text-center mb-6 mt-2 font-bold text-xl'>
        {name}
      </h1>
    </Link>
  );
}
