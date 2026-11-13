import React, { createContext, useContext, useState, useEffect } from 'react';
import { TenantRecord, TenantStatus } from '../types/saas.types';
import { TenantFeatures } from './TenantConfigContext';
import {
  listenCompanies,
  createCompany,
  updateCompany,
  deleteCompany as deleteCompanyFromDb,
} from '../services/companyService';
import {
  fetchAllPlatformUsers,
  updateUserTenantAndRole,
  deletePlatformUser,
} from '../services/userService';
import { useAuth } from './AuthContext';
import type { UserProfile, Role } from '../types/auth';

interface SuperAdminContextType {
  tenants: TenantRecord[];
  activeTenantId: string | null;
  activeTenant: TenantRecord | null;
  platformUsers: UserProfile[];
  isLoadingTenants: boolean;
  setActiveTenantId: (tenantId: string | null) => void;
  createTenant: (data: Omit<TenantRecord, 'tenantId' | 'createdAt' | 'stats'>) => Promise<TenantRecord>;
  updateTenant: (tenantId: string, data: Partial<TenantRecord>) => Promise<void>;
  updateTenantStatus: (tenantId: string, status: TenantStatus) => Promise<void>;
  toggleTenantFeature: (tenantId: string, feature: keyof TenantFeatures) => Promise<void>;
  deleteTenant: (tenantId: string) => Promise<void>;
  loadPlatformUsers: () => Promise<void>;
  assignUserToTenant: (uid: string, companyId: string | null, role: Role) => Promise<void>;
  deleteUser: (uid: string) => Promise<void>;
  getMetrics: () => {
    totalTenants: number;
    activeTenants: number;
    suspendedTenants: number;
    mrr: number;
    totalInvoices: number;
  };
}

const SuperAdminContext = createContext<SuperAdminContextType | null>(null);

export const SuperAdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const isSuperadmin = user?.role === 'superadmin';

  // CERO DATOS QUEMADOS: Se inicia vacío y se sincroniza en vivo con Firestore
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [activeTenantId, setActiveTenantIdState] = useState<string | null>(() => {
    return localStorage.getItem('saas_active_tenant_id') || null;
  });
  const [platformUsers, setPlatformUsers] = useState<UserProfile[]>([]);
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);

  // Escucha en tiempo real de empresas en Firestore /companies solo si es superadmin
  useEffect(() => {
    if (!isSuperadmin) {
      setTenants([]);
      setPlatformUsers([]);
      setIsLoadingTenants(false);
      return;
    }

    loadPlatformUsers();
    setIsLoadingTenants(true);
    const unsubscribe = listenCompanies(
      (companiesList) => {
        setTenants(companiesList);
        setIsLoadingTenants(false);

        // Si no hay tenant activo seleccionado y hay empresas, o el actual ya no existe
        if (companiesList.length > 0) {
          const currentSaved = localStorage.getItem('saas_active_tenant_id');
          const exists = companiesList.some((c) => c.tenantId === currentSaved);
          if (!exists) {
            setActiveTenantIdState(companiesList[0].tenantId);
            localStorage.setItem('saas_active_tenant_id', companiesList[0].tenantId);
          }
        } else {
          setActiveTenantIdState(null);
          localStorage.removeItem('saas_active_tenant_id');
        }
      },
      () => {
        setIsLoadingTenants(false);
      }
    );

    return () => unsubscribe();
  }, [isSuperadmin]);

  const setActiveTenantId = (tenantId: string | null) => {
    setActiveTenantIdState(tenantId);
    if (tenantId) {
      localStorage.setItem('saas_active_tenant_id', tenantId);
    } else {
      localStorage.removeItem('saas_active_tenant_id');
    }
  };

  const activeTenant = tenants.find((t) => t.tenantId === activeTenantId) || (tenants.length > 0 ? tenants[0] : null);

  const createTenant = async (
    data: Omit<TenantRecord, 'tenantId' | 'createdAt' | 'stats'>
  ): Promise<TenantRecord> => {
    const created = await createCompany(data);
    setActiveTenantId(created.tenantId);
    return created;
  };

  const updateTenant = async (tenantId: string, data: Partial<TenantRecord>) => {
    await updateCompany(tenantId, data);
  };

  const updateTenantStatus = async (tenantId: string, status: TenantStatus) => {
    await updateCompany(tenantId, { status });
  };

  const toggleTenantFeature = async (tenantId: string, feature: keyof TenantFeatures) => {
    const target = tenants.find((t) => t.tenantId === tenantId);
    if (!target) return;

    const updatedFeatures = {
      ...target.features,
      [feature]: !target.features[feature],
    };

    await updateCompany(tenantId, { features: updatedFeatures });
  };

  const deleteTenant = async (tenantId: string) => {
    await deleteCompanyFromDb(tenantId);
  };

  const loadPlatformUsers = async () => {
    try {
      const users = await fetchAllPlatformUsers();
      setPlatformUsers(users);
    } catch (err) {
      console.error('Error cargando usuarios de la plataforma:', err);
    }
  };

  const assignUserToTenant = async (uid: string, companyId: string | null, role: Role) => {
    await updateUserTenantAndRole(uid, companyId, role);
    await loadPlatformUsers();
  };

  const deleteUser = async (uid: string) => {
    await deletePlatformUser(uid);
    await loadPlatformUsers();
  };

  const getMetrics = () => {
    const totalTenants = tenants.length;
    const activeTenants = tenants.filter((t) => t.status === 'ACTIVE').length;
    const suspendedTenants = tenants.filter((t) => t.status === 'SUSPENDED').length;
    const mrr = tenants
      .filter((t) => t.status === 'ACTIVE')
      .reduce((acc, t) => acc + (t.monthlyFee || 0), 0);
    const totalInvoices = tenants.reduce((acc, t) => acc + (t.stats?.invoicesCount || 0), 0);

    return {
      totalTenants,
      activeTenants,
      suspendedTenants,
      mrr,
      totalInvoices,
    };
  };

  return (
    <SuperAdminContext.Provider
      value={{
        tenants,
        activeTenantId,
        activeTenant,
        platformUsers,
        isLoadingTenants,
        setActiveTenantId,
        createTenant,
        updateTenant,
        updateTenantStatus,
        toggleTenantFeature,
        deleteTenant,
        loadPlatformUsers,
        assignUserToTenant,
        deleteUser,
        getMetrics,
      }}
    >
      {children}
    </SuperAdminContext.Provider>
  );
};

export const useSuperAdmin = () => {
  const context = useContext(SuperAdminContext);
  if (!context) {
    throw new Error('useSuperAdmin debe usarse dentro de un SuperAdminProvider');
  }
  return context;
};
