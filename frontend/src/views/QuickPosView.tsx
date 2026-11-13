import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePosStore } from '../store/posStore';
import { useTenantConfig } from '../context/TenantConfigContext';
import { useCashShiftStore } from '../store/cashShiftStore';
import { useAuth } from '../context/AuthContext';
import { ProductCard } from '../components/pos/ProductCard';
import { QuickCart } from '../components/pos/QuickCart';
import { ProductModal } from '../components/pos/ProductModal';
import { FeatureGate } from '../components/common/FeatureGate';
import { listenCompanyProducts } from '../services/productService';
import { createInvoiceTransaction } from '../services/invoiceService';
import { registerSaleToActiveShift } from '../services/cashShiftService';
import { clearTableInDb } from '../services/tableService';
import { notifySuccess, notifyError } from '../lib/alerts';

const CATEGORIES = [
  { id: 'TODOS', label: '🔥 Todo', icon: '✨' },
  { id: 'LICORES', label: 'Licores & Botellas', icon: '🍾' },
  { id: 'CERVEZAS', label: 'Cervezas', icon: '🍺' },
  { id: 'COCTELES', label: 'Cócteles', icon: '🍸' },
  { id: 'BEBIDAS_SIN_ALCOHOL', label: 'Sin Alcohol', icon: '🥤' },
  { id: 'SNACKS', label: 'Snacks', icon: '🍟' },
];

