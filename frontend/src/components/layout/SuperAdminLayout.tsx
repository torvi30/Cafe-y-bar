import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import {
  BarChart3,
  Building2,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Shield,
  Layers,
} from 'lucide-react';

export const SuperAdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { tenants, activeTenantId, setActiveTenantId } = useSuperAdmin();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs transition-all duration-150 ${
      isActive
        ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/25 scale-[1.01]'
        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
    } ${isCollapsed ? 'justify-center px-2' : ''}`;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Error cerrando sesión:', err);
    }
  };

  const handleEnterTenantPos = (tenantId: string) => {
    setActiveTenantId(tenantId);
    navigate('/pos');
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#07090e] select-none text-white">
      {/* ─── SIDEBAR EXCLUSIVO DEL SUPER ADMIN (BACK-OFFICE) ─── */}
      <aside
        className={`${
          isCollapsed ? 'w-16' : 'w-64'
        } bg-[#090d16] border-r border-amber-500/20 flex flex-col justify-between p-3.5 h-screen shrink-0 transition-all duration-200 z-30`}
      >
        <div className="overflow-y-auto min-h-0 flex-1 pr-1 custom-scrollbar">
          {/* Cabecera Master Admin */}
          <div className="pb-3.5 mb-3.5 border-b border-slate-800/90">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#07090e] border border-amber-400/40 p-1 flex items-center justify-center shrink-0 shadow-md shadow-amber-400/10">
                  <img src="/logo.svg" alt="SaaS Logo" className="w-full h-full object-contain" />
                </div>
                {!isCollapsed && (
                  <div className="min-w-0">
                    <h2 className="text-xs font-black text-white tracking-wider flex items-center gap-1.5 truncate">
                      <span>SUPER ADMIN</span>
                      <span className="text-[9px] bg-amber-400/20 text-amber-300 font-mono px-1 rounded">
                        CORE
                      </span>
                    </h2>
                    <p className="text-[10px] text-slate-400 truncate">Plataforma SaaS Central</p>
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                title={isCollapsed ? 'Expandir barra' : 'Colapsar barra'}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition text-xs ml-auto"
              >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              </button>
            </div>
          </div>

          {/* Menú Maestro de Administración */}
          <div className="mb-5">
            {!isCollapsed && (
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400/90 px-3 mb-1.5 block">
                Gestión de la Red
              </span>
            )}
            <nav className="space-y-1">
              <NavLink to="/admin/dashboard" className={navLinkClass} title="Métricas SaaS & MRR">
                <BarChart3 size={16} className="shrink-0" />
                {!isCollapsed && <span>Métricas Globales & MRR</span>}
              </NavLink>

              <NavLink to="/admin/tenants" className={navLinkClass} title="Directorio de Bares">
                <Building2 size={16} className="shrink-0" />
                {!isCollapsed && <span>Directorio de Bares</span>}
              </NavLink>

              <NavLink to="/admin/users" className={navLinkClass} title="Usuarios de la Plataforma">
                <Users size={16} className="shrink-0" />
                {!isCollapsed && <span>Usuarios & Asignaciones</span>}
              </NavLink>
            </nav>
          </div>

          {/* Sección de Auditoría / Entrada a un Bar Específico */}
          {!isCollapsed && tenants.length > 0 && (
            <div className="p-3 bg-[#0e1422] border border-slate-800 rounded-2xl mb-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1">
                <Layers size={12} className="text-amber-400" />
                <span>Supervisar un Bar</span>
              </span>

              <select
                value={activeTenantId || ''}
                onChange={(e) => setActiveTenantId(e.target.value)}
                className="w-full bg-[#07090e] border border-slate-700 text-white text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-400 truncate mb-2"
              >
                {tenants.map((t) => (
                  <option key={t.tenantId} value={t.tenantId}>
                    {t.tradeName} ({t.city})
                  </option>
                ))}
              </select>

              <button
                onClick={() => activeTenantId && handleEnterTenantPos(activeTenantId)}
                className="w-full py-1.5 px-2.5 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Entrar al POS del Bar</span>
                <ExternalLink size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Footer del Super Admin: Perfil y Salir */}
        <div className="border-t border-slate-800/80 pt-3 shrink-0">
          {!isCollapsed ? (
            <div className="flex items-center justify-between gap-2 px-2 py-1.5 bg-slate-900/60 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 min-w-0">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName || user.email}
                    className="w-7 h-7 rounded-full object-cover shrink-0 border border-amber-400/40"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-xs font-bold text-amber-400 shrink-0">
                    👑
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">
                    {user?.displayName || user?.email?.split('@')[0]}
                  </p>
                  <span className="text-[9px] font-black uppercase px-1 py-0.2 rounded font-mono bg-amber-400/20 text-amber-400">
                    SUPERADMIN
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Cerrar sesión"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-xs font-bold text-amber-400"
                title={`${user?.email} (SUPERADMIN)`}
              >
                👑
              </div>
              <button
                onClick={handleLogout}
                title="Cerrar sesión"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ─── CONTENIDO DE LA CONSOLA SUPER ADMIN ─── */}
      <main className="flex-1 min-w-0 h-full overflow-hidden relative">
        <Outlet />
      </main>
    </div>
  );
};

