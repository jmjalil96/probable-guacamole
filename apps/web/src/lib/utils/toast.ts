import { toast as sonnerToast } from "sonner";

type ToastOptions = {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export const toast = {
  success: (message: string, options?: ToastOptions) => {
    sonnerToast.success(message, {
      description: options?.description,
      duration: options?.duration ?? 4000,
      action: options?.action,
    });
  },

  error: (message: string, options?: ToastOptions) => {
    sonnerToast.error(message, {
      description: options?.description,
      duration: options?.duration ?? 6000,
      action: options?.action,
    });
  },

  warning: (message: string, options?: ToastOptions) => {
    sonnerToast.warning(message, {
      description: options?.description,
      duration: options?.duration ?? 5000,
      action: options?.action,
    });
  },

  info: (message: string, options?: ToastOptions) => {
    sonnerToast.info(message, {
      description: options?.description,
      duration: options?.duration ?? 4000,
      action: options?.action,
    });
  },

  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => {
    return sonnerToast.promise(promise, messages);
  },

  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },
};
