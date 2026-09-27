"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Users,
  Layers,
  UserCheck,
  Car,
  DollarSign,
  BarChart3,
  MessageSquare,
  Settings,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  roles?: string[];
}

export function AdminSidebar({
  mobileOpen,
  setMobileOpen,
  collapsed: externalCollapsed,
  setCollapsed: externalSetCollapsed,
}: {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
}) {
  const pathname = usePathname();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const setCollapsed = externalSetCollapsed || setInternalCollapsed;
  const { role, lessons, vehicles, packageAssignments } = useApp();

  // Contadores dinámicos para badges
  const pendingRemindersCount = lessons.filter(
    (l) => !l.whatsapp_reminder_sent && l.status === "confirmada"
  ).length;

  const urgentVehiclesCount = vehicles.filter((v) => v.status === "en_taller").length;

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      roles: ["admin", "recepcion", "finanzas", "instructor"],
    },
    {
      label: "Agenda y Turnos",
      href: "/admin/agenda",
      icon: Calendar,
      roles: ["admin", "recepcion", "instructor"],
    },
    {
      label: "Clases Pendientes",
      href: "/admin/clases-pendientes",
      icon: Clock,
      roles: ["admin", "recepcion"],
    },
    {
      label: "Alumnos / CRM",
      href: "/admin/clientes",
      icon: Users,
      roles: ["admin", "recepcion", "instructor"],
    },
    {
      label: "Packs y Aranceles",
      href: "/admin/packs",
      icon: Layers,
      roles: ["admin", "recepcion", "finanzas"],
    },
    {
      label: "Personal Docente",
      href: "/admin/personal",
      icon: UserCheck,
      roles: ["admin", "recepcion", "finanzas"],
    },
    {
      label: "Flota de Autos",
      href: "/admin/flota",
      icon: Car,
      badge: urgentVehiclesCount > 0 ? urgentVehiclesCount : undefined,
      roles: ["admin", "recepcion", "instructor"],
    },
    {
      label: "Finanzas y Caja",
      href: "/admin/finanzas",
      icon: DollarSign,
      roles: ["admin", "finanzas", "recepcion"],
    },
    {
      label: "Reportes",
      href: "/admin/reportes",
      icon: BarChart3,
      roles: ["admin", "finanzas"],
    },
    {
      label: "WhatsApp & Alertas",
      href: "/admin/comunicaciones",
      icon: MessageSquare,
      badge: pendingRemindersCount > 0 ? pendingRemindersCount : undefined,
      roles: ["admin", "recepcion"],
    },
    {
      label: "Configuración",
      href: "/admin/configuracion",
      icon: Settings,
      roles: ["admin"],
    },
  ];

  const visibleItems = navItems.filter((item) => !item.roles || item.roles.includes(role));

  return (
    <>
      {/* Backdrop para mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "bg-[#022554] text-white border-r border-[#03387E] transition-all duration-300 ease-in-out flex flex-col",
          // Mobile: drawer flotante
          "fixed inset-y-0 left-0 z-50",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: elemento flex sticky que nunca solapa el contenido
          "lg:static lg:inset-auto lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0 lg:z-30",
          collapsed ? "w-20" : "w-64"
        )}
      >
        {/* Header con Logo Oficial EAM */}
        <div className="flex items-center justify-between h-20 px-4 border-b border-white/10 bg-[#011634]/70">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-3 overflow-hidden group"
            onClick={() => setMobileOpen(false)}
          >
            <div className="relative w-11 h-11 shrink-0 bg-white rounded-2xl p-1 shadow-md shadow-black/30 flex items-center justify-center overflow-hidden ring-2 ring-white/30 group-hover:scale-105 transition-transform">
              <Image src="/logo.png" alt="EAM Logo Oficial" width={38} height={38} className="object-contain" priority />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-heading font-black text-lg tracking-wider text-white leading-none">
                  EAM <span className="text-[#00A3FF]">GESTIÓN</span>
                </span>
                <span className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold mt-1">
                  Escuela de Manejo • Varela
                </span>
              </div>
            )}
          </Link>

          {/* Toggle colapsar (solo desktop) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navegación Principal */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className={cn("px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400", collapsed && "text-center")}>
            {!collapsed ? "Operaciones" : "•••"}
          </div>

          {visibleItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group relative",
                  isActive
                    ? "bg-[#00A3FF] text-white font-semibold shadow-lg shadow-[#00A3FF]/30"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />
                {!collapsed && <span className="truncate flex-1">{item.label}</span>}
                {!collapsed && item.badge !== undefined && (
                  <span
                    className={cn(
                      "px-2 py-0.5 text-xs rounded-full font-bold",
                      isActive ? "bg-white text-[#03387E]" : "bg-[#EF4444] text-white animate-pulse"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
                {collapsed && item.badge !== undefined && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#EF4444] rounded-full ring-2 ring-[#022554]" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Acceso directo al Turnero Público */}
        <div className="p-3 border-t border-white/10 bg-[#011634]/60">
          <Link
            href="/reservar"
            target="_blank"
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 text-xs font-semibold transition-all",
              collapsed && "justify-center px-2"
            )}
            title="Abrir Turnero Público (/reservar)"
          >
            <ExternalLink className="w-4 h-4 shrink-0 text-emerald-400" />
            {!collapsed && <span className="truncate">Turnero Online Público</span>}
          </Link>

          {!collapsed && (
            <div className="mt-3 px-2 flex items-center justify-between text-[11px] text-slate-400">
              <span>Rol activo:</span>
              <span className="font-bold text-[#00A3FF] uppercase">{role}</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
