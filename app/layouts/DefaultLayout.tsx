import { Outlet } from "react-router";

export default function DefaultLayout() {
  return (
    <div className="font-sans bg-base-200 box-border">
      <div className="h-screen w-screen flex justify-center items-center">
        <Outlet />
      </div>
    </div>
  );
}
