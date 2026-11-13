export type TaxType = 'IMPOCONSUMO_8' | 'IVA_19' | 'EXENTO';

export interface ProductInventory {
  isStockTracked: boolean;
  stock: number;
  minStockAlert: number;
  cost: number;
  unit: 'BOTELLA' | 'TRAGO' | 'LATA' | 'UNIDAD';
}

export interface Product {
  id: string;
  name: string;
  category: 'LICORES' | 'CERVEZAS' | 'COCTELES' | 'BEBIDAS_SIN_ALCOHOL' | 'SNACKS';
  price: number;
  taxType: TaxType;
  barcode?: string;
  isActive: boolean;
  color?: string; // Para identificar rápidamente en la botonera del POS
  inventory?: ProductInventory;
}

