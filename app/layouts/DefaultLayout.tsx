import { Outlet } from "react-router";

export default function DefaultLayout() {
  return (
    <div className="bg-base-200 box-border font-sans">
      <div className="flex h-screen w-screen items-center justify-center">
        <Outlet />
      </div>
    </div>
  );
}
