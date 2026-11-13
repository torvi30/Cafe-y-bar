import { db } from '../config/firebaseAdmin.js';
import admin from 'firebase-admin';
import { DianNumberingService } from './dianNumbering.service.js';
import { DianCufeService } from './dianCufe.service.js';
import { DianQueueService } from './dianQueue.service.js';
import { Order, OrderItem } from '../types/order.types.js';
import { TenantSettings } from '../types/tenant.types.js';

export interface CheckoutPayload {
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    name: string;
    taxType: 'IMPOCONSUMO_8' | 'IVA_19' | 'EXENTO';
  }>;
  paymentMethod: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'MIXTO';
  customerNit?: string;
  customerName?: string;
  customerEmail?: string;
  tableId?: string;
  includeTip?: boolean;
}

export class CheckoutService {
  /**
   * Procesa la venta respetando los Feature Flags del tenant:
   * - inventoryEnabled: descuenta existencias de forma atómica o permite venta libre.
   * - electronicInvoicing: genera factura DIAN con consecutivo y CUFE en milisegundos.
   */
  static async processSale(tenantSettings: TenantSettings, payload: CheckoutPayload) {
    const { tenantId, features, dianConfig } = tenantSettings;

    // 1. Cálculos de impuestos colombianos (Impoconsumo 8% o IVA 19%)
    let subtotal = 0;
    let taxAmount = 0;

    const calculatedItems: OrderItem[] = payload.items.map((item) => {
      const itemGross = item.price * item.quantity;
      let itemSubtotal = itemGross;
      let itemTax = 0;

      if (item.taxType === 'IMPOCONSUMO_8') {
        itemSubtotal = Math.round(itemGross / 1.08);
        itemTax = itemGross - itemSubtotal;
      } else if (item.taxType === 'IVA_19') {
        itemSubtotal = Math.round(itemGross / 1.19);
        itemTax = itemGross - itemSubtotal;
      }

      subtotal += itemSubtotal;
      taxAmount += itemTax;

      return {
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        taxType: item.taxType,
        subtotal: itemSubtotal,
        taxAmount: itemTax,
        total: itemGross,
      };
    });

    // Propina sugerida voluntaria (10%) si está habilitada la flag y el cliente la aprobó
    const tipAmount = (features.propinaSugeridaEnabled && payload.includeTip)
      ? Math.round(subtotal * 0.1)
      : 0;

    const total = subtotal + taxAmount + tipAmount;

    // 2. Transacción Atómica en Firestore
    const result = await db.runTransaction(async (transaction) => {
      // ─── A. CONDICIONAL DE INVENTARIO ────────────────────────────────
      if (features.inventoryEnabled) {
        for (const item of payload.items) {
          const productRef = db.doc(`tenants/${tenantId}/products/${item.productId}`);
          const prodSnap = await transaction.get(productRef);

          if (!prodSnap.exists) {
            throw new Error(`Producto ${item.productId} no encontrado en catálogo.`);
          }

          const prodData = prodSnap.data()!;
          const currentStock = prodData.inventory?.stock ?? 0;

          if (prodData.inventory?.isStockTracked) {
            if (currentStock < item.quantity) {
              throw new Error(
                `Stock insuficiente para "${prodData.name}". Disponible: ${currentStock}, solicitado: ${item.quantity}`
              );
            }

            // Descuento atómico del stock
            transaction.update(productRef, {
              'inventory.stock': currentStock - item.quantity,
              'inventory.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
            });

            // Registro en Kardex si stock bajo
            if (currentStock - item.quantity <= (prodData.inventory?.minStockAlert ?? 5)) {
              console.warn(
                `⚠️ ALERTA DE STOCK: "${prodData.name}" queda con ${currentStock - item.quantity} unidades.`
              );
            }
          }
        }
      } else {
        // inventoryEnabled === false: Bypass total, no consulta ni bloquea por existencias
      }

      // ─── B. ASIGNACIÓN DE CONSECUTIVO DIAN (Siempre activo) ──────────
      const numbering = await DianNumberingService.getNextInvoiceNumber(tenantId, transaction);

      // ─── C. CÁLCULO DE CUFE ──────────────────────────────────────────
      const now = new Date();
      const fecFac = now.toISOString().split('T')[0];
      const horFac = now.toTimeString().split(' ')[0] + '-05:00';
      const customerNit = payload.customerNit || '222222222222'; // 222222222222 = Consumidor Final DIAN

      const cufe = DianCufeService.calculateCUFE({
        numFac: numbering.fullNumber,
        fecFac,
        horFac,
        valFac: subtotal.toFixed(2),
        codImp1: '04', // 04 = Impuesto Nacional al Consumo
        valImp1: taxAmount.toFixed(2),
        valTot: total.toFixed(2),
        nitEmisor: tenantSettings.nit.replace(/\D/g, ''),
        numAdq: customerNit,
        claveTecnica: numbering.technicalKey,
        tipoAmbiente: dianConfig.environment,
      });

      const qrCode = DianCufeService.generateQrContent({
        numFac: numbering.fullNumber,
        fecFac,
        nitEmisor: tenantSettings.nit.replace(/\D/g, ''),
        numAdq: customerNit,
        valTot: total.toFixed(2),
        cufe,
      });

      // ─── D. CREACIÓN DE LA ORDEN Y FACTURA EN FIRESTORE ──────────────
      const orderRef = db.collection(`tenants/${tenantId}/orders`).doc();
      const invoiceRef = db.collection(`tenants/${tenantId}/invoices`).doc(numbering.fullNumber);

      const orderData: Order = {
        id: orderRef.id,
        tenantId,
        consecutiveNumber: numbering.consecutive,
        invoiceNumber: numbering.fullNumber,
        cufe,
        items: calculatedItems,
        subtotal,
        taxAmount,
        tipAmount,
        total,
        paymentMethod: payload.paymentMethod,
        status: 'PAID',
        tableId: features.tableTabsEnabled ? payload.tableId : undefined,
        customerNit,
        customerName: payload.customerName || 'Consumidor Final',
        customerEmail: payload.customerEmail,
        dianStatus: 'QUEUED',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      transaction.set(orderRef, orderData);

      transaction.set(invoiceRef, {
        ...orderData,
        invoiceId: invoiceRef.id,
        qrCode,
        resolutionNumber: numbering.resolutionNumber,
        prefix: numbering.prefix,
        consecutive: numbering.consecutive,
        issuedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        orderId: orderRef.id,
        invoiceId: invoiceRef.id,
        invoiceNumber: numbering.fullNumber,
        cufe,
        qrCode,
        total,
        subtotal,
        taxAmount,
        tipAmount,
        itemsCount: calculatedItems.length,
      };
    });

    // 3. Encolado Asíncrono de Transmisión DIAN (sin bloquear la barra)
    if (features.electronicInvoicing) {
      await DianQueueService.enqueueInvoice({
        tenantId,
        orderId: result.orderId,
        invoiceId: result.invoiceId,
        invoiceNumber: result.invoiceNumber,
        cufe: result.cufe,
      });
    }

    return result;
  }
}

