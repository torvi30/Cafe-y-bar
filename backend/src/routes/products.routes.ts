import { Router, Request, Response } from 'express';
import { db } from '../config/firebaseAdmin.js';
import { requireFeature } from '../middleware/tenantContext.js';
import { Product } from '../types/product.types.js';

export const productsRouter = Router();

/**
 * GET /api/v1/products
 * Lista productos adaptados a las flags del tenant:
 * Si inventoryEnabled == false, suprime información de inventario/costos.
 */
productsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const productsSnap = await db
      .collection(`tenants/${req.tenantId}/products`)
      .where('isActive', '==', true)
      .get();

    const isInventoryEnabled = req.features.inventoryEnabled;

    const products = productsSnap.docs.map((doc) => {
      const data = doc.data() as Product;
      const productObj: any = {
        id: doc.id,
        name: data.name,
        category: data.category,
        price: data.price,
        taxType: data.taxType,
        barcode: data.barcode,
        color: data.color,
      };

      // Si el tenant tiene inventario activo, incluye stock y alertas
      if (isInventoryEnabled && data.inventory) {
        productObj.inventory = {
          stock: data.inventory.stock,
          minStockAlert: data.inventory.minStockAlert,
          unit: data.inventory.unit,
          // El costo solo se expone a administradores
          cost: data.inventory.cost,
        };
      }

      return productObj;
    });

    res.json({ success: true, data: products });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/products/:id/adjust-stock
 * Ajuste manual de stock - protegido por la flag 'inventoryEnabled'
 */
productsRouter.post(
  '/:id/adjust-stock',
  requireFeature('inventoryEnabled'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { newStock, reason } = req.body;

      const productRef = db.doc(`tenants/${req.tenantId}/products/${id}`);
      await productRef.update({
        'inventory.stock': Number(newStock),
      });

      // Registrar auditoría en /inventory/audit
      await db.collection(`tenants/${req.tenantId}/inventory`).add({
        productId: id,
        newStock: Number(newStock),
        reason: reason || 'Ajuste manual',
        adjustedAt: new Date(),
      });

      res.json({ success: true, message: 'Stock ajustado correctamente' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

