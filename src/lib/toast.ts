import { toast } from 'react-toastify';

export function toastOk(message: string) {
  toast.success(message);
}

export function toastErr(message: string, toastId?: string) {
  toast.error(message || 'Something went wrong.', toastId ? { toastId } : undefined);
}

export function toastInfo(message: string) {
  toast.info(message);
}
