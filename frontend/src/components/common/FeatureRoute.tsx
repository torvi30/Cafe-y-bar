import React from 'react';
import { Navigate } from 'react-router-dom';
import { useTenantConfig, TenantFeatures } from '../../context/TenantConfigContext';

interface FeatureRouteProps {
  feature: keyof TenantFeatures;
  children: any;
  redirectTo?: string;
}

/**
 * Guarda de ruta que previene el acceso manual a URLs de módulos inactivos
 * (ej. si el bar no tiene inventario, `/inventario` lo redirige automáticamente al POS).
 */
export const FeatureRoute: React.FC<FeatureRouteProps> = ({
  feature,
  children,
  redirectTo = '/pos',
}) => {
  const { isFeatureActive, isLoading } = useTenantConfig();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-amber-400 mr-3"></div>
        Cargando configuración del bar...
      </div>
    );
  }

  if (!isFeatureActive(feature)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

