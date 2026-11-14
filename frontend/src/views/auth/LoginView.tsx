import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Building2,
  ArrowRight,
  UserPlus,
  LogIn,
  AlertCircle,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function getFriendlyFirebaseErrorMessage(errorMsg: string): string {
  if (errorMsg.includes('auth/popup-closed-by-user')) {
    return 'La ventana de inicio de sesión fue cerrada antes de completar la verificación.';
  }
  if (errorMsg.includes('auth/popup-blocked')) {
    return 'Tu navegador bloqueó la ventana emergente de Google. Por favor permite popups en este sitio.';
  }
  if (errorMsg.includes('auth/unauthorized-domain')) {
    return 'Este dominio (localhost) no está en los dominios autorizados de Firebase. Agrégalo en Firebase Console > Authentication > Settings > Authorized domains.';
  }
  if (errorMsg.includes('auth/operation-not-allowed')) {
    return 'El proveedor de Google o Email no está habilitado en Firebase Console. Ve a Authentication > Sign-in method y habilítalo.';
  }
  if (
    errorMsg.includes('auth/user-not-found') ||
    errorMsg.includes('auth/wrong-password') ||
    errorMsg.includes('auth/invalid-credential')
  ) {
    return 'Correo o contraseña incorrectos. Verifica tus credenciales o crea una cuenta.';
  }
  if (errorMsg.includes('auth/email-already-in-use')) {
    return 'Ya existe una cuenta registrada con este correo electrónico. Por favor inicia sesión.';
  }
  if (errorMsg.includes('auth/weak-password')) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  if (errorMsg.includes('auth/invalid-email')) {
    return 'Por favor ingresa una dirección de correo válida.';
  }
  return errorMsg;
}

