import { TenantFeatures, DianConfig } from '../context/TenantConfigContext';

export type SubscriptionPlan = 'LEGAL_DIAN' | 'CLUB_PRO' | 'GASTROBAR_FULL';
export type TenantStatus = 'ACTIVE' | 'TRIAL' | 'SUSPENDED';

export interface TenantRecord {
  tenantId: string;
  businessName: string;
  tradeName: string;
  nit: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  plan: SubscriptionPlan;
  status: TenantStatus;
  monthlyFee: number; // En pesos colombianos (COP)
  features: TenantFeatures;
  dianConfig: DianConfig;
  createdAt: string;
  stats: {
    monthlySales: number;
    invoicesCount: number;
  };
}

export const PLAN_PRESETS: Record<
  SubscriptionPlan,
  { name: string; description: string; price: number; features: TenantFeatures }
> = {
  LEGAL_DIAN: {
    name: 'Plan Facturación Legal',
    description: 'Para bares pequeños que solo necesitan facturar ante la DIAN ultra-rápido en barra sin inventario ni caja.',
    price: 120000,
    features: {
      inventoryEnabled: false,
      tableTabsEnabled: false,
      quickPosOnly: true,
      electronicInvoicing: true,
      propinaSugeridaEnabled: true,
      cashControlEnabled: false, // Inactivo: venta directa sin apertura ni cierre de caja
    },
  },
  CLUB_PRO: {
    name: 'Plan Discoteca & Club Pro',
    description: 'Para discotecas con barra rápida, arqueo de caja con base inicial y control de bodega de botellas.',
    price: 190000,
    features: {
      inventoryEnabled: true,
      tableTabsEnabled: false,
      quickPosOnly: true,
      electronicInvoicing: true,
      propinaSugeridaEnabled: true,
      cashControlEnabled: true, // Activo: requiere apertura con base, gastos menores y arqueo Z
    },
  },
  GASTROBAR_FULL: {
    name: 'Plan Gastrobar & Lounge Full',
    description: 'Gestión total: turnos de caja, cuentas abiertas por mesa, comandas, control de botellas y DIAN.',
    price: 260000,
    features: {
      inventoryEnabled: true,
      tableTabsEnabled: true,
      quickPosOnly: false,
      electronicInvoicing: true,
      propinaSugeridaEnabled: true,
      cashControlEnabled: true, // Activo
    },
  },
};

