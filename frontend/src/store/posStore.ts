import { create } from 'zustand';

export interface PosProduct {
  id: string;
  name: string;
  category: 'LICORES' | 'CERVEZAS' | 'COCTELES' | 'BEBIDAS_SIN_ALCOHOL' | 'SNACKS';
  price: number;
  taxType: 'IMPOCONSUMO_8' | 'IVA_19' | 'EXENTO';
  color?: string;
  barcode?: string;
  isActive?: boolean;
  inventory?: {
    stock: number;
    minStockAlert: number;
    unit: string;
    cost?: number;
  };
}

export interface CartItem extends PosProduct {
  quantity: number;
}

interface PosState {
  products: PosProduct[];
  cart: CartItem[];
  customerNit: string;
  customerName: string;
  customerEmail: string;
  selectedTableId: string | null;
  includeTip: boolean;
  tipMode: '0%' | '10%' | '5%' | 'custom' | 'none';
  customTipAmount: number;

  // Acciones de Productos & Precios
  setProducts: (products: PosProduct[]) => void;
  addProduct: (product: PosProduct) => void;
  updateProduct: (id: string, updated: Partial<PosProduct>) => void;
  deleteProduct: (id: string) => void;

  // Acciones del Carrito
  addItem: (product: PosProduct) => void;
  decreaseItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  setCustomerNit: (nit: string) => void;
  setCustomerName: (name: string) => void;
  setCustomerEmail: (email: string) => void;
  setSelectedTableId: (tableId: string | null) => void;
  toggleTip: () => void;
  setTipMode: (mode: '0%' | '10%' | '5%' | 'custom' | 'none') => void;
  setCustomTipAmount: (amount: number) => void;

  getTotals: () => {
    subtotal: number;
    taxAmount: number;
    tipAmount: number;
    total: number;
    itemsCount: number;
  };
}

export const usePosStore = create<PosState>((set, get) => {
  // CERO PRODUCTOS QUEMADOS: Comienza vacío de forma predeterminada
  return {
    products: [],
    cart: [],
    customerNit: '222222222222', // Consumidor Final DIAN
    customerName: 'Consumidor Final',
    customerEmail: '',
    selectedTableId: null,
    includeTip: false, // Por defecto inicia en 0% / Desmarcada
    tipMode: '0%',
    customTipAmount: 0,

    setProducts: (products) => set({ products }),

    addProduct: (product) => {
      const newProducts = [product, ...get().products];
      set({ products: newProducts });
    },

    updateProduct: (id, updated) => {
      const newProducts = get().products.map((p) => (p.id === id ? { ...p, ...updated } : p));
      set({ products: newProducts });
    },

    deleteProduct: (id) => {
      const newProducts = get().products.filter((p) => p.id !== id);
      set({ products: newProducts });
    },

    addItem: (product) => {
      const { cart } = get();
      const existing = cart.find((item) => item.id === product.id);

      if (existing) {
        set({
          cart: cart.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          ),
        });
      } else {
        set({
          cart: [...cart, { ...product, quantity: 1 }],
        });
      }
    },

    decreaseItem: (productId) => {
      const { cart } = get();
      const existing = cart.find((item) => item.id === productId);
      if (!existing) return;

      if (existing.quantity > 1) {
        set({
          cart: cart.map((item) =>
            item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
          ),
        });
      } else {
        set({
          cart: cart.filter((item) => item.id !== productId),
        });
      }
    },

    removeItem: (productId) => {
      set({
        cart: get().cart.filter((item) => item.id !== productId),
      });
    },

    clearCart: () => {
      set({
        cart: [],
        selectedTableId: null,
        customerNit: '222222222222',
        customerName: 'Consumidor Final',
      });
    },

    setCustomerNit: (customerNit) => set({ customerNit }),
    setCustomerName: (customerName) => set({ customerName }),
    setCustomerEmail: (customerEmail) => set({ customerEmail }),
    setSelectedTableId: (selectedTableId) => set({ selectedTableId }),
    toggleTip: () =>
      set((state) => ({
        includeTip: !state.includeTip,
        tipMode: !state.includeTip ? '10%' : '0%',
      })),
    setTipMode: (tipMode) =>
      set(() => ({
        tipMode,
        includeTip: tipMode !== 'none' && tipMode !== '0%',
      })),
    setCustomTipAmount: (customTipAmount) =>
      set({
        customTipAmount: Math.max(0, customTipAmount),
        tipMode: 'custom',
        includeTip: customTipAmount > 0,
      }),

    getTotals: () => {
      const { cart, includeTip, tipMode, customTipAmount } = get();
      let subtotal = 0;
      let taxAmount = 0;
      let itemsCount = 0;
      let grossProductTotal = 0;

      cart.forEach((item) => {
        const lineTotal = item.price * item.quantity;
        itemsCount += item.quantity;
        grossProductTotal += lineTotal;

        // El precio del producto ya incluye el impuesto (IVA o Impoconsumo 8%)
        if (item.taxType === 'IMPOCONSUMO_8') {
          const lineBase = lineTotal / 1.08;
          subtotal += lineBase;
          taxAmount += lineTotal - lineBase;
        } else if (item.taxType === 'IVA_19') {
          const lineBase = lineTotal / 1.19;
          subtotal += lineBase;
          taxAmount += lineTotal - lineBase;
        } else {
          subtotal += lineTotal;
        }
      });

      const roundedSubtotal = Math.round(subtotal);
      const roundedTax = Math.round(taxAmount);

      // Cálculo de la propina voluntaria (0%, 10%, 5%, valor manual o ninguna)
      let tipAmount = 0;
      if (includeTip) {
        if (tipMode === '10%') {
          tipAmount = Math.round(grossProductTotal * 0.1);
        } else if (tipMode === '5%') {
          tipAmount = Math.round(grossProductTotal * 0.05);
        } else if (tipMode === 'custom') {
          tipAmount = Math.round(customTipAmount || 0);
        } else if (tipMode === '0%') {
          tipAmount = 0;
        }
      }

      // Total a cobrar = Consumo de productos (con impuestos ya incluidos) + propina voluntaria editable
      const total = grossProductTotal + tipAmount;

      return {
        subtotal: roundedSubtotal,
        taxAmount: roundedTax,
        tipAmount,
        total,
        itemsCount,
      };
    },
  };
});
