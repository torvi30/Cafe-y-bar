import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { TenantRecord } from '../types/saas.types';
import { fallbackFeatures, defaultDianConfig } from '../context/TenantConfigContext';

const COMPANIES_COLLECTION = 'companies';

export const sanitizeCompanyRecord = (id: string, raw: any): TenantRecord => {
  return {
    tenantId: id,
    businessName: raw?.businessName || raw?.tradeName || raw?.name || 'Establecimiento',
    tradeName: raw?.tradeName || raw?.businessName || raw?.name || 'Establecimiento',
    nit: raw?.nit || '000.000.000-0',
    city: raw?.city || 'Colombia',
    address: raw?.address || '',
    phone: raw?.phone || '',
    email: raw?.email || '',
    plan: raw?.plan || 'CLUB_PRO',
    status: raw?.status || 'ACTIVE',
    monthlyFee: typeof raw?.monthlyFee === 'number' ? raw.monthlyFee : 0,
    features: {
      ...fallbackFeatures,
      ...(raw?.features || {}),
    },
    dianConfig: {
      ...defaultDianConfig,
      ...(raw?.dianConfig || {}),
    },
    createdAt: raw?.createdAt
      ? typeof raw.createdAt.toDate === 'function'
        ? raw.createdAt.toDate().toISOString()
        : String(raw.createdAt)
      : new Date().toISOString(),
    stats: raw?.stats || { invoicesCount: 0, monthlySales: 0 },
  };
};

export async function fetchCompanies(): Promise<TenantRecord[]> {
  const colRef = collection(db, COMPANIES_COLLECTION);
  const snap = await getDocs(colRef);
  return snap.docs.map((docSnap) => sanitizeCompanyRecord(docSnap.id, docSnap.data()));
}

export function listenCompanies(
  onUpdate: (companies: TenantRecord[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const colRef = collection(db, COMPANIES_COLLECTION);
  return onSnapshot(
    colRef,
    (snap) => {
      const list = snap.docs.map((docSnap) => sanitizeCompanyRecord(docSnap.id, docSnap.data()));
      onUpdate(list);
    },
    (error) => {
      console.warn('Error listening to companies in Firestore:', error);
      if (onError) onError(error);
    }
  );
}

export async function fetchCompanyById(companyId: string): Promise<TenantRecord | null> {
  if (!companyId) return null;
  const docRef = doc(db, COMPANIES_COLLECTION, companyId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return sanitizeCompanyRecord(snap.id, snap.data());
}

export async function createCompany(
  data: Omit<TenantRecord, 'tenantId' | 'createdAt' | 'stats'>
): Promise<TenantRecord> {
  const customId = data.tradeName
    ? data.tradeName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
    : `tenant_${Date.now()}`;

  const docRef = doc(db, COMPANIES_COLLECTION, customId);
  const payload = {
    ...data,
    createdAt: serverTimestamp(),
    stats: {
      invoicesCount: 0,
      monthlySales: 0,
    },
  };

  await setDoc(docRef, payload);

  return {
    tenantId: customId,
    ...data,
    createdAt: new Date().toISOString(),
    stats: {
      invoicesCount: 0,
      monthlySales: 0,
    },
  };
}

export async function updateCompany(tenantId: string, data: Partial<TenantRecord>): Promise<void> {
  const docRef = doc(db, COMPANIES_COLLECTION, tenantId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCompany(tenantId: string): Promise<void> {
  const docRef = doc(db, COMPANIES_COLLECTION, tenantId);
  await deleteDoc(docRef);
}
