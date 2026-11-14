import React, { useState, useEffect } from 'react';
import { PosProduct, usePosStore } from '../../store/posStore';
import { useTenantConfig } from '../../context/TenantConfigContext';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { useAuth } from '../../context/AuthContext';
import { FeatureGate } from '../common/FeatureGate';
import { createCompanyProduct, updateCompanyProduct } from '../../services/productService';
import { notifyWarning, notifyError, toastSuccess } from '../../lib/alerts';
import { Loader2 } from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: PosProduct | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, productToEdit }) => {
  const { addProduct, updateProduct } = usePosStore();
  const { tenantId: contextTenantId, isFeatureActive } = useTenantConfig();
  const superAdmin = useSuperAdmin();
  const { user } = useAuth();
  const isInventoryEnabled = isFeatureActive('inventoryEnabled');

  // Determinar el tenantId real con fallback para superadmin o usuario asignado
  const activeTenantId =
    contextTenantId ||
    (user?.role === 'superadmin' ? superAdmin?.activeTenantId || superAdmin?.tenants?.[0]?.tenantId : user?.companyId) ||
    '';

  const [name, setName] = useState('');
  const [category, setCategory] = useState<PosProduct['category']>('LICORES');
  const [price, setPrice] = useState<number>(0);
  const [taxType, setTaxType] = useState<PosProduct['taxType']>('IMPOCONSUMO_8');
  const [barcode, setBarcode] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Campos de Inventario
  const [stock, setStock] = useState<number>(10);
  const [minStockAlert, setMinStockAlert] = useState<number>(3);
  const [cost, setCost] = useState<number>(0);
  const [unit, setUnit] = useState<string>('BOTELLA');

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setCategory(productToEdit.category);
      setPrice(productToEdit.price);
      setTaxType(productToEdit.taxType);
      setBarcode(productToEdit.barcode || '');
      if (productToEdit.inventory) {
        setStock(productToEdit.inventory.stock);
        setMinStockAlert(productToEdit.inventory.minStockAlert);
        setCost(productToEdit.inventory.cost || 0);
        setUnit(productToEdit.inventory.unit || 'BOTELLA');
      }
    } else {
      // Valores por defecto al crear
      setName('');
      setCategory('LICORES');
      setPrice(0);
      setTaxType('IMPOCONSUMO_8');
      setBarcode('');
      setStock(10);
      setMinStockAlert(3);
      setCost(0);
      setUnit('BOTELLA');
    }
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || price <= 0) {
      notifyWarning('Datos Incompletos', 'Por favor ingresa un nombre válido y un precio mayor a $0.');
      return;
    }

    if (!activeTenantId) {
      notifyError('Empresa No Encontrada', 'No hay un bar/empresa seleccionado o asignado para guardar el producto.');
      return;
    }

    setIsSaving(true);

    const productData: PosProduct = {
      id: productToEdit ? productToEdit.id : `prod_${Date.now()}`,
      name: name.trim(),
      category,
      price: Number(price),
      taxType,
      barcode: barcode.trim() || undefined,
      isActive: true,
      inventory: isInventoryEnabled
        ? {
            stock: Number(stock),
            minStockAlert: Number(minStockAlert),
            cost: Number(cost),
            unit,
          }
        : undefined,
    };

    try {
      if (productToEdit) {
        await updateCompanyProduct(activeTenantId, productToEdit.id, productData);
        updateProduct(productToEdit.id, productData);
        toastSuccess(`Producto "${name.trim()}" actualizado en la nube`);
      } else {
        await createCompanyProduct(activeTenantId, productData);
        addProduct(productData);
        toastSuccess(`Producto "${name.trim()}" guardado en la nube`);
      }
      onClose();
    } catch (err: any) {
      console.error('Error guardando producto en Firestore:', err);
      notifyError(
        'Error al Guardar',
        `No se pudo guardar en Firestore: ${err?.message || 'Verifica tus permisos de administrador o la conexión'}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0e1422] border border-slate-700/80 rounded-3xl p-6 max-w-lg w-full shadow-2xl text-left animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{productToEdit ? '✏️' : '✨'}</span>
            <div>
              <h2 className="text-lg font-black text-white">
                {productToEdit ? 'Editar Producto & Precio' : 'Nuevo Producto / Carta'}
              </h2>
              <p className="text-[11px] text-slate-400">
                Se sincroniza inmediatamente con el POS y la facturación DIAN
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold text-sm transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Nombre del Producto / Trago *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Tequila Don Julio Reposado 750ml"
              className="w-full bg-[#07090e] border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Categoría y Tipo de Impuesto */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-[#07090e] border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
              >
                <option value="LICORES">🍾 Licores & Botellas</option>
                <option value="CERVEZAS">🍺 Cervezas</option>
                <option value="COCTELES">🍸 Cócteles</option>
                <option value="BEBIDAS_SIN_ALCOHOL">🥤 Sin Alcohol & Mezcladores</option>
                <option value="SNACKS">🍟 Snacks & Comida</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Impuesto Fiscal DIAN</label>
              <select
                value={taxType}
                onChange={(e) => setTaxType(e.target.value as any)}
                className="w-full bg-[#07090e] border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none font-mono"
              >
                <option value="IMPOCONSUMO_8">Impoconsumo (8%) - Bares</option>
                <option value="IVA_19">IVA General (19%)</option>
                <option value="EXENTO">Exento (0%)</option>
              </select>
            </div>
          </div>

          {/* Precio de Venta al Público (En Pesos Colombianos) */}
          <div className="bg-[#07090e] p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-black text-amber-400 uppercase tracking-wider">
                Precio de Venta al Público (COP) *
              </label>
              <span className="text-[10px] text-slate-400">Total con impuesto incluido</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-lg font-mono font-bold text-amber-400">$</span>
              <input
                type="number"
                required
                min="500"
                step="500"
                value={price || ''}
                onChange={(e) => setPrice(Number(e.target.value))}
                placeholder="120000"
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl pl-8 pr-4 py-2 text-xl font-mono font-black text-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* ─── CAMPOS CONDICIONALES DE INVENTARIO ─── */}
          <FeatureGate
            feature="inventoryEnabled"
            fallback={
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <span>⚡</span>
                <span>
                  <strong>Modo Facturación Libre:</strong> Este producto no requiere control de existencias ni recetas.
                </span>
              </div>
            }
          >
            <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <span>📦</span> Parámetros de Stock & Bodega
                </span>
                <span className="text-[10px] text-amber-400 font-mono">inventoryEnabled: true</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-300 block mb-1">Stock Disponible Actual</label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full bg-[#07090e] border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Alerta Stock Bajo (Mín.)</label>
                  <input
                    type="number"
                    min="1"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(Number(e.target.value))}
                    className="w-full bg-[#07090e] border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-300 block mb-1">Costo Compra Proveedor (COP)</label>
                  <input
                    type="number"
                    min="0"
                    value={cost}
                    onChange={(e) => setCost(Number(e.target.value))}
                    placeholder="65000"
                    className="w-full bg-[#07090e] border border-slate-700 rounded-lg p-2 text-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Unidad de Medida</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-[#07090e] border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="BOTELLA">Botella</option>
                    <option value="TRAGO">Trago / Shot</option>
                    <option value="LATA">Lata</option>
                    <option value="UNIDAD">Unidad</option>
                  </select>
                </div>
              </div>
            </div>
          </FeatureGate>

          {/* Botones de Acción */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs uppercase transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-amber-400/20 active:scale-95 flex items-center justify-center gap-2"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {productToEdit ? (isSaving ? 'Guardando...' : 'Guardar Cambios') : (isSaving ? 'Creando...' : 'Crear Producto')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

