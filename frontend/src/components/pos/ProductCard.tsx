import React from 'react';
import { PosProduct, usePosStore } from '../../store/posStore';
import { FeatureGate } from '../common/FeatureGate';

interface ProductCardProps {
  product: PosProduct;
  onSelect: (product: PosProduct) => void;
}

// Colores de acento por categoría para identificar rápido en barra oscura
const CATEGORY_THEMES: Record<string, { border: string; bgBadge: string; textBadge: string; icon: string }> = {
  LICORES: {
    border: 'hover:border-amber-400 group-hover:border-amber-400/80',
    bgBadge: 'bg-amber-500/10 border-amber-500/30',
    textBadge: 'text-amber-400',
    icon: '🍾',
  },
  CERVEZAS: {
    border: 'hover:border-yellow-400 group-hover:border-yellow-400/80',
    bgBadge: 'bg-yellow-500/10 border-yellow-500/30',
    textBadge: 'text-yellow-400',
    icon: '🍺',
  },
  COCTELES: {
    border: 'hover:border-purple-400 group-hover:border-purple-400/80',
    bgBadge: 'bg-purple-500/10 border-purple-500/30',
    textBadge: 'text-purple-400',
    icon: '🍸',
  },
  BEBIDAS_SIN_ALCOHOL: {
    border: 'hover:border-cyan-400 group-hover:border-cyan-400/80',
    bgBadge: 'bg-cyan-500/10 border-cyan-500/30',
    textBadge: 'text-cyan-400',
    icon: '🥤',
  },
};

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { cart } = usePosStore();
  const cartItem = cart.find((item) => item.id === product.id);
  const quantityInCart = cartItem?.quantity || 0;

  const stock = product.inventory?.stock ?? 0;
  const minStock = product.inventory?.minStockAlert ?? 5;
  const isLowStock = stock <= minStock;
  const isOutOfStock = stock <= 0;

  const theme = CATEGORY_THEMES[product.category] || {
    border: 'hover:border-slate-500',
    bgBadge: 'bg-slate-800 border-slate-700',
    textBadge: 'text-slate-300',
    icon: '🍹',
  };

  return (
    <button
      onClick={() => onSelect(product)}
      className={`group relative flex flex-col justify-between p-3.5 bg-[#0e131f] hover:bg-[#141b2d] border ${
        quantityInCart > 0
          ? 'border-amber-400 shadow-lg shadow-amber-400/10 ring-1 ring-amber-400/50'
          : 'border-slate-800/80'
      } ${theme.border} rounded-2xl transition-all duration-150 active:scale-[0.96] text-left h-[125px] select-none`}
    >
      {/* Badge de cantidad activa en el carrito (Feedback inmediato para el bartender) */}
      {quantityInCart > 0 && (
        <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-md animate-in zoom-in-75 duration-100">
          {quantityInCart}
        </span>
      )}

      {/* Título y Categoría */}
      <div className="w-full">
        <div className="flex items-start justify-between gap-1.5">
          <span className="font-bold text-white text-xs leading-snug line-clamp-2 group-hover:text-amber-300">
            {product.name}
          </span>

          <span className="text-sm shrink-0 opacity-80" title={product.category}>
            {theme.icon}
          </span>
        </div>
      </div>

      {/* Fila Inferior: Precio, Impuesto y Stock Condicional */}
      <div className="w-full pt-1.5 border-t border-slate-800/60 flex items-end justify-between">
        <div>
          <span className="font-mono text-base font-black text-amber-400 tracking-tight block">
            ${product.price.toLocaleString('es-CO')}
          </span>
          <span className="text-[9px] text-slate-400 font-medium">
            {product.taxType === 'IMPOCONSUMO_8' ? 'ICO 8%' : 'IVA 19%'}
          </span>
        </div>

        {/* Módulo Condicional: Stock visible solo si está activo */}
        <FeatureGate feature="inventoryEnabled">
          <span
            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
              isOutOfStock
                ? 'bg-red-500/20 text-red-400 border-red-500/40'
                : isLowStock
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}
          >
            {isOutOfStock ? 'Agotado' : `${stock} disp.`}
          </span>
        </FeatureGate>
      </div>
    </button>
  );
};
