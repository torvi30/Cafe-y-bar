import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { isPlatformSuperadminEmail } from '../lib/constants';
import type { UserProfile, Role } from '../types/auth';

const USERS_COLLECTION = 'users';

/**
 * Fetch users belonging to a company.
 * STRICT MULTI-TENANCY RULE (ADR 002): Must filter by companyId.
 */
export async function fetchCompanyUsers(companyId: string): Promise<UserProfile[]> {
  if (!companyId) return [];

  const colRef = collection(db, USERS_COLLECTION);
  const q = query(colRef, where('companyId', '==', companyId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      uid: docSnap.id,
      email: data.email,
      displayName: data.displayName || null,
      avatarUrl: data.avatarUrl || null,
      role: data.role as Role,
      companyId: data.companyId,
      createdAt: data.createdAt,
    };
  });
}

/**
 * Add a new user to a specific company (Admin only)
 */
export async function addCompanyUser(
  companyId: string,
  user: { email: string; displayName: string; role: Role }
): Promise<UserProfile> {
  const newUid = 'usr_' + Date.now();
  const newUser: UserProfile = {
    uid: newUid,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    companyId: companyId,
    createdAt: new Date().toISOString(),
  };

  const docRef = doc(db, USERS_COLLECTION, newUid);
  await setDoc(docRef, {
    ...newUser,
    createdAt: serverTimestamp(),
  });

  return newUser;
}

/**
 * Delete a user from a tenant (Admin only)
 */
export async function removeCompanyUser(uid: string): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, uid);
  await deleteDoc(docRef);
}

/**
 * Fetch all platform users across all tenants (Superadmin only).
 */
export async function fetchAllPlatformUsers(): Promise<UserProfile[]> {
  const colRef = collection(db, USERS_COLLECTION);
  const snapshot = await getDocs(colRef);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      uid: docSnap.id,
      email: data.email || '',
      displayName: data.displayName || null,
      avatarUrl: data.avatarUrl || null,
      role: (data.role as Role) || 'user',
      companyId: data.companyId || null,
      createdAt: data.createdAt,
    };
  });
}

/**
 * Assigns or reassigns a user to a tenant company, and changes their role (Superadmin only).
 */
export async function updateUserTenantAndRole(
  uid: string,
  companyId: string | null,
  role: Role
): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(docRef, {
    companyId: companyId || null,
    role: role,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Permanently delete a user profile document from Firestore (Superadmin only).
 */
export async function deletePlatformUser(uid: string): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, uid);
  await deleteDoc(docRef);
}

