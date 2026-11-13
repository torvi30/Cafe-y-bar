import React, { useState, useMemo, useEffect } from 'react';
import { usePosStore, PosProduct } from '../store/posStore';
import { useTenantConfig } from '../context/TenantConfigContext';
import { ProductModal } from '../components/pos/ProductModal';
import { FeatureGate } from '../components/common/FeatureGate';
import { listenCompanyProducts, deleteCompanyProduct } from '../services/productService';
import { confirmAction, toastSuccess } from '../lib/alerts';

export const ProductsView: React.FC = () => {
  const { products, setProducts, deleteProduct } = usePosStore();
  const { tenantId, isFeatureActive } = useTenantConfig();
  const isInventoryEnabled = isFeatureActive('inventoryEnabled');

  useEffect(() => {
    if (!tenantId) return;
    const unsub = listenCompanyProducts(tenantId, (prods) => {
      setProducts(prods);
    });
    return () => unsub();
  }, [tenantId]);

  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<PosProduct | null>(null);

  const categories = [
    { id: 'TODOS', label: 'Todo el Catálogo' },
    { id: 'LICORES', label: '🍾 Licores' },
    { id: 'CERVEZAS', label: '🍺 Cervezas' },
    { id: 'COCTELES', label: '🍸 Cócteles' },
    { id: 'BEBIDAS_SIN_ALCOHOL', label: '🥤 Sin Alcohol' },
    { id: 'SNACKS', label: '🍟 Snacks' },
  ];

  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchCat = selectedCategory === 'TODOS' || prod.category === selectedCategory;
      const matchSearch =
        searchQuery.trim() === '' ||
        prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleEdit = (product: PosProduct) => {
    setProductToEdit(product);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setProductToEdit(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirmAction({
      title: '¿Eliminar Producto?',
      text: `¿Estás seguro de eliminar "${name}" del catálogo?`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      isDangerous: true,
    });
    if (confirmed) {
      deleteProduct(id);
      if (tenantId) deleteCompanyProduct(tenantId, id);
      toastSuccess(`Producto "${name}" eliminado`);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#07090e] p-6 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <span>🏷️</span> Catálogo de Productos & Precios
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Administra la carta del bar, fija precios de venta, tarifas fiscales DIAN y parámetros de inventario.
          </p>
        </div>

        <button
          onClick={handleCreate}
          className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-amber-400/20 active:scale-95 flex items-center gap-2"
        >
          <span className="text-base font-bold">+</span>
          <span>Nuevo Producto</span>
        </button>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0">
        {/* Chips de Categorías */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-[#0d121e] border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className="relative w-72">
          <span className="absolute left-3 top-2.5 text-xs text-slate-400">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre..."
            className="w-full bg-[#0d121e] border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Tabla de Productos y Precios */}
      <div className="flex-1 overflow-y-auto bg-[#0d121e] border border-slate-800 rounded-2xl shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#090d16] sticky top-0 z-10 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="p-3.5">Producto / Trago</th>
              <th className="p-3.5">Categoría</th>
              <th className="p-3.5 text-right">Precio Venta (COP)</th>
              <th className="p-3.5 text-center">Impuesto DIAN</th>
              {isInventoryEnabled && <th className="p-3.5 text-center">Stock Actual</th>}
              <th className="p-3.5 text-center">Estado</th>
              <th className="p-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-slate-500">
                  No se encontraron productos en esta categoría
                </td>
              </tr>
            ) : (
              filteredProducts.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-800/30 transition">
                  <td className="p-3.5 font-bold text-white text-sm">
                    {prod.name}
                  </td>
                  <td className="p-3.5 text-slate-400 text-xs">
                    {prod.category}
                  </td>
                  <td className="p-3.5 text-right font-mono font-black text-amber-400 text-base">
                    ${prod.price.toLocaleString('es-CO')}
                  </td>
                  <td className="p-3.5 text-center">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {prod.taxType === 'IMPOCONSUMO_8' ? 'ICO 8%' : prod.taxType === 'IVA_19' ? 'IVA 19%' : 'EXENTO'}
                    </span>
                  </td>
                  {isInventoryEnabled && (
                    <td className="p-3.5 text-center font-mono font-bold text-slate-200">
                      {prod.inventory?.stock ?? 0} {prod.inventory?.unit || 'UNID'}
                    </td>
                  )}
                  <td className="p-3.5 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      ● Activo en Barra
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-1.5">
                    <button
                      onClick={() => handleEdit(prod)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-lg text-xs transition"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(prod.id, prod.name)}
                      className="px-2 py-1 bg-red-950/40 hover:bg-red-900/60 text-red-400 font-bold rounded-lg text-xs transition border border-red-800/40"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Creación / Edición */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productToEdit={productToEdit}
      />
    </div>
  );
};

