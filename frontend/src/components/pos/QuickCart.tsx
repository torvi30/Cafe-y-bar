import React, { useState } from 'react';
import { usePosStore } from '../../store/posStore';
import { useTenantConfig } from '../../context/TenantConfigContext';
import { FeatureGate } from '../common/FeatureGate';
import { FastPayButtons } from './FastPayButtons';

interface QuickCartProps {
  onCheckout: (method: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA') => void;
  isProcessing: boolean;
}

export const QuickCart: React.FC<QuickCartProps> = ({ onCheckout, isProcessing }) => {
  const {
    cart,
    customerNit,
    setCustomerNit,
    customerName,
    setCustomerName,
    addItem,
    decreaseItem,
    removeItem,
    clearCart,
    getTotals,
    includeTip,
    toggleTip,
  } = usePosStore();

  const { isFeatureActive } = useTenantConfig();
  const { subtotal, taxAmount, tipAmount, total, itemsCount } = getTotals();

  // Calculadora rápida de cambio para barra (Vuelto)
  const [cashGiven, setCashGiven] = useState<number | null>(null);
  const [showCustomerInput, setShowCustomerInput] = useState(false);

  const changeDue = cashGiven !== null && cashGiven >= total ? cashGiven - total : 0;

  return (
    <div className="flex flex-col h-full w-full bg-[#0d121e] border border-slate-800 rounded-2xl p-4 shadow-2xl overflow-hidden select-none">
      {/* ─── 1. HEADER DEL TICKET ─── */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-base">🧾</span>
          <div>
            <h2 className="font-black text-sm text-white tracking-wide">TICKET DE BARRA</h2>
            <span className="text-[10px] text-slate-400 font-mono">
              {itemsCount} {itemsCount === 1 ? 'producto' : 'productos'}
            </span>
          </div>
        </div>

        {cart.length > 0 && (
          <button
            onClick={() => {
              clearCart();
              setCashGiven(null);
            }}
            className="text-[10px] font-bold text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 px-2 py-1 rounded-lg transition"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* ─── 2. ADQUIRENTE FISCAL DIAN (1-CLICK) ─── */}
      <div className="my-2 bg-[#090d16] p-2 rounded-xl border border-slate-800/80 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <span>👤</span> Adquirente Fiscal
          </span>
          <button
            onClick={() => setShowCustomerInput(!showCustomerInput)}
            className="text-[10px] text-amber-400 hover:underline font-medium"
          >
            {showCustomerInput ? 'Ocultar' : 'Identificar Cliente'}
          </button>
        </div>

        {!showCustomerInput ? (
          <div className="flex items-center justify-between text-[11px] text-slate-300">
            <span className="font-mono text-xs font-bold text-white">Consumidor Final</span>
            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded font-mono text-slate-400">
              222222222222
            </span>
          </div>
        ) : (
          <div className="space-y-1.5 pt-1 animate-in fade-in duration-150">
            <input
              type="text"
              value={customerNit}
              onChange={(e) => setCustomerNit(e.target.value)}
              placeholder="Cédula o NIT..."
              className="w-full bg-[#121824] border border-slate-700 text-xs px-2.5 py-1 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
            />
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nombre o Razón Social..."
              className="w-full bg-[#121824] border border-slate-700 text-xs px-2.5 py-1 rounded-lg text-white focus:outline-none focus:border-amber-400"
            />
          </div>
        )}
      </div>

      {/* ─── 3. LISTA DE PRODUCTOS CON SCROLL ─── */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 my-1">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-8">
            <span className="text-3xl mb-1 opacity-30">🍸</span>
            <p className="text-xs font-medium">Toca tragos o cervezas para agregar</p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2 bg-[#090d16]/90 border border-slate-800/80 rounded-xl"
            >
              <div className="flex-1 min-w-0 mr-1.5">
                <p className="text-xs font-bold text-white truncate">{item.name}</p>
                <p className="text-[11px] text-amber-400 font-mono font-semibold">
                  ${(item.price * item.quantity).toLocaleString('es-CO')}
                </p>
              </div>

              {/* Botonera de incremento */}
              <div className="flex items-center gap-1 bg-[#121824] px-1 py-0.5 rounded-lg border border-slate-800">
                <button
                  onClick={() => decreaseItem(item.id)}
                  className="w-5 h-5 flex items-center justify-center text-xs font-black text-slate-400 hover:text-white bg-slate-800 rounded hover:bg-slate-700 active:scale-90"
                >
                  -
                </button>
                <span className="w-4 text-center font-bold text-xs text-white font-mono">
                  {item.quantity}
                </span>
                <button
                  onClick={() => addItem(item)}
                  className="w-5 h-5 flex items-center justify-center text-xs font-black text-slate-400 hover:text-white bg-slate-800 rounded hover:bg-slate-700 active:scale-90"
                >
                  +
                </button>
              </div>

              <button
                onClick={() => removeItem(item.id)}
                className="ml-1 text-slate-400 hover:text-red-400 text-xs p-1"
                title="Eliminar"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      {/* ─── 4. CALCULADORA RÁPIDA DE CAMBIO / VUELTO (Élite de Barra) ─── */}
      {cart.length > 0 && (
        <div className="border-t border-slate-800/80 pt-2 shrink-0">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span>Billete Recibido:</span>
            {cashGiven && (
              <span className="font-mono text-emerald-400 font-bold">
                Vuelto: ${changeDue.toLocaleString('es-CO')}
              </span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-1">
            <button
              onClick={() => setCashGiven(total)}
              className="py-1 bg-slate-800/80 hover:bg-slate-700 text-[10px] text-slate-200 rounded font-semibold"
            >
              Exacto
            </button>
            <button
              onClick={() => setCashGiven(50000)}
              className="py-1 bg-slate-800/80 hover:bg-slate-700 text-[10px] text-slate-200 rounded font-mono"
            >
              $50k
            </button>
            <button
              onClick={() => setCashGiven(100000)}
              className="py-1 bg-slate-800/80 hover:bg-slate-700 text-[10px] text-slate-200 rounded font-mono"
            >
              $100k
            </button>
            <button
              onClick={() => setCashGiven(200000)}
              className="py-1 bg-slate-800/80 hover:bg-slate-700 text-[10px] text-slate-200 rounded font-mono"
            >
              $200k
            </button>
          </div>
        </div>
      )}

      {/* ─── 5. RESUMEN FISCAL DIAN Y TOTAL ─── */}
      <div className="border-t border-slate-800/80 pt-2 space-y-1 text-[11px] text-slate-400 shrink-0">
        <div className="flex justify-between">
          <span>Base Gravable:</span>
          <span className="font-mono text-slate-300">${subtotal.toLocaleString('es-CO')}</span>
        </div>

        <div className="flex justify-between">
          <span>Impuestos (ICO 8% / IVA ya incl.):</span>
          <span className="font-mono text-slate-300">${taxAmount.toLocaleString('es-CO')}</span>
        </div>

        {/* Feature Gate: Propina Voluntaria */}
        <FeatureGate feature="propinaSugeridaEnabled">
          <div className="flex justify-between items-center py-1 bg-[#090d16] px-2.5 rounded-xl border border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer text-slate-200 text-xs font-semibold">
              <input
                type="checkbox"
                checked={includeTip}
                onChange={toggleTip}
                className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-amber-400 focus:ring-0 cursor-pointer"
              />
              <span>Propina Voluntaria (10%):</span>
            </label>
            <span className="font-mono font-bold text-amber-300">${tipAmount.toLocaleString('es-CO')}</span>
          </div>
        </FeatureGate>

        <div className="flex justify-between items-baseline pt-1.5 border-t border-slate-800">
          <span className="text-xs font-black text-white">TOTAL A COBRAR:</span>
          <span className="text-2xl font-black font-mono text-emerald-400 tracking-tight">
            ${total.toLocaleString('es-CO')}
          </span>
        </div>
      </div>

      {/* ─── 6. BOTONERA DE COBRO 1-TAP ─── */}
      <div className="shrink-0 mt-1">
        <FastPayButtons onPay={onCheckout} disabled={isProcessing} total={total} />
      </div>
    </div>
  );
};
