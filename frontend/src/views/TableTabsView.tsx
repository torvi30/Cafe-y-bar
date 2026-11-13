import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePosStore } from '../store/posStore';
import { useTenantConfig } from '../context/TenantConfigContext';
import {
  listenCompanyTables,
  createTableInDb,
  deleteTableFromDb,
  TableTab,
} from '../services/tableService';
import { toastSuccess, notifyError, confirmAction } from '../lib/alerts';

export const TableTabsView: React.FC = () => {
  const { tenantId } = useTenantConfig();
  const [tables, setTables] = useState<TableTab[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tableNameInput, setTableNameInput] = useState('');
  const [waiterInput, setWaiterInput] = useState('Mesero 1');
  const navigate = useNavigate();
  const { setSelectedTableId } = usePosStore();

  useEffect(() => {
    if (!tenantId) return;
    setIsLoading(true);
    const unsub = listenCompanyTables(tenantId, (data) => {
      setTables(data);
      setIsLoading(false);
    });
    return () => unsub();
  }, [tenantId]);

  const handleOpenTable = (table: TableTab) => {
    setSelectedTableId(table.id);
    navigate('/pos');
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNameInput.trim() || !tenantId) return;
    try {
      await createTableInDb(tenantId, tableNameInput.trim(), waiterInput.trim());
      toastSuccess(`Mesa "${tableNameInput}" creada`);
      setTableNameInput('');
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error creando mesa:', err);
      notifyError('Error', err.message || 'No se pudo crear la mesa');
    }
  };

  const handleDeleteTable = async (e: React.MouseEvent, table: TableTab) => {
    e.stopPropagation();
    if (!tenantId) return;
    const confirmed = await confirmAction({
      title: '¿Eliminar Mesa?',
      text: `¿Eliminar "${table.name}" del mapa?`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      isDangerous: true,
    });
    if (confirmed) {
      await deleteTableFromDb(tenantId, table.id);
      toastSuccess(`Mesa "${table.name}" eliminada`);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0d14] p-6 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <span>🍹</span> Mesas & Cuentas Abiertas (Tabs)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Módulo Condicional Activo (<code className="text-amber-400 font-mono">tableTabsEnabled: true</code>) •
            Gestión de consumo abierto antes de emisión fiscal DIAN.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
        >
          + Nueva Mesa / Tab
        </button>
      </div>

      {/* Grilla de Mesas / Tabs */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-slate-500">
            Sincronizando mesas con Firestore...
          </div>
        ) : tables.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-3">
            <span className="text-4xl">🍹</span>
            <p className="text-sm">No hay mesas o comandas creadas todavía.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold transition"
            >
              + Crear Primera Mesa
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {tables.map((table) => {
              const isBusy = table.status === 'BUSY' || table.status === 'CLOSING';

              return (
                <div
                  key={table.id}
                  onClick={() => handleOpenTable(table)}
                  className={`flex flex-col justify-between p-5 rounded-3xl border transition cursor-pointer active:scale-95 group relative ${
                    isBusy
                      ? 'bg-[#121824] border-amber-400/50 hover:border-amber-400'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <button
                    onClick={(e) => handleDeleteTable(e, table)}
                    title="Eliminar mesa"
                    className="absolute top-4 right-4 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-1"
                  >
                    ✕
                  </button>

                  <div>
                    <div className="flex justify-between items-start pr-6">
                      <h3 className="font-black text-lg text-white">{table.name}</h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isBusy
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isBusy ? '● Ocupada' : '○ Libre'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Mesero: {table.waiter || 'Sin asignar'}</p>
                    {isBusy && (
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Abierta: {table.openedAt} • {table.itemsCount || 0} productos
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-baseline justify-between">
                    <span className="text-xs text-slate-400">Total acumulado:</span>
                    <span
                      className={`font-mono text-xl font-black ${
                        isBusy ? 'text-emerald-400' : 'text-slate-600'
                      }`}
                    >
                      ${(table.total || 0).toLocaleString('es-CO')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Crear Mesa */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121824] border border-slate-700 rounded-3xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-black text-white mb-4">Nueva Mesa o Comanda</h3>
            <form onSubmit={handleCreateTable} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Nombre o Número de Mesa</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Mesa 1 (Terraza) o Barra Tab 2"
                  value={tableNameInput}
                  onChange={(e) => setTableNameInput(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Mesero Responsable</label>
                <input
                  type="text"
                  placeholder="Ej: Carlos M."
                  value={waiterInput}
                  onChange={(e) => setWaiterInput(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase"
                >
                  Guardar Mesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

