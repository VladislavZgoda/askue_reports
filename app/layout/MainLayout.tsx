import Header from "~/components/Header";
import Siderbar from "~/components/Siderbar";
import Footer from "~/components/Footer";

import { useState } from "react";
import { useRouteLoaderData } from "react-router";

type Substations =
  | {
      id: number;
      name: string;
    }[]
  | undefined;

export type SetQuery = React.Dispatch<React.SetStateAction<string>>;

export interface SiderbarProps {
  substations: Substations;
  query: string;
  setQuery: SetQuery;
}

interface SubstationSearchParams {
  substations: Substations;
  q: string | null | undefined;
}

export default function MainLayout() {
  const data = useRouteLoaderData<SubstationSearchParams>("root");
  const [query, setQuery] = useState(data?.q ?? "");

  return (
    <>
      <Header setQuery={setQuery} />
      <Siderbar
        substations={data?.substations}
        query={query}
        setQuery={setQuery}
      />
      <Footer />
    </>
  );
}
