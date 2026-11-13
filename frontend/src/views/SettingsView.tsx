import React from 'react';
import { useTenantConfig, TenantFeatures } from '../context/TenantConfigContext';

export const SettingsView: React.FC = () => {
  const { settings, features, updateFeatureFlag } = useTenantConfig();

  const handleToggle = (key: keyof TenantFeatures) => {
    updateFeatureFlag(key, !features[key]);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0d14] p-6 text-white overflow-y-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 mb-6">
        <h1 className="text-2xl font-black text-white flex items-center gap-3">
          <span>⚙️</span> Configuración Modular de Tenant & Feature Flags
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Activa o desactiva módulos en caliente para adaptar el sistema al perfil específico del bar.
          Los cambios se sincronizan en Firestore (<code className="text-amber-400 font-mono">tenants/{'{tenantId}'}/config/settings</code>).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
        {/* PANEL 1: INTERRUPTORES DE MÓDULOS (FEATURE FLAGS) */}
        <div className="bg-[#121824] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-black text-white border-b border-slate-800 pb-3 flex items-center justify-between">
            <span>Módulos del Sistema</span>
            <span className="text-xs font-mono text-amber-400 font-normal">Suscripción SaaS</span>
          </h2>

          {/* 1. MÓDULO BASE: POS Rápido */}
          <div className="flex items-center justify-between p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">⚡ POS Barra Ultra-Rápido</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">
                  BASE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Venta táctil a 1-tap optimizada para entornos nocturnos de alta afluencia.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500 font-bold uppercase">Siempre Activo</span>
          </div>

          {/* 2. MÓDULO BASE: Facturación DIAN */}
          <div className="flex items-center justify-between p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">📑 Facturación Electrónica DIAN</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">
                  LEGAL
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Emisión de XML UBL 2.1, cálculo de CUFE y numeración fiscal consecutiva.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500 font-bold uppercase">Siempre Activo</span>
          </div>

          {/* 3. MÓDULO CONDICIONAL: Inventario */}
          <div className="flex items-center justify-between p-3.5 bg-slate-900/90 rounded-2xl border border-slate-700/80 hover:border-amber-400/50 transition">
            <div className="pr-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">📦 Control de Inventario & Bodega</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">
                  FLAG: inventoryEnabled
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {features.inventoryEnabled
                  ? 'Activo: descuenta existencias en cada trago/botella y alerta stock bajo en tiempo real.'
                  : 'Desactivado: oculta existencias y costos; permite facturar libremente sin trabas.'}
              </p>
            </div>
            <button
              onClick={() => handleToggle('inventoryEnabled')}
              className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-200 shrink-0 ${features.inventoryEnabled ? 'bg-amber-400 justify-end' : 'bg-slate-800 justify-start'
                }`}
            >
              <div className="w-6 h-6 rounded-full bg-slate-950 shadow-md"></div>
            </button>
          </div>

          {/* 4. MÓDULO CONDICIONAL: Mesas y Tabs */}
          <div className="flex items-center justify-between p-3.5 bg-slate-900/90 rounded-2xl border border-slate-700/80 hover:border-amber-400/50 transition">
            <div className="pr-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">🍹 Mesas & Cuentas Abiertas (Tabs)</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">
                  FLAG: tableTabsEnabled
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {features.tableTabsEnabled
                  ? 'Activo: permite abrir comandas por mesa o tab de barra antes de cerrar la factura.'
                  : 'Desactivado: flujo directo de barra sin gestión de cuentas abiertas.'}
              </p>
            </div>
            <button
              onClick={() => handleToggle('tableTabsEnabled')}
              className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-200 shrink-0 ${features.tableTabsEnabled ? 'bg-amber-400 justify-end' : 'bg-slate-800 justify-start'
                }`}
            >
              <div className="w-6 h-6 rounded-full bg-slate-950 shadow-md"></div>
            </button>
          </div>

          {/* 5. MÓDULO CONDICIONAL: Propina sugerida 10% */}
          <div className="flex items-center justify-between p-3.5 bg-slate-900/90 rounded-2xl border border-slate-700/80 hover:border-amber-400/50 transition">
            <div className="pr-4">
              <span className="font-bold text-sm text-white">💰 Propina Sugerida Voluntaria (10%)</span>
              <p className="text-xs text-slate-400 mt-0.5">
                Habilita el checkbox de propina voluntaria en la liquidación del ticket de barra.
              </p>
            </div>
            <button
              onClick={() => handleToggle('propinaSugeridaEnabled')}
              className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-200 shrink-0 ${features.propinaSugeridaEnabled ? 'bg-amber-400 justify-end' : 'bg-slate-800 justify-start'
                }`}
            >
              <div className="w-6 h-6 rounded-full bg-slate-950 shadow-md"></div>
            </button>
          </div>

          {/* 6. MÓDULO CONDICIONAL: Control de Caja & Turnos (X / Z) */}
          <div className="flex items-center justify-between p-3.5 bg-slate-900/90 rounded-2xl border border-slate-700/80 hover:border-amber-400/50 transition">
            <div className="pr-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">💵 Control de Caja, Turnos & Arqueo</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                  FLAG: cashControlEnabled
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {features.cashControlEnabled
                  ? 'Activo: exige apertura con base, registra gastos de barra y realiza arqueo ciego Z al cerrar.'
                  : 'Desactivado: venta directa sin apertura ni cierre de caja; el sistema no pide cuadres.'}
              </p>
            </div>
            <button
              onClick={() => handleToggle('cashControlEnabled')}
              className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-200 shrink-0 ${features.cashControlEnabled ? 'bg-amber-400 justify-end' : 'bg-slate-800 justify-start'
                }`}
            >
              <div className="w-6 h-6 rounded-full bg-slate-950 shadow-md"></div>
            </button>
          </div>
        </div>

        {/* PANEL 2: DATOS DEL ESTABLECIMIENTO & PARÁMETROS DIAN */}
        <div className="bg-[#121824] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h2 className="text-lg font-black text-white border-b border-slate-800 pb-3">
            Datos Fiscales DIAN del Tenant
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Razón Social:</label>
              <input
                type="text"
                readOnly
                value={settings.businessName}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">NIT del Bar:</label>
                <input
                  type="text"
                  readOnly
                  value={settings.nit}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Prefijo DIAN:</label>
                <input
                  type="text"
                  readOnly
                  value={settings?.dianConfig?.prefix || 'SETT'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-amber-400 font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Resolución DIAN:</label>
              <input
                type="text"
                readOnly
                value={settings?.dianConfig?.resolutionNumber || '18764000001'}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
              />
            </div>

            <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-2xl text-amber-300 text-xs">
              💡 <strong>Prueba de interruptores en caliente:</strong>
              <p className="mt-1">
                Al activar o desactivar las banderas arriba, observa cómo el menú lateral y las vistas se actualizan
                automáticamente gracias al hook <code className="font-mono text-amber-200">useTenantConfig()</code> y los
                componentes <code className="font-mono text-amber-200">&lt;FeatureGate /&gt;</code>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

