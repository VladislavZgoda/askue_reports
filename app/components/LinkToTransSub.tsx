import { Link } from "react-router";

type LinkType = {
  id: number;
  name: string;
};

export default function LinkToTransSub({ id, name }: LinkType) {
  return (
    <Link
      to={`/transformer-substations/${id}`}
      className="link link-neutral"
      prefetch="intent"
    >
      <h1 className="text-center mb-6 mt-2 font-bold text-xl">{name}</h1>
    </Link>
  );
}
