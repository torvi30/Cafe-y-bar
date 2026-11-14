import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SuperAdminProvider } from './context/SuperAdminContext';
import { TenantConfigProvider } from './context/TenantConfigContext';
import { AppLayout } from './components/layout/AppLayout';
import { SuperAdminLayout } from './components/layout/SuperAdminLayout';
import { FeatureRoute } from './components/common/FeatureRoute';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Vistas de Autenticación & Gatekeeper
import { LoginView } from './views/auth/LoginView';
import { UnassignedUserView } from './views/auth/UnassignedUserView';

// Vistas del POS de Bar
import { QuickPosView } from './views/QuickPosView';
import { DianInvoicesView } from './views/DianInvoicesView';
import { InventoryView } from './views/InventoryView';
import { TableTabsView } from './views/TableTabsView';
import { SettingsView } from './views/SettingsView';
import { ProductsView } from './views/ProductsView';
import { CashControlView } from './views/CashControlView';

// Vistas Maestras Super Admin SaaS
import { SuperAdminDashboardView } from './views/superadmin/SuperAdminDashboardView';
import { TenantsListView } from './views/superadmin/TenantsListView';
import { PlatformUsersView } from './views/superadmin/PlatformUsersView';

/**
 * Guardia de ruta exclusivo para Super Administradores de la Plataforma
 */
const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (user?.role !== 'superadmin') {
    return <Navigate to="/pos" replace />;
  }
  return <>{children}</>;
};

/**
 * Redirección inteligente de raíz según el rol
 */
const RootRedirect: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'superadmin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Navigate to="/pos" replace />;
};

/**
 * Compuerta Principal de Autenticación & Multi-Tenancy (AuthGate)
 */
const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, firebaseUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#07090e] text-white">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-amber-400 font-bold tracking-wide text-sm">Iniciando sesión segura...</p>
        <span className="text-xs text-slate-500 mt-1">Verificando suscripción y roles multi-tenant</span>
      </div>
    );
  }

  // 1. Si no hay sesión activa en Firebase Auth -> Login
  if (!firebaseUser) {
    return <LoginView />;
  }

  // 2. Si todavía estamos cargando el perfil del usuario desde Firestore
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#07090e] text-white">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-amber-400 font-bold tracking-wide text-sm">Verificando credenciales y empresa...</p>
        <span className="text-xs text-slate-500 mt-1">Sincronizando permisos de seguridad</span>
      </div>
    );
  }

  // 3. Super Administrador de la plataforma: Acceso completo concedido
  if (user.role === 'superadmin') {
    return <>{children}</>;
  }

  // 4. Si el usuario NO es superadmin y NO tiene empresa asignada (companyId es null, vacío o 'unassigned')
  // -> BLOQUEO TOTAL OBLIGATORIO en pantalla de espera
  if (!user.companyId || user.companyId === 'unassigned') {
    return <UnassignedUserView />;
  }

  // 5. Usuario regular con empresa formalmente asignada
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <SuperAdminProvider>
            <TenantConfigProvider>
              <AuthGate>
                <Routes>
                  {/* ─── 1. CONSOLA CENTRAL SUPER ADMIN (BACK-OFFICE SEPARADO) ─── */}
                  <Route
                    path="/admin"
                    element={
                      <SuperAdminRoute>
                        <SuperAdminLayout />
                      </SuperAdminRoute>
                    }
                  >
                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="dashboard" element={<SuperAdminDashboardView />} />
                    <Route path="tenants" element={<TenantsListView />} />
                    <Route path="users" element={<PlatformUsersView />} />
                  </Route>

                  {/* ─── 2. PORTAL DE OPERACIÓN DEL BAR ACTIVO (POS Y MODULOS) ─── */}
                  <Route path="/" element={<AppLayout />}>
                    {/* Redirección inteligente de raíz */}
                    <Route index element={<RootRedirect />} />

                    {/* Módulos Base del Bar */}
                    <Route path="pos" element={<QuickPosView />} />
                    <Route path="facturacion" element={<DianInvoicesView />} />
                    <Route path="productos" element={<ProductsView />} />

                    {/* Módulos Condicionales protegidos por Feature Flags */}
                    <Route
                      path="caja"
                      element={
                        <FeatureRoute feature="cashControlEnabled" redirectTo="/pos">
                          <CashControlView />
                        </FeatureRoute>
                      }
                    />

                    <Route
                      path="inventario"
                      element={
                        <FeatureRoute feature="inventoryEnabled" redirectTo="/pos">
                          <InventoryView />
                        </FeatureRoute>
                      }
                    />

                    <Route
                      path="mesas"
                      element={
                        <FeatureRoute feature="tableTabsEnabled" redirectTo="/pos">
                          <TableTabsView />
                        </FeatureRoute>
                      }
                    />

                    <Route path="configuracion" element={<SettingsView />} />

                    {/* Ruta de Usuario Sin Asignar */}
                    <Route path="unassigned" element={<UnassignedUserView />} />

                    {/* Catch-all */}
                    <Route path="*" element={<RootRedirect />} />
                  </Route>
                </Routes>
              </AuthGate>
            </TenantConfigProvider>
          </SuperAdminProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
