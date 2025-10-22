import Header from "~/components/Header";
import Siderbar from "~/components/Siderbar";
import Footer from "~/components/Footer";

import { useState } from "react";
import { useRouteLoaderData, useNavigation, Outlet } from "react-router";

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

export default function DashboardLayout() {
  const data = useRouteLoaderData<SubstationSearchParams>("root");
  const [query, setQuery] = useState(data?.q ?? "");
  const navigation = useNavigation();

  return (
    <div className="font-sans box-border grid grid-cols-[1fr_1fr_1fr_1fr_1fr] grid-rows-[1fr_2fr_2fr_2fr_3rem] lg:grid-cols-[24rem_1fr_1fr_1fr_1fr] lg:grid-rows-[8rem_2fr_2fr_2fr_3rem]">
      <Header setQuery={setQuery} />
      <Siderbar
        substations={data?.substations}
        query={query}
        setQuery={setQuery}
      />
      <Footer />
      <div className="col-start-2 col-span-4 row-start-2 row-span-3">
        {navigation.state === "loading" ? <Spinner /> : <Outlet />}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center items-center h-full">
      <span className="loading loading-spinner text-primary size-72"></span>
    </div>
  );
}
