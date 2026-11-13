import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Building2, ShieldAlert, LogOut, Mail, UserCheck } from 'lucide-react';

export const UnassignedUserView: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#07090e] text-white relative overflow-hidden select-none">
      {/* Luces de fondo ambient */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-[#0e1422] border border-amber-500/30 rounded-3xl p-7 shadow-2xl text-center">
          {/* Icono de Estado */}
          <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-400/10">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-black text-white">Acceso Pendiente de Asignación</h2>
          <p className="text-xs text-amber-400 font-mono mt-1">Cuenta registrada con éxito</p>

          {/* Tarjeta de Datos del Usuario */}
          <div className="my-5 bg-[#07090e] p-4 rounded-2xl border border-slate-800 text-left text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Usuario:</span>
              <span className="font-bold text-white">{user?.displayName || 'Usuario Registrado'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Correo:</span>
              <span className="font-mono text-slate-300">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Estado de Empresa:</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Sin Empresa Asignada
              </span>
            </div>
          </div>

          {/* Mensaje Informativo para el Usuario */}
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl text-slate-300 text-xs text-left space-y-2 mb-6 leading-relaxed">
            <div className="flex items-start gap-2 text-slate-200 font-semibold">
              <UserCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>Estamos esperando que te asignen la empresa</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Por motivos de seguridad y control, nadie puede acceder al sistema ni ver información sin autorización previa. Para ingresar,{' '}
              <strong className="text-white">el Super Administrador de la plataforma</strong> debe asignarte tu establecimiento
              (bar, discoteca o gastrobar) y definir tu rol (Administrador del Bar o Cajero).
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-amber-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              <span>Esperando asignación en tiempo real...</span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono">
              Proporciona tu correo ({user?.email}) a los administradores. En cuanto te asignen tu bar, la pantalla se actualizará automáticamente.
            </p>
          </div>

          {/* Botón de Cerrar Sesión */}
          <button
            onClick={() => logout()}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 border border-slate-700"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
};

