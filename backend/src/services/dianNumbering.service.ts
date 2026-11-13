import { db } from '../config/firebaseAdmin.js';
import admin from 'firebase-admin';

export interface DianConsecutiveResult {
  prefix: string;
  consecutive: number;
  fullNumber: string;
  resolutionNumber: string;
  technicalKey: string;
}

export class DianNumberingService {
  /**
   * Obtiene e incrementa de forma atómica el siguiente número de factura DIAN
   * garantizando que no existan huecos ni duplicados.
   */
  static async getNextInvoiceNumber(
    tenantId: string,
    transaction: FirebaseFirestore.Transaction
  ): Promise<DianConsecutiveResult> {
    const settingsRef = db.doc(`tenants/${tenantId}/config/settings`);
    const settingsSnap = await transaction.get(settingsRef);

    if (!settingsSnap.exists) {
      throw new Error(`Configuración no encontrada para tenant: ${tenantId}`);
    }

    const tenantData = settingsSnap.data();
    const dianConfig = tenantData?.dianConfig;

    if (!dianConfig) {
      throw new Error(`El tenant ${tenantId} no tiene configuración DIAN parametrizada.`);
    }

    const currentNumber = Number(dianConfig.currentNumber || 0);
    const nextNumber = currentNumber + 1;

    if (nextNumber > Number(dianConfig.rangeTo)) {
      throw new Error(
        `Rango de numeración DIAN agotado para resolución ${dianConfig.resolutionNumber}. Límite: ${dianConfig.rangeTo}`
      );
    }

    // Actualización atómica en Firestore dentro de la transacción
    transaction.update(settingsRef, {
      'dianConfig.currentNumber': nextNumber,
      'dianConfig.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
    });

    const prefix = dianConfig.prefix || '';
    const fullNumber = `${prefix}${nextNumber}`;

    return {
      prefix,
      consecutive: nextNumber,
      fullNumber,
      resolutionNumber: dianConfig.resolutionNumber,
      technicalKey: dianConfig.technicalKey,
    };
  }
}

