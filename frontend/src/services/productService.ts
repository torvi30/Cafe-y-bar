import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { PosProduct } from '../store/posStore';

export function listenCompanyProducts(
  companyId: string,
  onUpdate: (products: PosProduct[]) => void
): () => void {
  if (!companyId) {
    onUpdate([]);
    return () => {};
  }

  const colRef = collection(db, 'companies', companyId, 'products');
  return onSnapshot(
    colRef,
    (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as PosProduct[];
      console.log(`[Firestore] Recibidos ${list.length} productos para company ${companyId}`);
      onUpdate(list);
    },
    (err) => {
      console.error(`[Firestore ERROR] Escuchando productos de ${companyId}:`, err);
    }
  );
}

export async function createCompanyProduct(
  companyId: string,
  product: PosProduct
): Promise<void> {
  if (!companyId) throw new Error('No companyId provided');
  const docRef = doc(db, 'companies', companyId, 'products', product.id);
  await setDoc(docRef, {
    ...product,
    createdAt: serverTimestamp(),
  });
}

export async function updateCompanyProduct(
  companyId: string,
  productId: string,
  data: Partial<PosProduct>
): Promise<void> {
  if (!companyId) throw new Error('No companyId provided');
  const docRef = doc(db, 'companies', companyId, 'products', productId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCompanyProduct(
  companyId: string,
  productId: string
): Promise<void> {
  if (!companyId) throw new Error('No companyId provided');
  const docRef = doc(db, 'companies', companyId, 'products', productId);
  await deleteDoc(docRef);
}

