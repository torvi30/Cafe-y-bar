import React, { useState, useMemo } from 'react';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { TenantModal } from '../../components/superadmin/TenantModal';
import { TenantStatus, TenantRecord } from '../../types/saas.types';
import type { TenantFeatures } from '../../context/TenantConfigContext';
import { confirmAction, toastSuccess, toastInfo } from '../../lib/alerts';
import { useNavigate } from 'react-router-dom';

export const TenantsListView: React.FC = () => {
  const {
    tenants,
    updateTenantStatus,
    toggleTenantFeature,
    deleteTenant,
    setActiveTenantId,
  } = useSuperAdmin();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTenantToEdit, setSelectedTenantToEdit] = useState<TenantRecord | null>(null);
  const navigate = useNavigate();

  const handleOpenCreateModal = () => {
    setSelectedTenantToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tenant: TenantRecord) => {
    setSelectedTenantToEdit(tenant);
    setIsModalOpen(true);
  };

  const filteredTenants = useMemo(() => {
    return tenants.filter((tenant) => {
      const matchStatus = statusFilter === 'ALL' || tenant.status === statusFilter;
      const matchSearch =
        searchQuery.trim() === '' ||
        tenant.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.tradeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.nit.includes(searchQuery) ||
        tenant.city.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [tenants, statusFilter, searchQuery]);

  const handleImpersonate = (tenantId: string) => {
    setActiveTenantId(tenantId);
    navigate('/pos');
  };

  const handleToggle = async (tenantId: string, feature: keyof TenantFeatures, label: string) => {
    await toggleTenantFeature(tenantId, feature);
    toastInfo(`Módulo "${label}" actualizado`);
  };

  const handleStatus = async (tenantId: string, name: string, status: TenantStatus) => {
    await updateTenantStatus(tenantId, status);
    toastSuccess(`Estado de "${name}" actualizado a ${status === 'ACTIVE' ? 'Activo' : status === 'TRIAL' ? 'Prueba' : 'Suspendido'}`);
  };

  const handleDeleteTenant = async (tenant: TenantRecord) => {
    const confirmed = await confirmAction({
      title: '¿Eliminar Empresa?',
      text: `Se eliminará permanentemente "${tenant.tradeName}" y toda su información. Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      isDangerous: true,
    });
    if (confirmed) {
      await deleteTenant(tenant.tenantId);
      toastSuccess(`Empresa "${tenant.tradeName}" eliminada`);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#07090e] p-6 text-white overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <span>🏢</span> Directorio de Clientes & Control de Flags
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Activa o desactiva módulos por negocio, gestiona el estado de pago y accede al POS de cada cliente.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-amber-400/20 active:scale-95 flex items-center gap-2 cursor-pointer"
        >
          <span className="text-base font-bold">+</span>
          <span>Nuevo Establecimiento</span>
        </button>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex items-center justify-between gap-3 mb-4 shrink-0">
        <div className="flex gap-2">
          {['ALL', 'ACTIVE', 'TRIAL', 'SUSPENDED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                statusFilter === st
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-[#0d121e] border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st === 'ALL'
                ? 'Todos los Bares'
                : st === 'ACTIVE'
                ? '● Activos'
                : st === 'TRIAL'
                ? '○ En Prueba'
                : '✕ Suspendidos'}
            </button>
          ))}
        </div>

        <div className="relative w-80">
          <span className="absolute left-3 top-2.5 text-xs text-slate-400">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por bar, NIT o ciudad..."
            className="w-full bg-[#0d121e] border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Tabla de Negocios y Control de Flags */}
      <div className="flex-1 overflow-y-auto bg-[#0d121e] border border-slate-800 rounded-2xl shadow-2xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#090d16] sticky top-0 z-10 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="p-3.5">Bar / Establecimiento</th>
              <th className="p-3.5">Ciudad & NIT</th>
              <th className="p-3.5">Plan Contratado</th>
              <th className="p-3.5 text-center">Feature Flags (Módulos)</th>
              <th className="p-3.5 text-center">Estado Suscripción</th>
              <th className="p-3.5 text-right">Acceso & Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {filteredTenants.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-500">
                  No se encontraron negocios con esos filtros
                </td>
              </tr>
            ) : (
              filteredTenants.map((tenant) => (
                <tr key={tenant.tenantId} className="hover:bg-slate-800/30 transition">
                  <td className="p-3.5">
                    <div className="font-bold text-white text-sm">{tenant.tradeName}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[220px]">
                      {tenant.businessName}
                    </div>
                  </td>

                  <td className="p-3.5">
                    <div className="text-slate-200 font-medium">{tenant.city}</div>
                    <div className="font-mono text-[10px] text-slate-400">NIT: {tenant.nit}</div>
                  </td>

                  <td className="p-3.5">
                    <div className="font-bold text-amber-300 text-xs">
                      {tenant.plan ? tenant.plan.replace('_', ' ') : 'ACTIVO'}
                    </div>
                    <div className="font-mono text-emerald-400 text-xs mt-0.5">
                      ${(tenant.monthlyFee || 0).toLocaleString('es-CO')}/mes
                    </div>
                  </td>

                  {/* Interruptores de Feature Flags en Vivo por Tenant */}
                  <td className="p-3.5">
                    <div className="flex items-center justify-center gap-2">
                      {/* Flag Inventario */}
                      <button
                        onClick={() => handleToggle(tenant.tenantId, 'inventoryEnabled', 'Inventario')}
                        title={`Inventario: ${tenant.features?.inventoryEnabled ? 'Activo' : 'Inactivo'}`}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                          tenant.features?.inventoryEnabled
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-800/60 text-slate-500 border-slate-700/60 line-through'
                        }`}
                      >
                        📦 Stock
                      </button>

                      {/* Flag Mesas / Tabs */}
                      <button
                        onClick={() => handleToggle(tenant.tenantId, 'tableTabsEnabled', 'Mesas')}
                        title={`Mesas: ${tenant.features?.tableTabsEnabled ? 'Activo' : 'Inactivo'}`}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                          tenant.features?.tableTabsEnabled
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            : 'bg-slate-800/60 text-slate-500 border-slate-700/60 line-through'
                        }`}
                      >
                        🍹 Mesas
                      </button>

                      {/* Flag Control de Caja & Turnos */}
                      <button
                        onClick={() => handleToggle(tenant.tenantId, 'cashControlEnabled', 'Control de Caja')}
                        title={`Caja: ${tenant.features?.cashControlEnabled ? 'Activo' : 'Inactivo'}`}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                          tenant.features?.cashControlEnabled
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-800/60 text-slate-500 border-slate-700/60 line-through'
                        }`}
                      >
                        💵 Caja
                      </button>

                      {/* Flag DIAN (Siempre activo) */}
                      <span
                        title="Facturación DIAN: Siempre activa"
                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      >
                        📑 DIAN
                      </span>
                    </div>
                  </td>

                  {/* Selector de Estado */}
                  <td className="p-3.5 text-center">
                    <select
                      value={tenant.status}
                      onChange={(e) =>
                        handleStatus(tenant.tenantId, tenant.tradeName, e.target.value as TenantStatus)
                      }
                      className={`text-[10px] font-bold px-2 py-1 rounded-full border focus:outline-none cursor-pointer ${
                        tenant.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : tenant.status === 'TRIAL'
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                          : 'bg-red-500/20 text-red-400 border-red-500/40'
                      }`}
                    >
                      <option value="ACTIVE" className="bg-slate-900 text-white">Activo</option>
                      <option value="TRIAL" className="bg-slate-900 text-white">En Prueba</option>
                      <option value="SUSPENDED" className="bg-slate-900 text-white">Suspendido</option>
                    </select>
                  </td>

                  {/* Botón de Impersonación y Acciones */}
                  <td className="p-3.5 text-right space-x-2">
                    <button
                      onClick={() => handleOpenEditModal(tenant)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-xl text-xs transition border border-slate-700/80 cursor-pointer inline-flex items-center gap-1"
                      title="Editar datos de la empresa"
                    >
                      <span>✏️</span>
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => handleImpersonate(tenant.tenantId)}
                      className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs transition active:scale-95 shadow-md shadow-amber-400/20 cursor-pointer"
                      title="Entrar a operar el POS como este establecimiento"
                    >
                      ⚡ Entrar al POS
                    </button>
                    <button
                      onClick={() => handleDeleteTenant(tenant)}
                      className="px-2 py-1.5 text-slate-500 hover:text-red-400 text-xs font-bold transition cursor-pointer"
                      title="Eliminar tenant"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <TenantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tenantToEdit={selectedTenantToEdit}
      />
    </div>
  );
};

