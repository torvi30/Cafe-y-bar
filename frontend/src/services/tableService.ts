import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { CartItem } from '../store/posStore';

export interface TableTab {
  id: string;
  name: string;
  waiter: string;
  status: 'OPEN' | 'BUSY' | 'CLOSING';
  items: CartItem[];
  itemsCount: number;
  total: number;
  openedAt: string;
  updatedAt?: any;
}

/**
 * Escucha en tiempo real todas las mesas y cuentas abiertas del bar
 */
export function listenCompanyTables(
  tenantId: string,
  callback: (tables: TableTab[]) => void
): () => void {
  if (!tenantId) return () => {};

  const colRef = collection(db, 'tenants', tenantId, 'tables');
  const q = query(colRef, orderBy('name', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const tables = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as TableTab[];
      callback(tables);
    },
    (err) => {
      console.warn('Error escuchando mesas de la empresa:', err);
    }
  );
}

/**
 * Crea una nueva mesa o comanda
 */
export async function createTableInDb(
  tenantId: string,
  name: string,
  waiter: string
): Promise<TableTab> {
  const colRef = collection(db, 'tenants', tenantId, 'tables');
  const newTable = {
    name,
    waiter,
    status: 'OPEN',
    items: [],
    itemsCount: 0,
    total: 0,
    openedAt: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(colRef, newTable);
  return {
    id: docRef.id,
    ...newTable,
  } as TableTab;
}

/**
 * Actualiza los items de consumo de una mesa
 */
export async function updateTableItemsInDb(
  tenantId: string,
  tableId: string,
  items: CartItem[]
): Promise<void> {
  const docRef = doc(db, 'tenants', tenantId, 'tables', tableId);
  const itemsCount = items.reduce((acc, i) => acc + i.quantity, 0);
  const total = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const status = itemsCount > 0 ? 'BUSY' : 'OPEN';

  await updateDoc(docRef, {
    items,
    itemsCount,
    total,
    status,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Libera una mesa tras cobrar la cuenta en el POS
 */
export async function clearTableInDb(tenantId: string, tableId: string): Promise<void> {
  const docRef = doc(db, 'tenants', tenantId, 'tables', tableId);
  await updateDoc(docRef, {
    items: [],
    itemsCount: 0,
    total: 0,
    status: 'OPEN',
    updatedAt: serverTimestamp(),
  });
}

/**
 * Elimina una mesa permanentemente
 */
export async function deleteTableFromDb(tenantId: string, tableId: string): Promise<void> {
  const docRef = doc(db, 'tenants', tenantId, 'tables', tableId);
  await deleteDoc(docRef);
}

