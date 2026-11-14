import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useSuperAdmin } from './SuperAdminContext';
import { useAuth } from './AuthContext';
import { fetchCompanyById } from '../services/companyService';

export interface TenantFeatures {
  inventoryEnabled: boolean;
  tableTabsEnabled: boolean;
  quickPosOnly: boolean;
  electronicInvoicing: boolean;
  propinaSugeridaEnabled: boolean;
  cashControlEnabled: boolean;
}

export interface DianConfig {
  resolutionNumber: string;
  prefix: string;
  currentNumber: number;
  environment: '1' | '2';
  taxRegime: string;
}

export interface TenantSettings {
  tenantId: string;
  businessName: string;
  nit: string;
  features: TenantFeatures;
  dianConfig: DianConfig;
}

interface TenantConfigContextType {
  tenantId: string;
  settings: TenantSettings;
  features: TenantFeatures;
  isLoading: boolean;
  isFeatureActive: (featureKey: keyof TenantFeatures) => boolean;
  updateFeatureFlag: (featureKey: keyof TenantFeatures, value: boolean) => Promise<void>;
}

export const fallbackFeatures: TenantFeatures = {
  inventoryEnabled: false,
  tableTabsEnabled: false,
  quickPosOnly: true,
  electronicInvoicing: true,
  propinaSugeridaEnabled: true,
  cashControlEnabled: false,
};

export const defaultDianConfig: DianConfig = {
  resolutionNumber: '18764000001',
  prefix: 'SETT',
  currentNumber: 1420,
  environment: '2',
  taxRegime: 'NO_RESPONSABLE_IVA',
};

export const emptySettings: TenantSettings = {
  tenantId: '',
  businessName: 'Establecimiento Principal',
  nit: '901.458.963-2',
  features: fallbackFeatures,
  dianConfig: defaultDianConfig,
};

export const sanitizeSettings = (raw: any, id: string = ''): TenantSettings => {
  return {
    tenantId: id || raw?.tenantId || '',
    businessName: raw?.businessName || raw?.tradeName || raw?.name || 'Establecimiento Principal',
    nit: raw?.nit || '901.458.963-2',
    features: {
      ...fallbackFeatures,
      ...(raw?.features || {}),
    },
    dianConfig: {
      resolutionNumber: raw?.dianConfig?.resolutionNumber || defaultDianConfig.resolutionNumber,
      prefix: raw?.dianConfig?.prefix || defaultDianConfig.prefix,
      currentNumber:
        typeof raw?.dianConfig?.currentNumber === 'number'
          ? raw.dianConfig.currentNumber
          : defaultDianConfig.currentNumber,
      environment: raw?.dianConfig?.environment || defaultDianConfig.environment,
      taxRegime: raw?.dianConfig?.taxRegime || defaultDianConfig.taxRegime,
    },
  };
};

const TenantConfigContext = createContext<TenantConfigContextType>({
  tenantId: '',
  settings: emptySettings,
  features: fallbackFeatures,
  isLoading: false,
  isFeatureActive: () => false,
  updateFeatureFlag: async () => {},
});

export const TenantConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const superAdmin = useSuperAdmin();

  // Si es superadmin usa el tenant activo seleccionado; si es usuario normal usa su companyId
  const effectiveTenantId =
    user?.role === 'superadmin'
      ? superAdmin.activeTenantId || superAdmin.tenants?.[0]?.tenantId || ''
      : user?.companyId || '';

  const [settings, setSettings] = useState<TenantSettings>(emptySettings);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!effectiveTenantId) {
      setSettings(emptySettings);
      return;
    }

    // 1. Si ya está cargado en la lista de tenants del superadmin, sanitizar y usar de inmediato
    const found = superAdmin.tenants.find((t) => t.tenantId === effectiveTenantId);
    if (found) {
      setSettings(sanitizeSettings(found, found.tenantId));
    } else {
      // 2. Si no, buscarlo en Firestore directamente
      fetchCompanyById(effectiveTenantId).then((comp) => {
        if (comp) {
          setSettings(sanitizeSettings(comp, comp.tenantId));
        }
      });
    }

    // 3. Suscripción reactiva en tiempo real a companies/{effectiveTenantId}
    const docRef = doc(db, 'companies', effectiveTenantId);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setSettings(sanitizeSettings(snapshot.data(), snapshot.id));
        }
        setIsLoading(false);
      },
      () => {
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [effectiveTenantId, superAdmin.tenants]);

  const isFeatureActive = (featureKey: keyof TenantFeatures): boolean => {
    return !!settings.features?.[featureKey];
  };

  const updateFeatureFlag = async (featureKey: keyof TenantFeatures, value: boolean) => {
    if (!effectiveTenantId) return;

    const updatedFeatures = {
      ...settings.features,
      [featureKey]: value,
    };
    setSettings((prev) => ({
      ...prev,
      features: updatedFeatures,
    }));

    await superAdmin.toggleTenantFeature(effectiveTenantId, featureKey);
  };

  return (
    <TenantConfigContext.Provider
      value={{
        tenantId: effectiveTenantId,
        settings,
        features: settings.features,
        isLoading,
        isFeatureActive,
        updateFeatureFlag,
      }}
    >
      {children}
    </TenantConfigContext.Provider>
  );
};

export const useTenantConfig = () => useContext(TenantConfigContext);
