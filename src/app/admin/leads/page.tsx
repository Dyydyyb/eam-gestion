"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, ArrowRight, ShieldCheck } from "lucide-react";

export default function LeadsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/admin/clientes");
    }, 1500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#03387E] flex items-center justify-center mx-auto ring-8 ring-blue-50/50">
          <Users className="w-8 h-8 text-[#00A3FF]" />
        </div>
        <div>
          <h2 className="font-heading font-black text-2xl text-[#03387E]">
            Gestión Unificada en Alumnos / CRM
          </h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            El Pipeline de Leads ha sido unificado dentro del módulo central de Alumnos y CRM de la autoescuela para centralizar inscripciones, packs de clases y seguimiento.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/admin/clientes"
            className="btn-pill btn-pill-primary inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold w-full justify-center shadow-md"
          >
            <span>Ir a Alumnos / CRM</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
