import { Outlet } from "react-router-dom";
import NavBar from "@components/NavBar";
import SessionSidebar from "@components/SessionSidebar";

export default function Root() {
  return (
    <div className="flex w-full h-[100vh] flex-col">
      <NavBar />
      <div className="flex flex-1 overflow-hidden">
        <SessionSidebar />
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
