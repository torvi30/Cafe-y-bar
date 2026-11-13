import { create } from 'zustand';

export interface CashMovement {
  id: string;
  type: 'ENTRY' | 'EXPENSE';
  amount: number;
  reason: string;
  time: string;
}

export interface CashShift {
  id: string;
  shiftNumber: number;
  cashierName: string;
  status: 'OPEN' | 'CLOSED';
  openedAt: string;
  closedAt?: string;
  initialCash: number; // Base inicial
  movements: CashMovement[];
  cashSales: number;
  cardSales: number;
  transferSales: number;
  countedCash?: number;
  difference?: number;
  notes?: string;
}

interface CashShiftState {
  currentShift: CashShift | null;
  shiftHistory: CashShift[];
  openShift: (initialCash: number, cashierName: string) => void;
  addMovement: (type: 'ENTRY' | 'EXPENSE', amount: number, reason: string) => void;
  registerSaleToShift: (method: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA', amount: number) => void;
  closeShift: (countedCash: number, notes?: string) => CashShift;
  getShiftTotals: () => {
    totalEntries: number;
    totalExpenses: number;
    totalSales: number;
    expectedCash: number;
  };
}

export const useCashShiftStore = create<CashShiftState>((set, get) => {
  // CERO TURNOS QUEMADOS: Inicia sin turno abierto
  const loadFromStorage = (): { current: CashShift | null; history: CashShift[] } => {
    try {
      const savedCurrent = localStorage.getItem('nightlife_current_shift');
      const savedHistory = localStorage.getItem('nightlife_shifts_history');
      return {
        current: savedCurrent ? JSON.parse(savedCurrent) : null,
        history: savedHistory ? JSON.parse(savedHistory) : [],
      };
    } catch {
      return { current: null, history: [] };
    }
  };

  const { current, history } = loadFromStorage();

  const persist = (currentShift: CashShift | null, shiftHistory: CashShift[]) => {
    try {
      if (currentShift) {
        localStorage.setItem('nightlife_current_shift', JSON.stringify(currentShift));
      } else {
        localStorage.removeItem('nightlife_current_shift');
      }
      localStorage.setItem('nightlife_shifts_history', JSON.stringify(shiftHistory));
    } catch {}
  };

  return {
    currentShift: current,
    shiftHistory: history,

    openShift: (initialCash, cashierName) => {
      const shiftNumber = (get().currentShift?.shiftNumber || get().shiftHistory.length + 100) + 1;
      const newShift: CashShift = {
        id: `shift_${Date.now()}`,
        shiftNumber,
        cashierName: cashierName || 'Cajero Principal',
        status: 'OPEN',
        openedAt: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
        initialCash: Number(initialCash),
        movements: [],
        cashSales: 0,
        cardSales: 0,
        transferSales: 0,
      };

      set({ currentShift: newShift });
      persist(newShift, get().shiftHistory);
    },

    addMovement: (type, amount, reason) => {
      const { currentShift, shiftHistory } = get();
      if (!currentShift || currentShift.status !== 'OPEN') return;

      const movement: CashMovement = {
        id: `mov_${Date.now()}`,
        type,
        amount: Number(amount),
        reason,
        time: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      };

      const updated = {
        ...currentShift,
        movements: [movement, ...currentShift.movements],
      };

      set({ currentShift: updated });
      persist(updated, shiftHistory);
    },

    registerSaleToShift: (method, amount) => {
      const { currentShift, shiftHistory } = get();
      if (!currentShift || currentShift.status !== 'OPEN') return;

      const updated = { ...currentShift };
      if (method === 'EFECTIVO') updated.cashSales += amount;
      else if (method === 'TARJETA') updated.cardSales += amount;
      else if (method === 'TRANSFERENCIA') updated.transferSales += amount;

      set({ currentShift: updated });
      persist(updated, shiftHistory);
    },

    closeShift: (countedCash, notes) => {
      const { currentShift, shiftHistory, getShiftTotals } = get();
      if (!currentShift) throw new Error('No hay turno abierto');

      const { expectedCash } = getShiftTotals();
      const difference = Number(countedCash) - expectedCash;

      const closedShift: CashShift = {
        ...currentShift,
        status: 'CLOSED',
        closedAt: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
        countedCash: Number(countedCash),
        difference,
        notes,
      };

      const updatedHistory = [closedShift, ...shiftHistory];
      set({ currentShift: null, shiftHistory: updatedHistory });
      persist(null, updatedHistory);

      return closedShift;
    },

    getShiftTotals: () => {
      const { currentShift } = get();
      if (!currentShift) {
        return { totalEntries: 0, totalExpenses: 0, totalSales: 0, expectedCash: 0 };
      }

      const totalEntries = currentShift.movements
        .filter((m) => m.type === 'ENTRY')
        .reduce((acc, m) => acc + m.amount, 0);

      const totalExpenses = currentShift.movements
        .filter((m) => m.type === 'EXPENSE')
        .reduce((acc, m) => acc + m.amount, 0);

      const totalSales =
        currentShift.cashSales + currentShift.cardSales + currentShift.transferSales;

      const expectedCash =
        currentShift.initialCash + currentShift.cashSales + totalEntries - totalExpenses;

      return {
        totalEntries,
        totalExpenses,
        totalSales,
        expectedCash,
      };
    },
  };
});
