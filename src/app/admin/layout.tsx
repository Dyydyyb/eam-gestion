"use client";

import React, { useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { NewBookingModal } from "@/components/admin/NewBookingModal";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newBookingModalOpen, setNewBookingModalOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Sidebar fijo en mobile, sticky en desktop */}
      <AdminSidebar
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* Contenedor principal alineado naturalmente al lado del sidebar */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <AdminHeader
          onMenuClick={() => setMobileMenuOpen(true)}
          onNewBookingClick={() => setNewBookingModalOpen(true)}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Modal global de nuevo turno */}
      <NewBookingModal
        isOpen={newBookingModalOpen}
        onClose={() => setNewBookingModalOpen(false)}
      />
    </div>
  );
}
