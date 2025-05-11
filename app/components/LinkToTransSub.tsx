import { Link } from "react-router";

interface LinkProps {
  id: number;
  name: string;
}

export default function LinkToTransSub({ id, name }: LinkProps) {
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
