import { createElement, ReactNode } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { friendlyError } from './errors';

type ToastExtra = {
  id?: string;
  title?: string;
  detail?: string;
  href?: string;
  /** Stop sound/nag but keep navigating (used by Open). */
  onOpen?: () => void;
  onSilence?: () => void;
  autoClose?: number | false;
};

function note(message: string, extra?: ToastExtra): ReactNode {
  if (!extra?.title && !extra?.href && !extra?.onSilence) return message;
  const children: ReactNode[] = [];
  if (extra.title) children.push(createElement('span', { key: 'title', className: 'block font-semibold text-stone-950' }, extra.title));
  children.push(createElement('span', { key: 'detail', className: `block ${extra.title ? 'mt-0.5 font-medium text-stone-600' : 'font-semibold text-stone-950'}` }, extra.detail || message));
  if (extra.href || extra.onSilence) {
    const actions: ReactNode[] = [];
    if (extra.href) {
      actions.push(createElement(Link, {
        key: 'open',
        to: extra.href,
        className: 'inline-flex text-sm font-semibold text-orange-600',
        onClick: (event: { stopPropagation: () => void }) => {
          event.stopPropagation();
          // Stop chime without dismissing mid-tap (safer on iOS).
          extra.onOpen?.();
        },
      }, 'Open'));
    }
    if (extra.onSilence) {
      actions.push(createElement('button', {
        key: 'silence',
        type: 'button',
        className: 'inline-flex min-h-11 items-center text-sm font-semibold text-stone-600 hover:text-stone-950',
        onClick: (event: { stopPropagation: () => void }) => {
          event.stopPropagation();
          extra.onSilence?.();
          toast.dismiss(extra.id || 'new-order');
        },
      }, 'Silence'));
    }
    children.push(createElement('span', { key: 'actions', className: 'mt-1.5 flex flex-wrap items-center gap-3' }, actions));
  }
  return createElement('span', { className: 'block min-w-0' }, children);
}

const AUTO_CLOSE_MS = 3000;

export function toastOk(message: string, extra?: ToastExtra) {
  toast.success(note(message, extra), { autoClose: extra?.autoClose ?? AUTO_CLOSE_MS, toastId: extra?.id });
}

export function toastErr(message: string, toastId?: string) {
  toast.error(friendlyError(message), { autoClose: AUTO_CLOSE_MS, toastId });
}

export function toastInfo(message: string, toastId?: string, extra?: ToastExtra) {
  toast.info(note(message, extra), {
    autoClose: extra?.autoClose ?? AUTO_CLOSE_MS,
    toastId: toastId || extra?.id,
  });
}

export function dismissToast(id: string) {
  toast.dismiss(id);
}
