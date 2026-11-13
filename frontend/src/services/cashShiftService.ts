import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { CashShift, CashMovement } from '../store/cashShiftStore';

/**
 * Escucha en vivo el turno de caja actualmente abierto en la empresa
 */
export function listenActiveCashShift(
  tenantId: string,
  callback: (shift: CashShift | null) => void
): () => void {
  if (!tenantId) return () => {};

  const colRef = collection(db, 'tenants', tenantId, 'cashShifts');
  const q = query(colRef, where('status', '==', 'OPEN'), limit(1));

  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        callback(null);
      } else {
        const d = snapshot.docs[0];
        const data = d.data();
        callback({
          id: d.id,
          ...data,
          shiftNumber: data.shiftNumber || 1,
          cashierName: data.cashierName || 'Cajero',
          status: data.status,
          openedAt: data.openedAt || new Date().toLocaleString('es-CO'),
          initialCash: data.initialCash || 0,
          movements: data.movements || [],
          cashSales: data.cashSales || 0,
          cardSales: data.cardSales || 0,
          transferSales: data.transferSales || 0,
        } as CashShift);
      }
    },
    (err) => {
      console.warn('Error escuchando turno de caja activo:', err);
    }
  );
}

/**
 * Escucha los últimos turnos de caja cerrados (historial)
 */
export function listenCashShiftsHistory(
  tenantId: string,
  callback: (shifts: CashShift[]) => void
): () => void {
  if (!tenantId) return () => {};

  const colRef = collection(db, 'tenants', tenantId, 'cashShifts');
  const q = query(colRef, where('status', '==', 'CLOSED'), orderBy('closedAt', 'desc'), limit(50));

  return onSnapshot(
    q,
    (snapshot) => {
      const history = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as CashShift[];
      callback(history);
    },
    (err) => {
      console.warn('Error escuchando historial de turnos:', err);
    }
  );
}

/**
 * Abre un nuevo turno de caja en Firestore
 */
export async function openCashShiftInDb(
  tenantId: string,
  initialCash: number,
  cashierName: string,
  cashierUid?: string
): Promise<CashShift> {
  const colRef = collection(db, 'tenants', tenantId, 'cashShifts');
  const newShiftData = {
    shiftNumber: Date.now() % 10000,
    cashierName,
    cashierUid: cashierUid || null,
    status: 'OPEN',
    openedAt: new Date().toLocaleString('es-CO'),
    initialCash,
    movements: [],
    cashSales: 0,
    cardSales: 0,
    transferSales: 0,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(colRef, newShiftData);
  return {
    id: docRef.id,
    ...newShiftData,
  } as CashShift;
}

/**
 * Registra una venta completada en el turno activo en Firestore
 */
export async function registerSaleToActiveShift(
  tenantId: string,
  shiftId: string,
  paymentMethod: 'EFECTIVO' | 'DATAFONO' | 'TRANSFERENCIA',
  amount: number,
  currentShift: CashShift
): Promise<void> {
  if (!tenantId || !shiftId) return;

  const docRef = doc(db, 'tenants', tenantId, 'cashShifts', shiftId);

  const updates: any = {
    updatedAt: serverTimestamp(),
  };

  if (paymentMethod === 'EFECTIVO') {
    updates.cashSales = (currentShift.cashSales || 0) + amount;
  } else if (paymentMethod === 'DATAFONO') {
    updates.cardSales = (currentShift.cardSales || 0) + amount;
  } else if (paymentMethod === 'TRANSFERENCIA') {
    updates.transferSales = (currentShift.transferSales || 0) + amount;
  }

  await updateDoc(docRef, updates);
}

/**
 * Agrega un movimiento de caja (Entrada o Gasto)
 */
export async function addMovementToActiveShift(
  tenantId: string,
  shiftId: string,
  movement: CashMovement,
  existingMovements: CashMovement[]
): Promise<void> {
  const docRef = doc(db, 'tenants', tenantId, 'cashShifts', shiftId);
  await updateDoc(docRef, {
    movements: [...existingMovements, movement],
    updatedAt: serverTimestamp(),
  });
}

/**
 * Cierra un turno de caja con arqueo y diferencia
 */
export async function closeCashShiftInDb(
  tenantId: string,
  shiftId: string,
  countedCash: number,
  expectedCash: number,
  notes?: string
): Promise<void> {
  const docRef = doc(db, 'tenants', tenantId, 'cashShifts', shiftId);
  const difference = countedCash - expectedCash;

  await updateDoc(docRef, {
    status: 'CLOSED',
    closedAt: new Date().toLocaleString('es-CO'),
    countedCash,
    difference,
    notes: notes || '',
    updatedAt: serverTimestamp(),
  });
}