export const QuickPosView: React.FC = () => {
  const {
    products,
    setProducts,
    addItem,
    cart,
    clearCart,
    customerNit,
    customerName,
    customerEmail,
    selectedTableId,
    setSelectedTableId,
    getTotals,
    includeTip,
  } = usePosStore();
  const { tenantId, settings, isFeatureActive } = useTenantConfig();
  const { currentShift } = useCashShiftStore();
  const { user } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<any>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    const unsub = listenCompanyProducts(tenantId, (prods) => {
      setProducts(prods);
    });
    return () => unsub();
  }, [tenantId]);

  // Filtrado reactivo por categoría y búsqueda
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchCategory = selectedCategory === 'TODOS' || prod.category === selectedCategory;
      const matchSearch =
        searchQuery.trim() === '' ||
        prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleCheckout = async (paymentMethod: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA') => {
    if (cart.length === 0 || isProcessing) return;
    setIsProcessing(true);

    try {
      const { subtotal, taxAmount, tipAmount, total } = getTotals();
      const mappedMethod = paymentMethod === 'TARJETA' ? 'DATAFONO' : paymentMethod;

      // 1. Guardar factura real en Firestore y descontar inventario si el módulo está activo
      const invoice = await createInvoiceTransaction(tenantId, {
        customerName: customerName || 'Consumidor Final',
        customerNit: customerNit || '222222222222',
        customerEmail: customerEmail || '',
        paymentMethod: mappedMethod,
        cart,
        subtotal,
        taxAmount,
        tipAmount,
        total,
        cashierUid: user?.uid,
        cashierName: user?.displayName || user?.email || 'Cajero de Barra',
        shiftId: currentShift?.id || null,
        tableId: selectedTableId || null,
        dianPrefix: settings?.dianConfig?.prefix || 'SETT',
        inventoryEnabled: isFeatureActive('inventoryEnabled'),
      });

      setLastInvoice(invoice);

      // 2. Si el bar tiene control de caja activo y hay turno abierto en Firestore, acumular venta
      if (isFeatureActive('cashControlEnabled') && currentShift?.id) {
        await registerSaleToActiveShift(tenantId, currentShift.id, mappedMethod, total, currentShift);
      }

      // 3. Si la orden provenía de una mesa o comanda, liberar la mesa en Firestore
      if (selectedTableId && isFeatureActive('tableTabsEnabled')) {
        await clearTableInDb(tenantId, selectedTableId);
        setSelectedTableId(null);
      }

      clearCart();
    } catch (err: any) {
      console.error('Error emitiendo venta en Firestore:', err);
      notifyError('Error en Venta', err.message || 'No se pudo procesar la transacción.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-[#07090e] text-white p-3 gap-3 overflow-hidden">
      {/* ─── SECCIÓN IZQUIERDA: Catálogo táctil ─── */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        {/* Cabecera Pro: Búsqueda, Turno y Botón Nuevo Producto */}
        <div className="flex items-center justify-between gap-3 bg-[#0d121e] border border-slate-800/80 rounded-2xl p-2.5 mb-2.5 shrink-0">
          {/* Buscador táctil */}
          <div className="relative flex-1 max-w-xs md:max-w-sm">
            <span className="absolute left-3 top-2.5 text-xs text-slate-400">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar trago, cerveza, cóctel..."
              className="w-full bg-[#07090e] border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Información de Turno, DIAN y Botón + Producto */}
          <div className="flex items-center gap-2.5 text-xs">
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 bg-slate-900/90 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-400">Consecutivo DIAN:</span>
              <span className="font-mono font-bold text-amber-400">
                {settings?.dianConfig?.prefix || 'SETT'}-{(settings?.dianConfig?.currentNumber ?? 1420) + 1}
              </span>
            </div>

            {/* BADGE CONDICIONAL DE CAJA (Solo si cashControlEnabled) */}
            <FeatureGate feature="cashControlEnabled">
              <Link
                to="/caja"
                className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl flex items-center gap-1.5 font-bold transition"
                title="Ver estado de caja y arqueo"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Turno #{currentShift?.shiftNumber || '104'}</span>
              </Link>
            </FeatureGate>

            <FeatureGate
              feature="inventoryEnabled"
              fallback={
                <span className="hidden sm:inline-block text-[11px] font-semibold px-2 py-1 bg-slate-800 text-slate-300 rounded-lg">
                  ⚡ Venta Libre
                </span>
              }
            >
              <span className="hidden sm:inline-flex text-[11px] font-bold px-2.5 py-1 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-lg items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                Stock en Vivo
              </span>
            </FeatureGate>

            {/* BOTÓN RÁPIDO PARA CREAR PRODUCTO DESDE LA BARRA */}
            <button
              onClick={() => setIsProductModalOpen(true)}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-3 py-1.5 rounded-xl text-xs uppercase tracking-wider transition shadow-md shadow-amber-400/20 active:scale-95 flex items-center gap-1.5 shrink-0"
              title="Crear un nuevo producto o fijar precio"
            >
              <span className="font-bold text-sm leading-none">+</span>
              <span className="hidden sm:inline">Nuevo Producto</span>
            </button>
          </div>
        </div>

        {/* Chips de Categorías */}
        <div className="flex gap-2 mb-2.5 overflow-x-auto pb-1 shrink-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition active:scale-95 ${
                selectedCategory === cat.id
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                  : 'bg-[#0d121e] border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Grilla de Productos */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pr-1 content-start auto-rows-max">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500">
              <span className="text-3xl block mb-2 opacity-40">🔍</span>
              <p className="text-xs font-semibold">No se encontraron productos con "{searchQuery}"</p>
              <button
                onClick={() => setIsProductModalOpen(true)}
                className="mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-lg transition"
              >
                + Crear "{searchQuery}" ahora
              </button>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} onSelect={addItem} />
            ))
          )}
        </div>
      </div>

      {/* ─── SECCIÓN DERECHA: Carrito y Cobro ─── */}
      <div className="w-[330px] xl:w-[370px] h-full shrink-0">
        <QuickCart onCheckout={handleCheckout} isProcessing={isProcessing} />
      </div>

      {/* Modal / Toast de Factura DIAN emitida */}
      {lastInvoice && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1422] border border-emerald-500/50 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-2xl mb-3">
              ✓
            </div>
            <h3 className="text-lg font-black text-white">¡VENTA COBRADA!</h3>
            <p className="text-[11px] text-emerald-400 font-mono">Factura Electrónica DIAN emitida</p>

            <div className="my-3 bg-[#07090e] p-3 rounded-2xl border border-slate-800 text-left text-xs font-mono space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Factura:</span>
                <span className="font-bold text-white">{lastInvoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total:</span>
                <span className="font-bold text-emerald-400 text-sm">
                  ${lastInvoice.total.toLocaleString('es-CO')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Método:</span>
                <span className="text-slate-300 font-semibold">{lastInvoice.paymentMethod}</span>
              </div>
              <div className="pt-1.5 border-t border-slate-800">
                <span className="text-[10px] text-slate-400 block">CUFE DIAN:</span>
                <span className="text-[9px] text-slate-300 break-all select-all font-mono">
                  {lastInvoice.cufe}
                </span>
              </div>
            </div>

            <button
              onClick={() => setLastInvoice(null)}
              className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition active:scale-95 shadow-md shadow-amber-400/20"
            >
              Siguiente Venta
            </button>
          </div>
        </div>
      )}

      {/* Modal para Crear / Editar Producto */}
      <ProductModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} />
    </div>
  );
};
