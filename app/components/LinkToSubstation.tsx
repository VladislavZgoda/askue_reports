import { href, Link } from "react-router";

interface LinkProps {
  substationId: string;
  name: string;
}

export default function LinkToSubstation({ substationId, name }: LinkProps) {
  return (
    <Link
      to={href("/transformer-substations/:id", { id: substationId })}
      className="link link-neutral"
      prefetch="intent"
    >
      <h1 className="text-center mb-6 mt-2 font-bold text-xl">{name}</h1>
    </Link>
  );
}
