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
      <h1 className="mt-2 mb-6 text-center text-xl font-bold">{name}</h1>
    </Link>
  );
}
