import { useState } from "react";
import { Outlet } from "react-router-dom";
import NavBar from "@components/NavBar";
import SessionSidebar from "@components/SessionSidebar";

export default function Root() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex w-full h-[100vh] flex-col">
      <NavBar
        onMenuToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        isMobileMenuOpen={isMobileSidebarOpen}
      />
      <div className="flex flex-1 overflow-hidden">
        <SessionSidebar
          isMobileOpen={isMobileSidebarOpen}
          setIsMobileOpen={setIsMobileSidebarOpen}
        />
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
