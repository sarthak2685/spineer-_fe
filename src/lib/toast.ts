import { createElement, ReactNode } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

type ToastExtra = { id?: string; title?: string; detail?: string; href?: string };

function note(message: string, extra?: ToastExtra): ReactNode {
  if (!extra?.title && !extra?.href) return message;
  const children: ReactNode[] = [];
  if (extra.title) children.push(createElement('span', { key: 'title', className: 'block font-semibold text-stone-950' }, extra.title));
  children.push(createElement('span', { key: 'detail', className: `block ${extra.title ? 'mt-0.5 font-medium text-stone-600' : 'font-semibold text-stone-950'}` }, extra.detail || message));
  if (extra.href) {
    children.push(createElement(Link, { key: 'open', to: extra.href, className: 'mt-1.5 inline-flex text-sm font-semibold text-orange-600', onClick: (event: { stopPropagation: () => void }) => event.stopPropagation() }, 'Open'));
  }
  return createElement('span', { className: 'block min-w-0' }, children);
}

export function toastOk(message: string, extra?: ToastExtra) {
  toast.success(note(message, extra), { autoClose: 3600, toastId: extra?.id });
}

export function toastErr(message: string, toastId?: string) {
  toast.error(message || 'Something went wrong.', { autoClose: false, toastId });
}

export function toastInfo(message: string, toastId?: string, extra?: ToastExtra) {
  toast.info(note(message, extra), { autoClose: 3600, toastId: toastId || extra?.id });
}
