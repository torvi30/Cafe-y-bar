export interface TenantFeatures {
  inventoryEnabled: boolean;       // Control de existencias, bodegas, recetas y mermas
  tableTabsEnabled: boolean;       // Comandas, cuentas abiertas por mesa o nombre de cliente
  quickPosOnly: boolean;           // Interfaz ultra-rápida a 1-tap para barra de alto flujo
  electronicInvoicing: boolean;    // Emisión obligatoria de facturación electrónica DIAN
  propinaSugeridaEnabled: boolean; // Sugerencia voluntaria de propina (10%)
  cashControlEnabled: boolean;     // Turnos de caja, base inicial, gastos menores y arqueo X/Z
}

export interface DianConfig {
  resolutionNumber: string;
  prefix: string;
  rangeFrom: number;
  rangeTo: number;
  currentNumber: number;
  technicalKey: string;            // Clave técnica DIAN para calcular CUFE
  softwareId: string;
  pin: string;
  certificatePath?: string;
  certificatePassword?: string;
  environment: '1' | '2';          // '1' = Producción, '2' = Pruebas
  taxRegime: 'RESPONSABLE_IVA' | 'NO_RESPONSABLE_IVA';
  defaultTax: 'IMPOCONSUMO_8' | 'IVA_19' | 'EXENTO';
  validUntil: string;
}

export interface TenantSettings {
  tenantId: string;
  businessName: string;
  tradeName: string;
  nit: string;
  dv: string;                      // Dígito de verificación
  address: string;
  city: string;
  phone: string;
  email: string;
  features: TenantFeatures;
  dianConfig: DianConfig;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

