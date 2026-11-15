import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { useAuth } from '../../context/AuthContext';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const { activeTenant } = useSuperAdmin();
  const { user } = useAuth();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#07090e]">
      <AppSidebar />
      <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden relative">
        {/* Banner de Negocio Activo en el POS */}
        {!isAdminRoute && (
          <header className="h-10 sm:h-9 bg-[#0b0f19] border-b border-slate-800/80 px-4 pl-12 md:pl-4 flex items-center justify-between text-xs shrink-0 select-none">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded font-black font-mono shrink-0">
                NEGOCIO ACTIVO
              </span>
              <span className="font-bold text-white truncate max-w-[130px] sm:max-w-sm">
                {activeTenant?.tradeName || 'Establecimiento'}
              </span>
              {activeTenant?.city && (
                <span className="text-slate-400 hidden sm:inline font-mono text-[11px] shrink-0">
                  ({activeTenant.city})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <span className="text-slate-400 text-[11px] hidden md:inline">
                Plan:{' '}
                <strong className="text-amber-400 font-mono">
                  {activeTenant?.plan ? activeTenant.plan.replace('_', ' ') : 'ACTIVO'}
                </strong>
              </span>
              {user?.role === 'superadmin' && (
                <Link
                  to="/admin/dashboard"
                  className="text-[10px] font-black uppercase tracking-wider text-amber-400 hover:text-amber-300 bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700/80 transition flex items-center gap-1.5"
                >
                  <span>👑</span>
                  <span className="hidden sm:inline">Consola Super Admin</span>
                </Link>
              )}
            </div>
          </header>
        )}

        <main className="flex-1 min-w-0 h-full overflow-hidden relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
