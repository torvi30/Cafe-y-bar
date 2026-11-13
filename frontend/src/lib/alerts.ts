import Swal, { SweetAlertOptions } from 'sweetalert2';

// Instancia base personalizada con el estilo oscuro y dorado de la plataforma
const DarkSwal = Swal.mixin({
  background: '#0e1422',
  color: '#f8fafc',
  backdrop: 'rgba(7, 9, 14, 0.75)',
  customClass: {
    popup: 'border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl',
    title: 'text-lg font-black text-white',
    htmlContainer: 'text-xs text-slate-300 font-medium leading-relaxed',
    confirmButton:
      'px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-amber-400 hover:bg-amber-300 text-slate-950 transition shadow-lg shadow-amber-400/20 active:scale-95 cursor-pointer mx-1',
    cancelButton:
      'px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-300 transition active:scale-95 cursor-pointer mx-1',
  },
  buttonsStyling: false,
});

// Toast flotante no intrusivo en la esquina superior derecha
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: '#0e1422',
  color: '#f8fafc',
  customClass: {
    popup: 'border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl text-xs font-bold p-3',
  },
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  },
});

/**
 * Muestra una alerta de éxito
 */
export const notifySuccess = (title: string, text?: string) => {
  return DarkSwal.fire({
    icon: 'success',
    title,
    text,
    iconColor: '#10b981',
    confirmButtonText: 'Aceptar',
  });
};

/**
 * Muestra una alerta de error
 */
export const notifyError = (title: string, text?: string) => {
  return DarkSwal.fire({
    icon: 'error',
    title,
    text,
    iconColor: '#f43f5e',
    confirmButtonText: 'Entendido',
  });
};

/**
 * Muestra una alerta de advertencia
 */
export const notifyWarning = (title: string, text?: string) => {
  return DarkSwal.fire({
    icon: 'warning',
    title,
    text,
    iconColor: '#f59e0b',
    confirmButtonText: 'Continuar',
  });
};

/**
 * Diálogo de confirmación interactivo
 */
export const confirmAction = async (options: {
  title: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
}): Promise<boolean> => {
  const result = await DarkSwal.fire({
    icon: 'question',
    title: options.title,
    text: options.text,
    iconColor: options.isDangerous ? '#f43f5e' : '#f59e0b',
    showCancelButton: true,
    confirmButtonText: options.confirmText || 'Confirmar',
    cancelButtonText: options.cancelText || 'Cancelar',
    reverseButtons: true,
    customClass: {
      popup: 'border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl',
      title: 'text-lg font-black text-white',
      htmlContainer: 'text-xs text-slate-300 font-medium leading-relaxed',
      confirmButton: options.isDangerous
        ? 'px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white transition shadow-lg shadow-rose-600/25 active:scale-95 cursor-pointer mx-1'
        : 'px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-amber-400 hover:bg-amber-300 text-slate-950 transition shadow-lg shadow-amber-400/20 active:scale-95 cursor-pointer mx-1',
      cancelButton:
        'px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-300 transition active:scale-95 cursor-pointer mx-1',
    },
  });

  return result.isConfirmed;
};

/**
 * Toasts rápidos no intrusivos
 */
export const toastSuccess = (title: string) => {
  Toast.fire({
    icon: 'success',
    title,
    iconColor: '#10b981',
  });
};

export const toastError = (title: string) => {
  Toast.fire({
    icon: 'error',
    title,
    iconColor: '#f43f5e',
  });
};

export const toastInfo = (title: string) => {
  Toast.fire({
    icon: 'info',
    title,
    iconColor: '#38bdf8',
  });
};

export default DarkSwal;

