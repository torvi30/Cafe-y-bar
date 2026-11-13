import React from 'react';

interface FastPayButtonsProps {
  onPay: (method: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA') => void;
  disabled: boolean;
  total: number;
}

export const FastPayButtons: React.FC<FastPayButtonsProps> = ({ onPay, disabled, total }) => {
  return (
    <div className="grid grid-cols-3 gap-2 pt-2">
      {/* Botón Efectivo */}
      <button
        type="button"
        disabled={disabled || total <= 0}
        onClick={() => onPay('EFECTIVO')}
        className="flex flex-col items-center justify-center py-2.5 px-2 bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 active:from-emerald-700 active:to-emerald-800 disabled:opacity-30 disabled:pointer-events-none text-white rounded-xl shadow-lg shadow-emerald-950/40 transition active:scale-95 border border-emerald-400/40"
      >
        <span className="text-lg">💵</span>
        <span className="text-[11px] font-black tracking-wider uppercase mt-0.5">Efectivo</span>
        <span className="text-[9px] text-emerald-100 font-mono">1-Tap DIAN</span>
      </button>

      {/* Botón Datáfono */}
      <button
        type="button"
        disabled={disabled || total <= 0}
        onClick={() => onPay('TARJETA')}
        className="flex flex-col items-center justify-center py-2.5 px-2 bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 active:from-blue-700 active:to-blue-800 disabled:opacity-30 disabled:pointer-events-none text-white rounded-xl shadow-lg shadow-blue-950/40 transition active:scale-95 border border-blue-400/40"
      >
        <span className="text-lg">💳</span>
        <span className="text-[11px] font-black tracking-wider uppercase mt-0.5">Datáfono</span>
        <span className="text-[9px] text-blue-100 font-mono">Tarjeta</span>
      </button>

      {/* Botón Transferencia */}
      <button
        type="button"
        disabled={disabled || total <= 0}
        onClick={() => onPay('TRANSFERENCIA')}
        className="flex flex-col items-center justify-center py-2.5 px-2 bg-gradient-to-b from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 active:from-purple-700 active:to-purple-800 disabled:opacity-30 disabled:pointer-events-none text-white rounded-xl shadow-lg shadow-purple-950/40 transition active:scale-95 border border-purple-400/40"
      >
        <span className="text-lg">📱</span>
        <span className="text-[11px] font-black tracking-wider uppercase mt-0.5">Transfer</span>
        <span className="text-[9px] text-purple-100 font-mono">Nequi/Davi</span>
      </button>
    </div>
  );
};
