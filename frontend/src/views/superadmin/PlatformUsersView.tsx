import React, { useState, useEffect } from 'react';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { UserCheck, Shield, Building2, UserX, Trash2, Mail, CheckCircle2 } from 'lucide-react';
import type { UserProfile, Role } from '../../types/auth';
import { confirmAction, toastSuccess } from '../../lib/alerts';

export const PlatformUsersView: React.FC = () => {
  const {
    tenants,
    platformUsers,
    loadPlatformUsers,
    assignUserToTenant,
    deleteUser,
  } = useSuperAdmin();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [targetCompanyId, setTargetCompanyId] = useState<string>('');
  const [targetRole, setTargetRole] = useState<Role>('user');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    loadPlatformUsers().finally(() => setIsLoading(false));
  }, []);

  const handleOpenAssignModal = (user: UserProfile) => {
    setSelectedUser(user);
    setTargetCompanyId(user.companyId || (tenants.length > 0 ? tenants[0].tenantId : ''));
    setTargetRole(user.role === 'superadmin' ? 'admin' : user.role);
    setSuccessMsg(null);
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    await assignUserToTenant(selectedUser.uid, targetCompanyId || null, targetRole);
    toastSuccess(`Usuario ${selectedUser.email} actualizado`);
    setSelectedUser(null);
  };

  const handleUnlink = async (uid: string, email: string) => {
    const confirmed = await confirmAction({
      title: '¿Desvincular Usuario?',
      text: `¿Desvincular a "${email}" de su empresa actual? Quedará en estado pendiente de asignación.`,
      confirmText: 'Sí, desvincular',
      cancelText: 'Cancelar',
      isDangerous: true,
    });
    if (confirmed) {
      await assignUserToTenant(uid, null, 'user');
      toastSuccess(`Usuario "${email}" desvinculado`);
    }
  };

  const handleDelete = async (uid: string, email: string) => {
    const confirmed = await confirmAction({
      title: '¿Eliminar Usuario?',
      text: `¿Eliminar permanentemente el perfil de "${email}"? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      isDangerous: true,
    });
    if (confirmed) {
      await deleteUser(uid);
      toastSuccess(`Perfil de "${email}" eliminado`);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#07090e] p-6 text-white overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <span>👥</span> Usuarios de la Plataforma & Asignaciones
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Solo el Super Administrador puede vincular usuarios a una empresa y definir sus roles operativos.
          </p>
        </div>

        <button
          onClick={() => {
            setIsLoading(true);
            loadPlatformUsers().finally(() => setIsLoading(false));
          }}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl transition border border-slate-700"
        >
          🔄 Refrescar Lista
        </button>
      </div>

      {/* Lista de Usuarios */}
      <div className="flex-1 overflow-y-auto bg-[#0d121e] border border-slate-800 rounded-2xl shadow-2xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#090d16] sticky top-0 z-10 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="p-3.5">Usuario / Correo</th>
              <th className="p-3.5">Rol Actual</th>
              <th className="p-3.5">Empresa Asignada</th>
              <th className="p-3.5 text-center">Estado de Acceso</th>
              <th className="p-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {platformUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-slate-500">
                  {isLoading ? 'Cargando usuarios...' : 'No hay usuarios registrados en la base de datos todavía.'}
                </td>
              </tr>
            ) : (
              platformUsers.map((user) => {
                const assignedCompany = tenants.find((t) => t.tenantId === user.companyId);
                const isUnassigned = !user.companyId && user.role !== 'superadmin';

                return (
                  <tr key={user.uid} className="hover:bg-slate-800/30 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-white text-sm">
                        {user.displayName || 'Sin Nombre'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-500" />
                        <span>{user.email}</span>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          user.role === 'superadmin'
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                            : user.role === 'admin'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        <span className="capitalize">{user.role}</span>
                      </span>
                    </td>

                    <td className="p-3.5">
                      {user.role === 'superadmin' ? (
                        <span className="text-amber-400 font-bold text-xs">Acceso Global Multi-tenant</span>
                      ) : assignedCompany ? (
                        <div>
                          <div className="font-bold text-slate-200">{assignedCompany.tradeName}</div>
                          <div className="text-[10px] text-slate-400">{assignedCompany.city}</div>
                        </div>
                      ) : (
                        <span className="text-amber-400/90 text-xs font-semibold">
                          ⚠️ Sin Asignar (Bloqueado)
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 text-center">
                      {user.role === 'superadmin' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                          👑 Super Admin
                        </span>
                      ) : isUnassigned ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          ⏳ Pendiente Asignación
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          ● Acceso Habilitado
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 text-right space-x-1.5">
                      {user.role !== 'superadmin' && (
                        <>
                          <button
                            onClick={() => handleOpenAssignModal(user)}
                            className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs transition active:scale-95 shadow-md shadow-amber-400/15"
                            title="Asignar o cambiar empresa y rol"
                          >
                            Asignar Empresa
                          </button>

                          {user.companyId && (
                            <button
                              onClick={() => handleUnlink(user.uid, user.email)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
                              title="Desvincular de empresa"
                            >
                              Desvincular
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(user.uid, user.email)}
                            className="px-2 py-1.5 text-slate-500 hover:text-red-400 text-xs font-bold transition"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Asignación de Empresa & Rol */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1422] border border-amber-500/40 rounded-3xl p-6 max-w-md w-full text-left animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-black text-white mb-1">Vincular Usuario a Empresa</h3>
            <p className="text-xs text-slate-400 mb-4">
              Asignando acceso a: <strong className="text-amber-400">{selectedUser.email}</strong>
            </p>

            {successMsg ? (
              <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleSaveAssignment} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Seleccionar Empresa / Bar</label>
                  {tenants.length === 0 ? (
                    <div className="p-3 bg-red-950/40 border border-red-800/40 rounded-xl text-red-300">
                      No hay empresas creadas todavía. Crea una empresa primero en el directorio.
                    </div>
                  ) : (
                    <select
                      value={targetCompanyId}
                      onChange={(e) => setTargetCompanyId(e.target.value)}
                      className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="">-- Sin Empresa (Desvincular) --</option>
                      {tenants.map((t) => (
                        <option key={t.tenantId} value={t.tenantId}>
                          {t.tradeName} ({t.city})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Rol en el Establecimiento</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value as Role)}
                    className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="admin">Administrador del Bar (Acceso total al bar)</option>
                    <option value="user">Operador / Bartender / Cajero (Solo POS Barra)</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!targetCompanyId && targetCompanyId !== ''}
                    className="flex-1 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl uppercase tracking-wider transition shadow-lg shadow-amber-400/20 active:scale-95"
                  >
                    Guardar Asignación
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

