import React, { useState } from 'react';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { TenantModal } from '../../components/superadmin/TenantModal';
import { useNavigate } from 'react-router-dom';
import type { TenantRecord } from '../../types/saas.types';
import {
  TrendingUp,
  Building2,
  Users,
  ShieldCheck,
  DollarSign,
  Activity,
  Layers,
  ArrowUpRight,
  Sparkles,
  Zap,
  Server,
  PieChart,
} from 'lucide-react';

export const SuperAdminDashboardView: React.FC = () => {
  const { tenants, platformUsers, getMetrics, setActiveTenantId } = useSuperAdmin();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTenantToEdit, setSelectedTenantToEdit] = useState<TenantRecord | null>(null);
  const navigate = useNavigate();

  const metrics = getMetrics();
  const pendingUsers = platformUsers.filter((u) => !u.companyId && u.role !== 'superadmin');

  // Cálculos analíticos SaaS en vivo
  const totalRevenue = metrics.mrr || 0;
  const annualRunRate = totalRevenue * 12; // ARR
  const activeCount = metrics.activeTenants;
  const trialCount = metrics.totalTenants - metrics.activeTenants - metrics.suspendedTenants;
  const suspendedCount = metrics.suspendedTenants;
  const avgRevenuePerTenant = activeCount > 0 ? Math.round(totalRevenue / activeCount) : 0; // ARPU

  // Desglose por módulos contratados
  const dianEnabledCount = tenants.filter((t) => t.features?.electronicInvoicing).length;
  const inventoryEnabledCount = tenants.filter((t) => t.features?.inventoryEnabled).length;
  const tablesEnabledCount = tenants.filter((t) => t.features?.tableTabsEnabled).length;

  const handleOpenCreateModal = () => {
    setSelectedTenantToEdit(null);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#07090e] p-6 text-white overflow-y-auto select-none custom-scrollbar">
      {/* Header Maestro */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between border-b border-slate-800/80 pb-5 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center font-bold text-xl shadow-lg shadow-amber-400/10">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-wide">
                  Panel Ejecutivo SaaS
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase font-bold">
                  En Vivo
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Rendimiento financiero recurrente, salud del ecosistema multi-tenant y telemetría operativa.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenCreateModal}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-amber-400/20 active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <span className="text-base font-bold">+</span>
            <span>Alta de Nuevo Bar</span>
          </button>
        </div>
      </div>

      {/* Banner de Notificación de Usuarios Pendientes */}
      {pendingUsers.length > 0 && (
        <div
          onClick={() => navigate('/admin/users')}
          className="mb-6 p-4 bg-gradient-to-r from-amber-500/15 to-transparent border border-amber-500/40 rounded-2xl flex items-center justify-between cursor-pointer transition shadow-lg shadow-amber-500/5 group hover:border-amber-400"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold text-lg shrink-0">
              ⏳
            </div>
            <div>
              <p className="text-xs font-black text-white flex items-center gap-2">
                <span>¡Tienes {pendingUsers.length} persona{pendingUsers.length > 1 ? 's' : ''} esperando asignación!</span>
                <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase">
                  Acceso Bloqueado
                </span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Nuevos usuarios que no pueden ver nada hasta que les vincules su bar y rol (Admin o Cajero).
              </p>
            </div>
          </div>
          <span className="text-xs font-black text-amber-400 group-hover:translate-x-1 transition flex items-center gap-1 shrink-0 ml-3">
            <span>Asignar Ahora</span>
            <span>→</span>
          </span>
        </div>
      )}

      {/* ─── 1. KPIs MAESTROS FINANCIEROS Y DE RED ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* MRR */}
        <div className="bg-[#0e1422] border border-amber-500/30 p-5 rounded-3xl shadow-xl relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-400/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-400/20 transition"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign size={14} />
              <span>MRR (Mensual)</span>
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Activo
            </span>
          </div>
          <p className="text-3xl font-black text-white font-mono mt-3">
            ${totalRevenue.toLocaleString('es-CO')}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
            <span>Proyección Anual (ARR)</span>
            <span className="font-mono font-bold text-amber-300">
              ${annualRunRate.toLocaleString('es-CO')}
            </span>
          </div>
        </div>

        {/* Clientes Bares y Ecosistema */}
        <div className="bg-[#0e1422] border border-slate-800 p-5 rounded-3xl shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 size={14} className="text-sky-400" />
              <span>Bares Clientes</span>
            </span>
            <span className="text-xs text-sky-400 font-bold font-mono">
              {metrics.totalTenants} Red
            </span>
          </div>
          <p className="text-3xl font-black text-white font-mono mt-3">
            {activeCount}{' '}
            <span className="text-sm font-normal text-slate-400 font-sans">al día</span>
          </p>
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/80 text-[11px]">
            <span className="text-emerald-400 font-bold">● {activeCount} Activos</span>
            <span className="text-slate-600">|</span>
            <span className="text-amber-400 font-bold">○ {trialCount} Prueba</span>
            <span className="text-slate-600">|</span>
            <span className="text-red-400 font-bold">✕ {suspendedCount} Susp.</span>
          </div>
        </div>

        {/* Facturación DIAN en la Red */}
        <div className="bg-[#0e1422] border border-slate-800 p-5 rounded-3xl shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp size={14} className="text-emerald-400" />
              <span>Facturas DIAN</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              Legal CO
            </span>
          </div>
          <p className="text-3xl font-black text-emerald-400 font-mono mt-3">
            {(metrics?.totalInvoices || 0).toLocaleString('es-CO')}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
            <span>Bares con DIAN</span>
            <span className="font-mono font-bold text-white">
              {dianEnabledCount} de {metrics.totalTenants}
            </span>
          </div>
        </div>

        {/* Infraestructura & Health */}
        <div className="bg-[#0e1422] border border-slate-800 p-5 rounded-3xl shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Server size={14} className="text-amber-400" />
              <span>Infraestructura DIAN</span>
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-black text-white font-mono">100%</span>
            <span className="text-xs text-emerald-400 font-bold">Operativa</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
            <span>SOAP DIAN Colombia</span>
            <span className="text-emerald-400 font-mono font-semibold">Online (99.9%)</span>
          </div>
        </div>
      </div>

      {/* ─── 2. PANEL DE TELEMETRÍA: MÉTRICAS AVANZADAS & ADOPCIÓN DE MÓDULOS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Ticket Promedio SaaS (ARPU) */}
        <div className="bg-[#0e1422] border border-slate-800/90 p-5 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Activity size={14} className="text-amber-400" />
                <span>Ticket Promedio (ARPU)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Por negocio</span>
            </div>
            <p className="text-2xl font-black text-white font-mono mt-3">
              ${avgRevenuePerTenant.toLocaleString('es-CO')}
              <span className="text-xs font-normal text-slate-400"> /mes</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Ingreso mensual promedio generado por cada establecimiento activo en la red.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Base instalada activa:</span>
            <span className="font-bold text-white font-mono">{activeCount} negocios</span>
          </div>
        </div>

        {/* Adopción de Módulos en los Bares */}
        <div className="bg-[#0e1422] border border-slate-800/90 p-5 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Layers size={14} className="text-indigo-400" />
                <span>Módulos Contratados</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Feature Flags</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 font-medium mb-1">
                  <span>Facturación DIAN Oficial</span>
                  <span className="font-mono text-emerald-400 font-bold">{dianEnabledCount} bares</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all"
                    style={{
                      width: `${metrics.totalTenants > 0 ? (dianEnabledCount / metrics.totalTenants) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-medium mb-1">
                  <span>Gestión de Inventario & Botellas</span>
                  <span className="font-mono text-amber-400 font-bold">{inventoryEnabledCount} bares</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all"
                    style={{
                      width: `${metrics.totalTenants > 0 ? (inventoryEnabledCount / metrics.totalTenants) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-medium mb-1">
                  <span>Mural de Mesas & Cuentas</span>
                  <span className="font-mono text-sky-400 font-bold">{tablesEnabledCount} bares</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-sky-400 h-full rounded-full transition-all"
                    style={{
                      width: `${metrics.totalTenants > 0 ? (tablesEnabledCount / metrics.totalTenants) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Configuración individual:</span>
            <span
              onClick={() => navigate('/admin/tenants')}
              className="text-amber-400 hover:underline font-bold cursor-pointer"
            >
              Directorio de Bares →
            </span>
          </div>
        </div>

        {/* Resumen de Usuarios & Roles de la Plataforma */}
        <div className="bg-[#0e1422] border border-slate-800/90 p-5 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Users size={14} className="text-emerald-400" />
                <span>Usuarios & Permisos</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {platformUsers.length} registrados
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center my-2">
              <div className="p-2.5 bg-slate-900/80 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Super Admins</span>
                <p className="text-lg font-black text-amber-400 font-mono mt-0.5">
                  {platformUsers.filter((u) => u.role === 'superadmin').length}
                </p>
                <span className="text-[9px] text-slate-500 font-mono">Tú & Daniel</span>
              </div>

              <div className="p-2.5 bg-slate-900/80 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Admins de Bar</span>
                <p className="text-lg font-black text-blue-400 font-mono mt-0.5">
                  {platformUsers.filter((u) => u.role === 'admin').length}
                </p>
                <span className="text-[9px] text-slate-500 font-mono">Dueños de negocio</span>
              </div>

              <div className="p-2.5 bg-slate-900/80 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Cajeros / Op</span>
                <p className="text-lg font-black text-slate-200 font-mono mt-0.5">
                  {platformUsers.filter((u) => u.role === 'user' && u.companyId).length}
                </p>
                <span className="text-[9px] text-slate-500 font-mono">Personal de barra</span>
              </div>

              <div className="p-2.5 bg-slate-900/80 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Pendientes</span>
                <p className="text-lg font-black text-amber-400 font-mono mt-0.5">
                  {pendingUsers.length}
                </p>
                <span className="text-[9px] text-amber-400/80 font-mono">Sin asignar</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Gestionar accesos:</span>
            <span
              onClick={() => navigate('/admin/users')}
              className="text-amber-400 hover:underline font-bold cursor-pointer"
            >
              Usuarios & Asignaciones →
            </span>
          </div>
        </div>
      </div>

      {/* ─── 3. ACCESOS DIRECTOS EJECUTIVOS ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Acceso a Directorio */}
        <div
          onClick={() => navigate('/admin/tenants')}
          className="bg-[#0e1422] border border-slate-800 hover:border-amber-500/40 p-5 rounded-3xl transition cursor-pointer group shadow-xl flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition">
              🏢
            </div>
            <div>
              <h3 className="text-sm font-black text-white group-hover:text-amber-400 transition">
                Directorio Completo de Bares
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Gestionar NIT, estado de cobro, activar/desactivar módulos (mural, inventario, DIAN) y editar datos.
              </p>
            </div>
          </div>
          <span className="text-amber-400 text-sm font-bold group-hover:translate-x-1 transition ml-3">
            →
          </span>
        </div>

        {/* Acceso a Usuarios */}
        <div
          onClick={() => navigate('/admin/users')}
          className="bg-[#0e1422] border border-slate-800 hover:border-amber-500/40 p-5 rounded-3xl transition cursor-pointer group shadow-xl flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition">
              👥
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white group-hover:text-amber-400 transition">
                  Usuarios & Asignaciones
                </h3>
                {pendingUsers.length > 0 && (
                  <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full">
                    {pendingUsers.length} pendientes
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Autorizar nuevos registros, asignar empresa y definir rol (Admin del Bar o Cajero).
              </p>
            </div>
          </div>
          <span className="text-amber-400 text-sm font-bold group-hover:translate-x-1 transition ml-3">
            →
          </span>
        </div>
      </div>

      {/* Modal para Crear / Editar Negocio */}
      <TenantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tenantToEdit={selectedTenantToEdit}
      />
    </div>
  );
};

