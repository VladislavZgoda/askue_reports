import { Link } from "@remix-run/react";

type LinkType = {
  id: number;
  name: string;
};

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
