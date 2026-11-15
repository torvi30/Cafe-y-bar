import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTenantConfig } from '../../context/TenantConfigContext';
import { useAuth } from '../../context/AuthContext';
import { FeatureGate } from '../common/FeatureGate';
import { LogOut, ChevronLeft, ChevronRight, Settings, ArrowLeft, Menu, X } from 'lucide-react';

export const AppSidebar: React.FC = () => {
  const { settings } = useTenantConfig();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const isSuperadmin = user?.role === 'superadmin';

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-xl font-medium text-xs transition-all duration-150 ${
      isActive
        ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/25 scale-[1.02]'
        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
    } ${isCollapsed ? 'justify-center px-2' : ''}`;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  return (
    <>
      {/* Botón flotante móvil para abrir menú */}
      <div className="md:hidden fixed top-2 left-2 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 bg-[#0e1422] border border-amber-500/40 text-amber-400 rounded-xl shadow-lg active:scale-95 transition"
        >
          {isMobileOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
      </div>

      {/* Backdrop móvil */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
        />
      )}

      <aside
        className={`
          ${isCollapsed ? 'md:w-16' : 'md:w-60 xl:w-64'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          fixed md:relative top-0 left-0
          w-72 md:w-auto
          bg-[#0b0f19] border-r border-slate-800/80 flex flex-col justify-between p-3 h-screen select-none shrink-0 transition-all duration-200 z-50 md:z-20
        `}
      >
      <div className="overflow-y-auto min-h-0 flex-1 pr-1 custom-scrollbar">
        {/* Cabecera del Bar Activo */}
        <div className="pb-3 mb-3 border-b border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            {!isCollapsed && (
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <span>🏢</span> {settings.businessName || 'Establecimiento'}
              </span>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? 'Expandir barra' : 'Colapsar barra'}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition text-xs ml-auto"
            >
              {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>

          {/* Información del Establecimiento */}
          {!isCollapsed ? (
            <div className="bg-[#121824] border border-slate-700/80 rounded-xl px-3 py-2">
              <p className="text-xs font-bold text-white truncate">
                {settings.businessName || 'Establecimiento Activo'}
              </p>
              <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                <span className="font-mono">NIT: {settings.nit}</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  DIAN
                </span>
              </div>
            </div>
          ) : (
            <div className="mx-auto text-xl text-center">🍸</div>
          )}

          {/* Solo si es Super Admin supervisando este bar, mostrar botón para regresar a su consola */}
          {isSuperadmin && !isCollapsed && (
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="w-full mt-2 py-1 px-2 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-lg text-[10px] font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft size={12} />
              <span>Volver a Consola SaaS</span>
            </button>
          )}
        </div>

        {/* ─── OPERACIÓN DEL BAR ACTIVO ─── */}
        <div className="mb-4">
          {!isCollapsed && (
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-3 mb-1 block">
              Módulos del Bar
            </span>
          )}
          <nav className="space-y-0.5">
            <NavLink to="/pos" className={navLinkClass} title="Barra Rápida POS">
              <span className="text-base shrink-0">⚡</span>
              {!isCollapsed && <span>Barra Rápida POS</span>}
            </NavLink>

            <NavLink to="/facturacion" className={navLinkClass} title="Facturas DIAN">
              <span className="text-base shrink-0">📑</span>
              {!isCollapsed && <span>Facturas DIAN</span>}
            </NavLink>

            <NavLink to="/productos" className={navLinkClass} title="Catálogo & Precios">
              <span className="text-base shrink-0">🏷️</span>
              {!isCollapsed && <span>Carta & Precios</span>}
            </NavLink>

            {/* MÓDULO CONDICIONAL: Turno & Control de Caja (X / Z) */}
            <FeatureGate feature="cashControlEnabled">
              <NavLink to="/caja" className={navLinkClass} title="Turno & Control de Caja">
                <span className="text-base shrink-0">💵</span>
                {!isCollapsed && <span>Turno & Caja</span>}
              </NavLink>
            </FeatureGate>

            <FeatureGate feature="tableTabsEnabled">
              <NavLink to="/mesas" className={navLinkClass} title="Mesas & Tabs">
                <span className="text-base shrink-0">🍹</span>
                {!isCollapsed && <span>Mesas & Tabs</span>}
              </NavLink>
            </FeatureGate>

            <FeatureGate feature="inventoryEnabled">
              <NavLink to="/inventario" className={navLinkClass} title="Stock & Bodega">
                <span className="text-base shrink-0">📦</span>
                {!isCollapsed && <span>Stock & Bodega</span>}
              </NavLink>
            </FeatureGate>
          </nav>
        </div>
      </div>

      {/* ─── FOOTER DEL BAR: CONFIGURACIÓN + PERFIL DE USUARIO ─── */}
      <div className="border-t border-slate-800/80 pt-2 shrink-0 space-y-2">
        <NavLink to="/configuracion" className={navLinkClass} title="Config Bar Activo">
          <Settings size={15} className="shrink-0" />
          {!isCollapsed && <span>Config & Flags</span>}
        </NavLink>

        {/* Perfil del Usuario Activo */}
        <div className="pt-2 border-t border-slate-800/60">
          {!isCollapsed ? (
            <div className="flex items-center justify-between gap-2 px-2 py-1.5 bg-slate-900/60 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 min-w-0">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName || user.email}
                    className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-700"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-amber-400 shrink-0">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">
                    {user?.displayName || user?.email?.split('@')[0]}
                  </p>
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-[9px] font-black uppercase px-1 py-0.2 rounded font-mono ${
                        user?.role === 'superadmin'
                          ? 'bg-amber-400/20 text-amber-400'
                          : user?.role === 'admin'
                          ? 'bg-blue-400/20 text-blue-400'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {user?.role === 'superadmin' ? 'SUPERADMIN' : user?.role === 'admin' ? 'ADMIN BAR' : 'OPERADOR'}
                    </span>
                  </div>
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
                className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-amber-400"
                title={`${user?.email} (${user?.role})`}
              >
                {user?.email?.charAt(0).toUpperCase() || 'U'}
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
      </div>
    </aside>
    </>
  );
};
