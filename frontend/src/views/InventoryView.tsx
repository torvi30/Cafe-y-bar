import React, { useState, useEffect, useMemo } from 'react';
import { useTenantConfig } from '../context/TenantConfigContext';
import { listenCompanyProducts, updateCompanyProduct } from '../services/productService';
import type { PosProduct } from '../store/posStore';
import { toastSuccess, notifyError } from '../lib/alerts';

export const InventoryView: React.FC = () => {
  const { tenantId } = useTenantConfig();
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [editingItem, setEditingItem] = useState<PosProduct | null>(null);
  const [newStockValue, setNewStockValue] = useState<number>(0);
  const [newMinStockValue, setNewMinStockValue] = useState<number>(5);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    setIsLoading(true);
    const unsub = listenCompanyProducts(tenantId, (prods) => {
      setProducts(prods);
      setIsLoading(false);
    });
    return () => unsub();
  }, [tenantId]);

  const inventoryProducts = useMemo(() => {
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      unit: p.inventory?.unit || 'BOTELLA',
      stock: p.inventory?.stock ?? 0,
      minStockAlert: p.inventory?.minStockAlert ?? 5,
      cost: p.inventory?.cost || Math.round(p.price * 0.4),
      rawProduct: p,
    }));
  }, [products]);

  const totalValuation = useMemo(() => {
    return inventoryProducts.reduce((acc, item) => acc + item.stock * item.cost, 0);
  }, [inventoryProducts]);

  const criticalItemsCount = useMemo(() => {
    return inventoryProducts.filter((item) => item.stock <= item.minStockAlert).length;
  }, [inventoryProducts]);

  const handleAdjustStock = async () => {
    if (!editingItem || !tenantId) return;
    try {
      await updateCompanyProduct(tenantId, editingItem.id, {
        inventory: {
          stock: Number(newStockValue),
          minStockAlert: Number(newMinStockValue),
          unit: editingItem.inventory?.unit || 'BOTELLA',
          cost: editingItem.inventory?.cost || Math.round(editingItem.price * 0.4),
        },
      });
      toastSuccess(`Stock de ${editingItem.name} actualizado a ${newStockValue}`);
      setEditingItem(null);
    } catch (err: any) {
      console.error('Error actualizando stock:', err);
      notifyError('Error de Inventario', err.message || 'No se pudo actualizar el stock');
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0d14] p-6 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <span>📦</span> Control de Inventario & Bodega
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Módulo Condicional Activo (<code className="text-amber-400 font-mono">inventoryEnabled: true</code>) •
            Descuento automático en ventas POS y alertas de merma.
          </p>
        </div>

        <button
          onClick={() => alert('Entrada de mercancía / Factura de compra proveedor')}
          className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition"
        >
          + Entrada de Mercancía
        </button>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-3 gap-4 mb-6 shrink-0">
        <div className="bg-[#121824] border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-400 uppercase font-semibold">Valor Total en Bodega</span>
          <p className="text-2xl font-black text-white font-mono mt-1">
            ${totalValuation.toLocaleString('es-CO')}
          </p>
        </div>
        <div className="bg-[#121824] border border-amber-500/30 p-4 rounded-2xl">
          <span className="text-xs text-amber-400 uppercase font-semibold">Productos con Stock Bajo</span>
          <p className="text-2xl font-black text-amber-400 font-mono mt-1">
            {criticalItemsCount} referencias
          </p>
        </div>
        <div className="bg-[#121824] border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-400 uppercase font-semibold">Total Unidades Físicas</span>
          <p className="text-2xl font-black text-emerald-400 font-mono mt-1">
            {inventoryProducts.reduce((acc, i) => acc + i.stock, 0)} unidades
          </p>
        </div>
      </div>

      {/* Tabla de Existencias */}
      <div className="flex-1 overflow-y-auto bg-[#121824] border border-slate-800 rounded-3xl p-4 shadow-xl">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
              <th className="p-3">Referencia / Producto</th>
              <th className="p-3">Categoría</th>
              <th className="p-3">Unidad</th>
              <th className="p-3 text-right">Costo Unit.</th>
              <th className="p-3 text-center">Stock Actual</th>
              <th className="p-3 text-center">Mín. Alerta</th>
              <th className="p-3 text-center">Estado</th>
              <th className="p-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500 font-sans">
                  Sincronizando inventario en tiempo real con Firestore...
                </td>
              </tr>
            ) : inventoryProducts.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500 font-sans">
                  No hay productos registrados en el catálogo de este bar.
                </td>
              </tr>
            ) : (
              inventoryProducts.map((item) => {
                const isLow = item.stock <= item.minStockAlert;
                return (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition font-sans">
                    <td className="p-3 font-bold text-white">{item.name}</td>
                    <td className="p-3 text-slate-400 text-xs">{item.category}</td>
                    <td className="p-3 text-slate-300 font-mono text-[11px]">{item.unit}</td>
                    <td className="p-3 text-right font-mono text-slate-300">
                      ${item.cost.toLocaleString('es-CO')}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-base text-white">
                      {item.stock}
                    </td>
                    <td className="p-3 text-center font-mono text-slate-400">{item.minStockAlert}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isLow
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        }`}
                      >
                        {isLow ? '⚠️ Reponer' : '✓ Óptimo'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          setEditingItem(item.rawProduct);
                          setNewStockValue(item.stock);
                          setNewMinStockValue(item.minStockAlert);
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-amber-300 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                      >
                        Ajustar Stock
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Ajuste de Stock */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121824] border border-slate-700 rounded-3xl p-6 max-w-sm w-full">
            <h3 className="text-base font-black text-white mb-2">Ajustar Stock Físico</h3>
            <p className="text-xs text-slate-400 mb-4">{editingItem.name}</p>

            <label className="text-xs text-slate-300 block mb-1">Nueva cantidad disponible:</label>
            <input
              type="number"
              value={newStockValue}
              onChange={(e) => setNewStockValue(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xl font-mono text-center font-bold text-amber-400 focus:outline-none focus:border-amber-400"
            />

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setEditingItem(null)}
                className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs uppercase"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdjustStock}
                className="flex-1 py-2.5 bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

