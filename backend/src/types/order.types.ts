import { TaxType } from './product.types.js';

export type PaymentMethod = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'MIXTO';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  taxType: TaxType;
  subtotal: number;
  taxAmount: number;
  total: number;
}

export interface Order {
  id?: string;
  tenantId: string;
  consecutiveNumber: number;
  invoiceNumber: string; // Ej: SETT-1421
  cufe?: string;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  tipAmount: number;     // Propina voluntaria
  total: number;
  paymentMethod: PaymentMethod;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  tableId?: string;      // Solo si tableTabsEnabled == true
  customerNit: string;   // Ej: 222222222222 (Consumidor Final)
  customerName: string;
  customerEmail?: string;
  dianStatus: 'NOT_SENT' | 'QUEUED' | 'ACCEPTED' | 'REJECTED';
  dianValidationMessage?: string;
  createdAt: Date | FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue;
}