export const LoginView: React.FC = () => {
  const { user, loginWithEmail, registerWithEmail, loginWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Redirección reactiva una vez autenticado
  React.useEffect(() => {
    if (user) {
      if (user.role === 'superadmin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (!user.companyId) {
        navigate('/unassigned', { replace: true });
      } else {
        navigate('/pos', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    setError(null);
    setResetSuccessMessage(null);

    if (!acceptedTerms) {
      setError('Debes aceptar los términos y condiciones de la plataforma para continuar.');
      return;
    }

    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
      // El redireccionamiento se ejecuta automáticamente por el useEffect
    } catch (err: unknown) {
      console.error('Google sign-in error:', err);
      const msg = err instanceof Error ? err.message : 'Error al conectar con Google';
      setError(getFriendlyFirebaseErrorMessage(msg));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetSuccessMessage(null);

    if (mode === 'forgot') {
      if (!email.trim()) {
        setError('Por favor ingresa tu correo para recuperar la contraseña.');
        return;
      }

      setIsSubmitting(true);
      try {
        await resetPassword(email.trim());
        setResetSuccessMessage(`Enlace enviado a ${email.trim()}. Revisa tu bandeja de entrada o spam.`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al enviar recuperación';
        setError(getFriendlyFirebaseErrorMessage(msg));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!email || !password) {
      setError('Por favor ingresa tu correo y contraseña.');
      return;
    }

    if (mode === 'signup' && !acceptedTerms) {
      setError('Debes aceptar los términos y condiciones de la plataforma para registrarte.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signup') {
        if (!displayName.trim()) {
          setError('Por favor ingresa tu nombre completo.');
          setIsSubmitting(false);
          return;
        }
        await registerWithEmail(email.trim(), password, displayName.trim());
      } else {
        await loginWithEmail(email.trim(), password);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error de autenticación';
      setError(getFriendlyFirebaseErrorMessage(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#07090e] text-white select-none">
      {/* Luces de fondo ambient modernas */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-amber-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Cabecera / Identidad */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-[#090d16] border border-amber-400/40 p-2 mb-3 shadow-xl shadow-amber-400/15 backdrop-blur-md">
            <img src="/logo.svg" alt="Nightlife SaaS Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <span>Nightlife POS & SaaS</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Plataforma Multi-tenant para Bares, Discotecas y Gastrobars</p>
        </div>

        {/* Tarjeta Principal de Login */}
        <div className="bg-[#0e1422]/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl">
          {/* Selector de Modo: Iniciar Sesión / Crear Cuenta */}
          {mode !== 'forgot' && (
            <div className="flex rounded-xl bg-[#07090e] p-1 mb-5 border border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setResetSuccessMessage(null);
                }}
                className={`flex-1 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/25 scale-[1.01]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setResetSuccessMessage(null);
                }}
                className={`flex-1 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/25 scale-[1.01]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Crear Cuenta
              </button>
            </div>
          )}

          <div className="text-center mb-5">
            <h2 className="text-lg font-black text-white">
              {mode === 'signin'
                ? 'Acceso a la Plataforma'
                : mode === 'signup'
                ? 'Registro de Nuevo Usuario'
                : 'Recuperar Contraseña'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {mode === 'signin'
                ? 'Ingresa con tu cuenta de Google o con correo'
                : mode === 'signup'
                ? 'Registra tu perfil empresarial para ser asignado'
                : 'Ingresa tu correo para recibir el enlace seguro'}
            </p>
          </div>

          {/* Notificaciones y Errores */}
          {error && (
            <div className="p-3 text-xs rounded-xl bg-rose-950/70 border border-rose-800/80 text-rose-300 flex items-start gap-2.5 mb-4 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {resetSuccessMessage && (
            <div className="p-3 text-xs rounded-xl bg-emerald-950/70 border border-emerald-800/80 text-emerald-300 flex items-start gap-2.5 mb-4 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <div className="leading-relaxed">{resetSuccessMessage}</div>
            </div>
          )}

          {/* ─── BOTÓN PRINCIPAL: ACCESO CON GOOGLE (CON SELECCIÓN Y CONSENTIMIENTO) ─── */}
          {mode !== 'forgot' && (
            <div className="space-y-3 mb-5">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading || isSubmitting}
                className="w-full py-3 px-4 bg-white hover:bg-slate-100 active:scale-[0.99] disabled:opacity-50 text-slate-900 rounded-xl text-xs font-black flex items-center justify-center gap-3 transition shadow-lg shadow-white/5 cursor-pointer border border-slate-200"
              >
                {isGoogleLoading ? (
                  <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.7 1 4 3.5 2.2 7.1l3.7 2.8C6.8 7.3 9.2 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M22.6 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h6c-.3 1.4-1 2.5-2.2 3.3v2.8h3.6c2.1-1.9 3.2-4.7 3.2-8.1z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.9 14.1c-.2-.7-.3-1.4-.3-2.1s.1-1.4.3-2.1V7.1H2.2C1.4 8.6 1 10.2 1 12s.4 3.4 1.2 4.9l3.7-2.8z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.3 1.1-3.7 1.1-2.8 0-5.2-1.9-6.1-4.5H2.2v2.8C4 20.5 7.7 23 12 23z"
                    />
                  </svg>
                )}
                <span>
                  {isGoogleLoading
                    ? 'Conectando con Google...'
                    : mode === 'signin'
                    ? 'Continuar con Google'
                    : 'Registrarse con Google'}
                </span>
              </button>

              {/* Guía informativa de los 2 pasos de Google */}
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="leading-tight">
                  <span className="text-slate-300 font-bold">Autenticación Segura de Google:</span>
                  <div className="text-[10px] text-slate-400 mt-0.5 space-y-0.5">
                    <p>• <strong>Paso 1:</strong> Elige tu cuenta o ingresa tu correo de Gmail.</p>
                    <p>• <strong>Paso 2:</strong> Acepta los permisos de verificación para ingresar.</p>
                  </div>
                </div>
              </div>

              {/* Separador elegante */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-[#0e1422] px-3 text-slate-500 font-bold tracking-wider">
                    O con correo y contraseña
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ─── FORMULARIO DE CORREO Y CONTRASEÑA ─── */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Daniel Buitrago"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-[#07090e] border border-slate-700/80 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="nombre@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#07090e] border border-slate-700/80 focus:border-amber-400 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300">Contraseña</label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setError(null);
                        setResetSuccessMessage(null);
                      }}
                      className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#07090e] border border-slate-700/80 focus:border-amber-400 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition"
                  />
                </div>
              </div>
            )}

            {/* Paso de Consentimiento y Aceptación de Términos */}
            {mode !== 'forgot' && (
              <label className="flex items-start gap-2.5 pt-1 cursor-pointer group">
                <div
                  onClick={() => setAcceptedTerms(!acceptedTerms)}
                  className={`w-4 h-4 mt-0.5 rounded-md border flex items-center justify-center transition shrink-0 ${
                    acceptedTerms
                      ? 'bg-amber-400 border-amber-400 text-slate-950 font-black'
                      : 'border-slate-600 bg-slate-900 group-hover:border-slate-400'
                  }`}
                >
                  {acceptedTerms && <Check size={11} strokeWidth={3.5} />}
                </div>
                <span className="text-[11px] text-slate-400 leading-tight">
                  Acepto los términos de servicio, políticas de acceso seguro y asignación multi-tenant de la plataforma.
                </span>
              </label>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isGoogleLoading}
              className="w-full py-2.5 mt-2 bg-amber-400 hover:bg-amber-300 active:scale-[0.99] disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : mode === 'signin' ? (
                <>
                  <span>Iniciar Sesión</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : mode === 'signup' ? (
                <>
                  <span>Crear Cuenta</span>
                  <UserPlus className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Enviar Enlace</span>
                  <KeyRound className="w-4 h-4" />
                </>
              )}
            </button>

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setResetSuccessMessage(null);
                }}
                className="w-full py-2 text-xs text-slate-400 hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Volver al inicio de sesión
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
