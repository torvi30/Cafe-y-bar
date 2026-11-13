import React, { useState, useEffect } from 'react';
import { useCashShiftStore, CashMovement, CashShift } from '../store/cashShiftStore';
import { useTenantConfig } from '../context/TenantConfigContext';
import { useAuth } from '../context/AuthContext';
import {
  listenActiveCashShift,
  listenCashShiftsHistory,
  openCashShiftInDb,
  closeCashShiftInDb,
  addMovementToActiveShift,
} from '../services/cashShiftService';
import { toastSuccess, notifyError } from '../lib/alerts';

export const CashControlView: React.FC = () => {
  const { tenantId, settings } = useTenantConfig();
  const { user } = useAuth();
  const {
    currentShift,
    shiftHistory,
    openShift,
    addMovement,
    closeShift,
    getShiftTotals,
  } = useCashShiftStore();

  const [isLoading, setIsLoading] = useState(true);

  // Escuchar turno activo e historial desde Firestore
  useEffect(() => {
    if (!tenantId) return;
    setIsLoading(true);

    const unsubActive = listenActiveCashShift(tenantId, (shift) => {
      useCashShiftStore.setState({ currentShift: shift });
      setIsLoading(false);
    });

    const unsubHistory = listenCashShiftsHistory(tenantId, (history) => {
      useCashShiftStore.setState({ shiftHistory: history });
    });

    return () => {
      unsubActive();
      unsubHistory();
    };
  }, [tenantId]);

  const totals = getShiftTotals();

  // Estados locales para formularios
  const [initialCashInput, setInitialCashInput] = useState<number>(200000);
  const [cashierInput, setCashierInput] = useState(user?.displayName || 'Bartender Principal');

  // Movimiento menor (Gasto/Entrada)
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<'ENTRY' | 'EXPENSE'>('EXPENSE');
  const [movementAmount, setMovementAmount] = useState<number>(20000);
  const [movementReason, setMovementReason] = useState('');

  // Cierre Z / Arqueo
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [countedCashInput, setCountedCashInput] = useState<number>(0);
  const [closeNotes, setCloseNotes] = useState('');
  const [closedReport, setClosedReport] = useState<any>(null);

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (initialCashInput < 0 || !tenantId) return;
    try {
      const shift = await openCashShiftInDb(
        tenantId,
        initialCashInput,
        cashierInput,
        user?.uid
      );
      useCashShiftStore.setState({ currentShift: shift });
      toastSuccess(`Turno #${shift.shiftNumber} abierto exitosamente con base de $${initialCashInput.toLocaleString('es-CO')}`);
    } catch (err: any) {
      console.error('Error abriendo turno:', err);
      notifyError('Error de Caja', err.message || 'No se pudo abrir el turno.');
    }
  };

  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (movementAmount <= 0 || !movementReason.trim() || !tenantId || !currentShift) return;
    try {
      const movement: CashMovement = {
        id: 'mov_' + Date.now(),
        type: movementType,
        amount: movementAmount,
        reason: movementReason.trim(),
        time: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      };

      await addMovementToActiveShift(
        tenantId,
        currentShift.id,
        movement,
        currentShift.movements || []
      );
      toastSuccess(`Movimiento registrado: ${movementType === 'ENTRY' ? '+' : '-'}$${movementAmount.toLocaleString('es-CO')}`);
      setIsMovementModalOpen(false);
      setMovementReason('');
    } catch (err: any) {
      console.error('Error agregando movimiento:', err);
      notifyError('Error', err.message || 'No se pudo guardar el movimiento');
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !currentShift) return;
    try {
      await closeCashShiftInDb(
        tenantId,
        currentShift.id,
        countedCashInput,
        totals.expectedCash,
        closeNotes
      );
      const report = {
        ...currentShift,
        countedCash: countedCashInput,
        expectedCash: totals.expectedCash,
        difference: countedCashInput - totals.expectedCash,
        notes: closeNotes,
        closedAt: new Date().toLocaleString('es-CO'),
      };
      setClosedReport(report);
      useCashShiftStore.setState({ currentShift: null });
      setIsCloseModalOpen(false);
      toastSuccess('Turno de caja cerrado y archivado en Firestore');
    } catch (err: any) {
      console.error('Error cerrando turno:', err);
      notifyError('Error', err.message || 'No se pudo cerrar el turno');
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#07090e] p-6 text-white overflow-y-auto select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <span>💵</span> Control de Caja, Turnos & Arqueos (X / Z)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Módulo Condicional Activo (<code className="text-amber-400 font-mono">cashControlEnabled: true</code>) •
            Auditoría de base inicial, gastos menores y arqueo ciego para {settings.businessName}.
          </p>
        </div>

        {currentShift && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMovementModalOpen(true)}
              className="bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold px-3.5 py-2 rounded-xl text-xs uppercase transition border border-slate-700"
            >
              + Gasto / Entrada Barra
            </button>
            <button
              onClick={() => {
                setCountedCashInput(totals.expectedCash);
                setIsCloseModalOpen(true);
              }}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition active:scale-95"
            >
              🔒 Cierre de Turno (Corte Z)
            </button>
          </div>
        )}
      </div>

      {/* ─── CASO 1: TURNO CERRADO (Pantalla para abrir caja) ─── */}
      {!currentShift ? (
        <div className="max-w-md mx-auto my-auto bg-[#0d121e] border border-slate-800 rounded-3xl p-6 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-400 text-3xl flex items-center justify-center mx-auto mb-4">
            🔒
          </div>
          <h2 className="text-xl font-black text-white">Caja Cerrada</h2>
          <p className="text-xs text-slate-400 mt-1 mb-5">
            Ingresa la base inicial en efectivo para abrir el turno de noche y comenzar a vender.
          </p>

          <form onSubmit={handleOpenShift} className="space-y-4 text-left text-xs">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Cajero / Bartender a Cargo</label>
              <input
                type="text"
                required
                value={cashierInput}
                onChange={(e) => setCashierInput(e.target.value)}
                className="w-full bg-[#07090e] border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2 text-white"
              />
            </div>

            <div>
              <label className="font-bold text-amber-400 block mb-1">
                Base Inicial en Efectivo (COP) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-base font-mono font-bold text-amber-400">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={initialCashInput}
                  onChange={(e) => setInitialCashInput(Number(e.target.value))}
                  placeholder="200000"
                  className="w-full bg-[#07090e] border border-slate-700 focus:border-amber-400 rounded-xl pl-8 pr-3.5 py-2.5 text-xl font-mono font-black text-white"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Dinero en billetes y monedas para cambio / vuelto.
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-amber-400/20 active:scale-95 mt-4"
            >
              Abrir Turno de Caja
            </button>
          </form>
        </div>
      ) : (
        /* ─── CASO 2: TURNO ACTIVO (Dashboard de Caja en Vivo) ─── */
        <div className="space-y-6">
          {/* Banner de Estado del Turno */}
          <div className="flex items-center justify-between bg-[#0e1422] border border-emerald-500/30 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
              <div>
                <span className="font-black text-sm text-white">
                  Turno #{currentShift.shiftNumber} EN CURSO
                </span>
                <p className="text-xs text-slate-400">
                  Responsable: <strong className="text-slate-200">{currentShift.cashierName}</strong> • Abierto a las{' '}
                  <strong className="text-slate-200 font-mono">{currentShift.openedAt}</strong>
                </p>
              </div>
            </div>

            <button
              onClick={() => alert(`Corte X Parcial:\nVentas Turno: $${totals.totalSales.toLocaleString('es-CO')}\nEfectivo Esperado: $${totals.expectedCash.toLocaleString('es-CO')}`)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700"
            >
              🖨️ Imprimir Corte X (Auditoría)
            </button>
          </div>

          {/* Tarjetas KPI de Caja */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Efectivo Esperado en Cajón */}
            <div className="bg-[#0e1422] border border-amber-400/40 p-4 rounded-3xl relative overflow-hidden">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                💵 Efectivo Esperado en Cajón
              </span>
              <p className="text-3xl font-black text-white font-mono mt-1">
                ${totals.expectedCash.toLocaleString('es-CO')}
              </p>
              <span className="text-[10px] text-slate-400 block mt-1">
                Base (${currentShift.initialCash.toLocaleString('es-CO')}) + Ventas Efectivo - Gastos
              </span>
            </div>

            {/* Ventas en Efectivo */}
            <div className="bg-[#0e1422] border border-slate-800 p-4 rounded-3xl">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                💵 Ventas Efectivo
              </span>
              <p className="text-2xl font-black text-white font-mono mt-1">
                ${currentShift.cashSales.toLocaleString('es-CO')}
              </p>
              <span className="text-[10px] text-slate-400 block mt-1">Ingresos billetes en barra</span>
            </div>

            {/* Ventas Datáfono */}
            <div className="bg-[#0e1422] border border-slate-800 p-4 rounded-3xl">
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">
                💳 Ventas Datáfono
              </span>
              <p className="text-2xl font-black text-white font-mono mt-1">
                ${currentShift.cardSales.toLocaleString('es-CO')}
              </p>
              <span className="text-[10px] text-slate-400 block mt-1">Vouchers tarjetas débito/crédito</span>
            </div>

            {/* Ventas Transferencia */}
            <div className="bg-[#0e1422] border border-slate-800 p-4 rounded-3xl">
              <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block">
                📱 Transferencias (Nequi/Davi)
              </span>
              <p className="text-2xl font-black text-white font-mono mt-1">
                ${currentShift.transferSales.toLocaleString('es-CO')}
              </p>
              <span className="text-[10px] text-slate-400 block mt-1">Comprobantes QR</span>
            </div>
          </div>

          {/* Tabla de Movimientos Menores (Gastos de Barra) */}
          <div className="bg-[#0d121e] border border-slate-800 rounded-3xl p-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <h3 className="font-black text-sm text-white flex items-center gap-2">
                <span>🧾</span> Movimientos y Gastos Menores de Barra
              </h3>
              <span className="text-xs font-mono text-slate-400">
                {currentShift.movements.length} movimientos
              </span>
            </div>

            {currentShift.movements.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No se han registrado salidas ni entradas extraordinarias en este turno
              </p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="p-2">Hora</th>
                    <th className="p-2">Tipo</th>
                    <th className="p-2">Motivo / Descripción</th>
                    <th className="p-2 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {currentShift.movements.map((mov) => (
                    <tr key={mov.id}>
                      <td className="p-2 text-slate-400 font-sans">{mov.time}</td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            mov.type === 'EXPENSE'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {mov.type === 'EXPENSE' ? '▼ Salida / Gasto' : '▲ Ingreso Extra'}
                        </span>
                      </td>
                      <td className="p-2 text-white font-sans">{mov.reason}</td>
                      <td
                        className={`p-2 text-right font-bold text-sm ${
                          mov.type === 'EXPENSE' ? 'text-red-400' : 'text-emerald-400'
                        }`}
                      >
                        {mov.type === 'EXPENSE' ? '-' : '+'}${mov.amount.toLocaleString('es-CO')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Historial de Turnos Anteriores */}
      {shiftHistory.length > 0 && (
        <div className="mt-8 bg-[#0d121e] border border-slate-800 rounded-3xl p-5">
          <h3 className="font-black text-sm text-white mb-3">Historial de Turnos Cerrados</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                  <th className="p-2.5">Turno</th>
                  <th className="p-2.5">Cajero</th>
                  <th className="p-2.5">Horario</th>
                  <th className="p-2.5 text-right">Ventas Totales</th>
                  <th className="p-2.5 text-right">Efectivo Contado</th>
                  <th className="p-2.5 text-center">Diferencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {shiftHistory.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/30">
                    <td className="p-2.5 font-bold text-amber-400">#{s.shiftNumber}</td>
                    <td className="p-2.5 text-slate-300 font-sans">{s.cashierName}</td>
                    <td className="p-2.5 text-slate-400 font-sans">
                      {s.openedAt} - {s.closedAt}
                    </td>
                    <td className="p-2.5 text-right text-emerald-400 font-bold">
                      ${(s.cashSales + s.cardSales + s.transferSales).toLocaleString('es-CO')}
                    </td>
                    <td className="p-2.5 text-right text-white">
                      ${(s.countedCash || 0).toLocaleString('es-CO')}
                    </td>
                    <td className="p-2.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.difference === 0
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : (s.difference || 0) < 0
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {s.difference === 0
                          ? '✓ Cuadrado'
                          : `${(s.difference || 0) < 0 ? '-' : '+'}$${Math.abs(s.difference || 0).toLocaleString('es-CO')}`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Registrar Gasto / Entrada */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1422] border border-slate-700 rounded-3xl p-6 max-w-sm w-full">
            <h3 className="text-base font-black text-white mb-3">Movimiento de Caja Menor</h3>
            <form onSubmit={handleAddMovement} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Tipo de Movimiento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovementType('EXPENSE')}
                    className={`py-2 rounded-xl font-bold transition ${
                      movementType === 'EXPENSE'
                        ? 'bg-red-500 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Salida / Gasto
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementType('ENTRY')}
                    className={`py-2 rounded-xl font-bold transition ${
                      movementType === 'ENTRY'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Ingreso Extra
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Monto en Efectivo (COP)</label>
                <input
                  type="number"
                  min="500"
                  step="500"
                  required
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(Number(e.target.value))}
                  className="w-full bg-[#07090e] border border-slate-700 rounded-xl p-2.5 text-base font-mono font-bold text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Motivo / Justificación</label>
                <input
                  type="text"
                  required
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  placeholder="Ej: 2 Bolsas de Hielo de emergencia"
                  className="w-full bg-[#07090e] border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-400 text-slate-950 font-black rounded-xl"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cierre Z / Arqueo Ciego */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1422] border border-red-500/40 rounded-3xl p-6 max-w-md w-full">
            <h3 className="text-lg font-black text-white mb-1">🔒 Cierre de Turno & Arqueo Z</h3>
            <p className="text-xs text-slate-400 mb-4">
              Cuenta el dinero físico total en el cajón para verificar si la caja está cuadrada.
            </p>

            <form onSubmit={handleCloseShift} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Efectivo Teórico Esperado:</span>
                <span className="font-mono font-black text-emerald-400 text-base">
                  ${totals.expectedCash.toLocaleString('es-CO')}
                </span>
              </div>

              <div>
                <label className="text-amber-400 font-bold block mb-1">
                  Efectivo Físico Real Contado en Cajón (COP) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  required
                  value={countedCashInput}
                  onChange={(e) => setCountedCashInput(Number(e.target.value))}
                  className="w-full bg-[#07090e] border border-slate-700 focus:border-amber-400 rounded-xl p-3 text-xl font-mono font-black text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Observaciones / Notas de Cierre</label>
                <textarea
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="Ej: Turno entregado sin novedades, billetes organizados."
                  className="w-full bg-[#07090e] border border-slate-700 rounded-xl p-2.5 text-white h-16"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCloseModalOpen(false)}
                  className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl uppercase tracking-wider"
                >
                  Cerrar Turno Definitivo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reporte Z de Cierre Final */}
      {closedReport && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1422] border border-emerald-500/50 rounded-3xl p-6 max-w-sm w-full text-center">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-2xl mb-2">
              ✓
            </div>
            <h3 className="text-lg font-black text-white">REPORTE Z GENERADO</h3>
            <p className="text-xs text-slate-400">Turno #{closedReport.shiftNumber} Liquidado</p>

            <div className="my-4 bg-[#07090e] p-3 rounded-2xl border border-slate-800 text-left text-xs font-mono space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Ventas:</span>
                <span className="text-white font-bold">
                  ${(closedReport.cashSales + closedReport.cardSales + closedReport.transferSales).toLocaleString('es-CO')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Efectivo Contado:</span>
                <span className="text-white font-bold">${closedReport.countedCash?.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800">
                <span className="text-slate-400">Resultado Arqueo:</span>
                <span
                  className={`font-black ${
                    closedReport.difference === 0
                      ? 'text-emerald-400'
                      : closedReport.difference < 0
                      ? 'text-red-400'
                      : 'text-blue-400'
                  }`}
                >
                  {closedReport.difference === 0
                    ? 'CUADRADO ($0)'
                    : `${closedReport.difference < 0 ? 'FALTANTE' : 'SOBRANTE'}: $${Math.abs(closedReport.difference).toLocaleString('es-CO')}`}
                </span>
              </div>
            </div>

            <button
              onClick={() => setClosedReport(null)}
              className="w-full py-3 bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase"
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

