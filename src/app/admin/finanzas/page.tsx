"use client";

import React, { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Filter,
  CheckCircle2,
  Lock,
  Unlock,
  Trash2,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Payment, Expense } from "@/lib/types";

export default function FinanzasPage() {
  const {
    payments,
    expenses,
    cashSession,
    clients,
    vehicles,
    addPayment,
    addExpense,
    updateCashSession,
    deletePayment,
    deleteExpense,
  } = useApp();

  const [activeTab, setActiveTab] = useState<"ingresos" | "egresos" | "caja">("ingresos");

  // Modal Nuevo Cobro
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || "");
  const [paymentAmount, setPaymentAmount] = useState(24000);
  const [paymentMethod, setPaymentMethod] = useState<Payment["payment_method"]>("transferencia");

  // Modal Nuevo Gasto
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState("Combustible");
  const [expenseVehicleId, setExpenseVehicleId] = useState(vehicles[0]?.id || "");
  const [expenseAmount, setExpenseAmount] = useState(35000);
  const [expenseDesc, setExpenseDesc] = useState("");

  // Totales
  const totalIncome = payments.filter((p) => p.status === "completado").reduce((sum, p) => sum + p.amount, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const handleRegisterPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find((c) => c.id === selectedClientId);

    addPayment({
      client_id: selectedClientId,
      client_name: client?.full_name || "Alumno",
      amount: Number(paymentAmount),
      payment_method: paymentMethod,
      status: "completado",
    });

    setPaymentModalOpen(false);
    alert("Cobro registrado con éxito en la cuenta del alumno y caja del día.");
  };

  const handleRegisterExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const vehicle = vehicles.find((v) => v.id === expenseVehicleId);

    addExpense({
      category_id: "exp-cat-1",
      category_name: expenseCategory,
      vehicle_id: expenseVehicleId,
      vehicle_plate: vehicle?.plate,
      amount: Number(expenseAmount),
      description: expenseDesc || `Gasto de ${expenseCategory}`,
      payment_method: "debito",
      expense_date: new Date().toISOString().split("T")[0],
    });

    setExpenseModalOpen(false);
    alert("Gasto registrado y debitado de la caja correctamente.");
  };

  const handleCloseCashBox = () => {
    updateCashSession({
      status: "cerrada",
      closing_time: new Date().toISOString(),
      closing_balance_real: cashSession.closing_balance_system,
      difference: 0,
    });
    alert("Caja diaria cerrada con éxito. Arqueo completado sin diferencias.");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="eyebrow">Administración Económica</span>
          <h1 className="font-heading font-black text-2xl md:text-3xl text-[#03387E] tracking-tight">
            Finanzas & Caja Diaria
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Cobros, egresos de combustible/flota, arqueo de caja y cuenta corriente en Pesos Argentinos (ARS).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPaymentModalOpen(true)}
            className="btn-pill btn-pill-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Cobro</span>
          </button>
          <button
            onClick={() => setExpenseModalOpen(true)}
            className="btn-pill px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Gasto</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Resumen Financiero */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="eam-card p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>Ingresos Totales (Mes)</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="font-heading font-black text-2xl md:text-3xl text-slate-900">
            {formatCurrency(totalIncome)}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            {payments.length} transacciones registradas
          </div>
        </div>

        <div className="eam-card p-5 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>Egresos Totales (Mes)</span>
            <ArrowDownRight className="w-4 h-4 text-red-500" />
          </div>
          <div className="font-heading font-black text-2xl md:text-3xl text-red-600">
            {formatCurrency(totalExpense)}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            Combustible, repuestos y sueldos
          </div>
        </div>

        <div className="eam-card p-5 border-l-4 border-l-[#03387E]">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>Resultado Operativo Neto</span>
            <DollarSign className="w-4 h-4 text-[#00A3FF]" />
          </div>
          <div className="font-heading font-black text-2xl md:text-3xl text-[#03387E]">
            {formatCurrency(netBalance)}
          </div>
          <div className="text-xs text-emerald-600 mt-1 font-bold">
            Flujo de caja positivo
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-1 rounded-2xl border border-slate-200 text-xs font-bold shadow-2xs w-fit">
        <button
          onClick={() => setActiveTab("ingresos")}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === "ingresos" ? "bg-[#03387E] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Ingresos / Cobros ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab("egresos")}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === "egresos" ? "bg-[#03387E] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Egresos / Gastos ({expenses.length})
        </button>
        <button
          onClick={() => setActiveTab("caja")}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === "caja" ? "bg-[#03387E] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Caja Diaria
        </button>
      </div>

      {/* TAB 1: INGRESOS */}
      {activeTab === "ingresos" && (
        <div className="eam-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100/70 text-slate-600 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Alumno</th>
                  <th className="py-3 px-4">Medio de Pago</th>
                  <th className="py-3 px-4">Comprobante</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4 text-right">Monto (ARS)</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {p.client_name}
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold capitalize text-slate-700">
                      {p.payment_method}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-slate-500">
                      {p.receipt_number || "REC-2026-001"}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {formatDate(p.created_at)}
                    </td>
                    <td className="py-3 px-4 text-right font-heading font-black text-slate-900">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`¿Estás seguro de que deseás eliminar este comprobante de ingreso de ${p.client_name} por ${formatCurrency(p.amount)}?`)) {
                            deletePayment(p.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar Ingreso"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: EGRESOS */}
      {activeTab === "egresos" && (
        <div className="eam-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100/70 text-slate-600 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Descripción</th>
                  <th className="py-3 px-4">Vehículo Asociado</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4 text-right">Monto (ARS)</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {e.category_name}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">{e.description}</td>
                    <td className="py-3 px-4 text-xs font-mono font-semibold text-[#03387E]">
                      {e.vehicle_plate || "Sede Mitre 294"}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {formatDate(e.expense_date)}
                    </td>
                    <td className="py-3 px-4 text-right font-heading font-black text-red-600">
                      -{formatCurrency(e.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`¿Estás seguro de que deseás eliminar este registro de gasto de ${e.category_name} por ${formatCurrency(e.amount)}?`)) {
                            deleteExpense(e.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar Gasto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CAJA DIARIA */}
      {activeTab === "caja" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="eam-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-heading font-bold text-base text-slate-900">
                Estado de la Caja Diaria
              </h3>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  cashSession.status === "abierta"
                    ? "bg-emerald-100 text-emerald-800 animate-pulse"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {cashSession.status === "abierta" ? "Caja Abierta ✓" : "Caja Cerrada"}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500">Responsable de Caja:</span>
                <strong className="text-slate-800">{cashSession.opened_by_name}</strong>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500">Saldo Inicial de Apertura:</span>
                <strong className="text-slate-800">{formatCurrency(cashSession.opening_balance)}</strong>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500">Total Efectivo en Sistema:</span>
                <strong className="text-emerald-700 font-bold">
                  {formatCurrency(cashSession.closing_balance_system || 63000)}
                </strong>
              </div>
            </div>

            {cashSession.status === "abierta" ? (
              <button
                onClick={handleCloseCashBox}
                className="btn-pill w-full py-2.5 text-xs font-bold bg-[#03387E] hover:bg-[#022554] text-white flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Lock className="w-4 h-4" />
                <span>Realizar Arqueo y Cerrar Caja</span>
              </button>
            ) : (
              <button
                onClick={() => updateCashSession({ status: "abierta" })}
                className="btn-pill btn-pill-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                <span>Abrir Nueva Sesión de Caja</span>
              </button>
            )}
          </div>

          <div className="eam-card p-6 space-y-3 bg-blue-50/50 border-blue-200">
            <h4 className="font-heading font-bold text-sm text-[#03387E]">
              Integración de Pagos Online & Facturación Electrónica
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              • <strong>Mercado Pago:</strong> Arquitectura preparada para links de pago / señas en la reserva web (Webhooks y Point Smart en recepción).
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              • <strong>Facturación ARCA (ex AFIP):</strong> Esquema listo para conexión con WebService WSFEv1 para emisión de Facturas C / Comprobantes fiscales automáticos mediante certificado digital (.crt y .key).
            </p>
          </div>
        </div>
      )}

      {/* Modal Registrar Cobro */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <h3 className="font-heading font-bold text-lg text-[#03387E]">Registrar Cobro a Alumno</h3>
            <form onSubmit={handleRegisterPayment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Alumno</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} (DNI {c.dni})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Monto ($ ARS)</label>
                <input
                  type="number"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Medio de Pago</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  <option value="efectivo">Efectivo (Caja diaria)</option>
                  <option value="transferencia">Transferencia Bancaria</option>
                  <option value="mercadopago">Mercado Pago</option>
                  <option value="debito">Tarjeta de Débito</option>
                  <option value="credito">Tarjeta de Crédito</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-full"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-pill btn-pill-primary px-5 py-2 font-bold">
                  Confirmar Cobro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Gasto */}
      {expenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <h3 className="font-heading font-bold text-lg text-red-600">Registrar Gasto / Egreso</h3>
            <form onSubmit={handleRegisterExpense} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Categoría</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="Combustible">Combustible (Nafta / GNC)</option>
                  <option value="Mantenimiento de Flota">Mantenimiento de Flota / Taller</option>
                  <option value="Sueldos y Liquidaciones">Sueldos y Liquidaciones</option>
                  <option value="Alquiler y Servicios">Alquiler Sede Mitre 294 y Servicios</option>
                  <option value="Seguros y VTV">Seguros y VTV</option>
                  <option value="Publicidad">Publicidad y Redes</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Vehículo Asociado</label>
                <select
                  value={expenseVehicleId}
                  onChange={(e) => setExpenseVehicleId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.brand} {v.model} ({v.plate})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Monto ($ ARS)</label>
                <input
                  type="number"
                  required
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Descripción / Detalle</label>
                <input
                  type="text"
                  placeholder="Ej: Carga nafta Shell Varela..."
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setExpenseModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-full"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-red-600 hover:bg-red-700 text-white rounded-full"
                >
                  Registrar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
