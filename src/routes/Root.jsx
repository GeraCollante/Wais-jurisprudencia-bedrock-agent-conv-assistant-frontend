import { Outlet } from "react-router-dom";
import NavBar from "@components/NavBar";

export default function Root() {
  return (
    <div className="flex w-full h-[100vh] flex-col">
      <NavBar />
      <Outlet />
    </div>
  );
}
