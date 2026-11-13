import { Router, Request, Response } from 'express';
import { db } from '../config/firebaseAdmin.js';

export const tenantRouter = Router();

/**
 * GET /api/v1/tenant/settings
 * Retorna la configuración completa y flags del tenant actual
 */
tenantRouter.get('/settings', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: req.tenantSettings,
  });
});

/**
 * PATCH /api/v1/tenant/features
 * Permite encender o apagar Feature Flags en tiempo de ejecución
 */
tenantRouter.patch('/features', async (req: Request, res: Response) => {
  try {
    const { features } = req.body;
    if (!features || typeof features !== 'object') {
      return res.status(400).json({ error: 'Objeto de features inválido' });
    }

    const settingsRef = db.doc(`tenants/${req.tenantId}/config/settings`);
    await settingsRef.update({
      features: {
        ...req.tenantSettings.features,
        ...features,
      },
    });

    res.json({
      success: true,
      message: 'Feature flags actualizados correctamente en Firestore',
      features,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

