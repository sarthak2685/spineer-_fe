import { createContext, ReactNode, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { digitsOnly } from '../lib/mobile';

export type PageMeta = { title: string; text?: string; gold?: boolean; kicker?: string; actions?: ReactNode };
export const PageMetaContext = createContext<((meta: PageMeta | null) => void) | null>(null);

const FormPendingContext = createContext(false);

type FormSubmit = NonNullable<React.FormHTMLAttributes<HTMLFormElement>['onSubmit']>;

export function Form({ onSubmit, children, ...props }: React.FormHTMLAttributes<HTMLFormElement>) {
  const [pending, setPending] = useState(false);
  async function submit(event: Parameters<FormSubmit>[0]) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    try { await onSubmit?.(event); }
    finally { setPending(false); }
  }
  return (
    <form
      {...props}
      onSubmit={submit}
      onInvalidCapture={(event) => {
        const field = event.target;
        if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement)) return;
        event.preventDefault();
        void import('../lib/toast').then(({ toastErr }) => toastErr(field.validationMessage || 'Please fill the required fields.', 'form-invalid'));
      }}
    >
      <FormPendingContext.Provider value={pending}>{children}</FormPendingContext.Provider>
    </form>
  );
}

export function Button({ children, kind = 'primary', className = '', busy = false, disabled, onClick, type, ...props }: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> & { kind?: 'primary' | 'ghost' | 'danger' | 'soft'; busy?: boolean; onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<unknown> }) {
  const formPending = useContext(FormPendingContext);
  const [clickPending, setClickPending] = useState(false);
  const waiting = busy || clickPending || (formPending && type !== 'button');
  const styles = {
    primary: '!bg-orange-600 !text-white shadow-md shadow-orange-600/20 hover:!bg-orange-700',
    ghost: 'border-2 border-stone-300 !bg-white !text-stone-950 hover:!bg-orange-50',
    danger: '!bg-rose-600 !text-white hover:!bg-rose-700',
    soft: '!bg-orange-100 !text-orange-700 hover:!bg-orange-200',
  }[kind];
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || waiting}
      onClick={async (event) => {
        if (!onClick) return;
        const result = onClick(event);
        if (result && typeof (result as Promise<unknown>).then === 'function') {
          setClickPending(true);
          try { await result; } finally { setClickPending(false); }
        }
      }}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-600/20 disabled:cursor-wait disabled:opacity-70 ${styles} ${className}`}
    >
      {waiting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />}
      {children}
    </button>
  );
}

const actionMarks: Record<string, ReactNode> = {
  manage: <path d="M5 12h14M13 6l6 6-6 6" />,
  pause: <><path d="M9 6v12" /><path d="M15 6v12" /></>,
  play: <path d="M8 5.5v13l11-6.5-11-6.5z" />,
  open: <><path d="M14 5h5v5" /><path d="M19 5l-8 8" /><path d="M16 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h5" /></>,
  edit: <><path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3z" /><path d="M13 7l4 4" /></>,
  trash: <><path d="M4 7h16" /><path d="M9 7V5h6v2" /><path d="M7 7l1 13h8l1-13" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  clock: <><circle cx="12" cy="12" r="8" /><path d="M12 8v5l3 2" /></>,
  ban: <><circle cx="12" cy="12" r="8" /><path d="M7 7l10 10" /></>,
  flag: <path d="M6 4v16M6 5h11l-2 4 2 4H6" />,
};

export function ActionIcon({ name }: { name: keyof typeof actionMarks }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {actionMarks[name]}
    </svg>
  );
}

export function IconButton({ label, className = '', children, ...props }: React.ComponentProps<typeof Button> & { label: string }) {
  return <Button aria-label={label} title={label} className={`!h-8 !w-8 !rounded-full !px-0 ${className}`} {...props}>{children}</Button>;
}

export function RowMenu({ items }: { items: { label: string; to?: string; danger?: boolean; onClick?: () => void | Promise<unknown> }[] }) {
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const list = items.filter((item) => item.label);
  function place() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = 176;
    const left = Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8));
    const height = list.length * 40 + 8;
    const below = rect.bottom + 6;
    const top = below + height > window.innerHeight ? Math.max(8, rect.top - height - 6) : below;
    setBox({ top, left });
  }
  useEffect(() => {
    if (!open) return undefined;
    function shut(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (buttonRef.current?.contains(target)) return;
      if (target.closest?.('[data-row-menu]')) return;
      setOpen(false);
    }
    function hide() { setOpen(false); }
    document.addEventListener('mousedown', shut);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    return () => {
      document.removeEventListener('mousedown', shut);
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
    };
  }, [open]);
  if (!list.length) return null;
  return (
    <>
      <button ref={buttonRef} type="button" aria-label="Actions" aria-expanded={open} className="grid h-8 w-8 place-items-center rounded-full text-stone-600 transition hover:bg-white hover:text-stone-950" onClick={() => { if (!open) place(); setOpen((value) => !value); }}>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="19" r="1.6" /></svg>
      </button>
      {open && createPortal(
        <div data-row-menu className="fixed z-[80] w-44 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-xl shadow-stone-950/10" style={{ top: box.top, left: box.left }}>
          {list.map((item) => item.to ? (
            <Link key={item.label} to={item.to} className="block px-3 py-2 text-left text-sm font-medium text-stone-800 hover:bg-orange-50" onClick={() => setOpen(false)}>{item.label}</Link>
          ) : (
            <button key={item.label} type="button" className={`block w-full px-3 py-2 text-left text-sm font-medium hover:bg-orange-50 ${item.danger ? 'text-rose-600' : 'text-stone-800'}`} onClick={() => { setOpen(false); void item.onClick?.(); }}>{item.label}</button>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}

export function IconLink({ to, label, kind = 'primary', children }: { to: string; label: string; kind?: 'primary' | 'ghost'; children: ReactNode }) {
  const styles = kind === 'primary'
    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20 hover:bg-orange-700'
    : 'border border-stone-200 bg-white text-stone-950 hover:bg-orange-100';
  return <Link to={to} aria-label={label} title={label} className={`inline-flex !h-8 !w-8 items-center justify-center !rounded-full !px-0 ${styles}`}>{children}</Link>;
}

export function Field({ label, className = '', type, inputMode, onChange, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const [visible, setVisible] = useState(false);
  const password = type === 'password';
  const digits = inputMode === 'numeric' || inputMode === 'tel' || type === 'tel';
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (digits) event.target.value = digitsOnly(event.target.value);
    onChange?.(event);
  }
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-stone-500">{label}</span>
      <span className="relative block">
        <input {...props} type={password && visible ? 'text' : type} inputMode={inputMode} onChange={handleChange} className={`h-11 w-full rounded-xl border border-stone-200 bg-white px-3.5 text-sm outline-none ring-orange-600/20 transition focus:border-orange-600 focus:ring-4 ${password ? 'pr-11' : ''} ${className}`} />
        {password && (
          <button type="button" className="!absolute !right-2 !top-1/2 z-20 grid h-8 w-8 !-translate-y-1/2 place-items-center text-stone-400 hover:text-stone-700" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible((current) => !current)}>
            {visible ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 3l18 18" /><path d="M10.6 10.6A2 2 0 0 0 12 14a2 2 0 0 0 1.4-.6" /><path d="M9.9 5.1A10.8 10.8 0 0 1 12 5c5 0 9.3 3.1 11 7-1 2.2-2.6 4.1-4.6 5.4M6.1 6.1C4.2 7.4 2.6 9.2 1.6 11.4 3.3 15.9 7.6 19 12.6 19c1.3 0 2.5-.2 3.6-.6" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
            )}
          </button>
        )}
      </span>
    </label>
  );
}

export function Area({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return <label className="block text-sm"><span className="mb-1.5 block font-medium text-stone-500">{label}</span><textarea {...props} className="min-h-[88px] w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm outline-none ring-orange-600/20 focus:border-orange-600 focus:ring-4" /></label>;
}

export function Select({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return <label className="block text-sm"><span className="mb-1.5 block font-medium text-stone-500">{label}</span><select {...props} className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none ring-orange-600/20 focus:border-orange-600 focus:ring-4">{children}</select></label>;
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`h-full rounded-3xl border border-stone-200 bg-white p-5 shadow-sm ${className}`}>{children}</section>;
}

export function Stat({ label, value, gold = false }: { label: string; value: string | number; gold?: boolean }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-orange-600/10" />
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-600">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tracking-tight ${gold ? 'text-amber-500' : 'text-stone-950'}`}>{value}</p>
    </section>
  );
}

export function Status({ value }: { value: string }) {
  const tone: Record<string, string> = {
    Pending: 'bg-amber-50 text-amber-700',
    Accepted: 'bg-sky-50 text-sky-700',
    Preparing: 'bg-indigo-50 text-indigo-700',
    Ready: 'bg-emerald-50 text-emerald-700',
    Completed: 'bg-emerald-600 text-white',
    Approved: 'bg-emerald-600 text-white',
    Redeemed: 'bg-emerald-600 text-white',
    Active: 'bg-emerald-50 text-emerald-700',
    Inactive: 'bg-stone-100 text-stone-600',
    Cancelled: 'bg-rose-50 text-rose-700',
    Rejected: 'bg-rose-50 text-rose-700',
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tone[value] || 'bg-stone-100 text-stone-600'}`}>{value}</span>;
}

export function Empty({ text, action }: { text: string; action?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-stone-200 px-4 py-10 text-center text-sm text-stone-500">
      <p>{text}</p>
      {action ? <div className="mt-3 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Alert({ text }: { text: string }) {
  return <p className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{text}</p>;
}

export function PageTitle({ title, text, gold = false, kicker, actions }: { title: string; text?: string; gold?: boolean; kicker?: string; actions?: ReactNode }) {
  const setMeta = useContext(PageMetaContext);
  useLayoutEffect(() => {
    if (!setMeta) return undefined;
    setMeta({ title, text, gold, kicker, actions });
    return () => setMeta(null);
  }, [setMeta, title, text, gold, kicker, actions]);
  if (setMeta) return null;
  return (
    <header className="mb-6 flex items-start justify-between gap-4">
      <div>
        {kicker && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">{kicker}</p>}
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {text && <p className={`mt-1.5 max-w-2xl text-sm ${gold ? 'font-semibold text-amber-500' : 'text-stone-500'}`}>{text}</p>}
      </div>
      {actions}
    </header>
  );
}

export function Table({ columns, rows, empty = 'Nothing here yet.', variant = 'rows', title, toolbar }: { columns: { key: string; label: string; render?: (row: any) => ReactNode }[]; rows?: any[] | null; empty?: string; variant?: 'rows' | 'card'; title?: ReactNode; toolbar?: ReactNode }) {
  const list = Array.isArray(rows) ? rows : [];
  const cardHead = (title || toolbar) ? (
    <div className="flex flex-col gap-3 border-b border-stone-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      {title && <div className={`min-w-0 text-base font-semibold text-stone-950 ${toolbar ? '' : 'flex-1'}`}>{title}</div>}
      {toolbar && <div className="min-w-0 flex-1">{toolbar}</div>}
    </div>
  ) : null;
  if (!list.length) {
    if (variant === 'card') {
      return (
        <section className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm">
          {cardHead}
          <p className="px-6 py-16 text-center text-sm font-medium text-stone-500">{empty}</p>
        </section>
      );
    }
    return (
      <div className="rounded-[28px] border border-dashed border-orange-200/80 bg-white/80 px-6 py-16 text-center">
        <p className="text-sm font-medium text-stone-500">{empty}</p>
      </div>
    );
  }
  const rowKey = (row: any, index: number) => row.id || row.businessid || row.businesstypeid || row.customerid || row.orderid || row.rewardid || row.gameplayid || row.customernotificationid || row.purchaseclaimid || row.rewardredemptionid || row.wallettransactionid || row.categoryid || row.itemid || index;
  const heading = (column: { key: string; label: string }) => column.key === 'actions' ? (column.label || 'Actions') : column.label;
  const cell = (column: { key: string; render?: (row: any) => ReactNode }, row: any) => column.key === 'actions'
    ? <div className="inline-flex max-w-full flex-wrap items-center justify-end gap-1 rounded-full bg-orange-50 p-1 ring-1 ring-orange-100">{column.render?.(row)}</div>
    : (column.render ? column.render(row) : row[column.key] ?? '—');
  const edge = (index: number) => {
    if (index === 0) return 'rounded-l-2xl border-l';
    if (index === columns.length - 1) return 'rounded-r-2xl border-r';
    return '';
  };
  const phoneRows = (articleClass: string) => list.map((row, index) => {
    const fields = columns.filter((column) => column.key !== 'actions');
    const actions = columns.filter((column) => column.key === 'actions');
    const [lead, ...rest] = fields;
    return (
      <article key={rowKey(row, index)} className={articleClass}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {lead && <div className="text-sm font-semibold text-stone-950">{lead.render ? lead.render(row) : row[lead.key] ?? '—'}</div>}
            {rest.length > 0 && (
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-stone-500">
                {rest.map((column, columnIndex) => (
                  <span key={column.key} className="inline-flex max-w-full items-center gap-2">
                    {columnIndex > 0 && <span className="text-stone-300" aria-hidden="true">·</span>}
                    <span className="min-w-0 break-words">{column.render ? column.render(row) : row[column.key] ?? '—'}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
          {actions.length > 0 && (
            <div className="flex shrink-0 items-center gap-1">
              {actions.map((column) => <div key={column.key}>{column.render?.(row)}</div>)}
            </div>
          )}
        </div>
      </article>
    );
  });
  if (variant === 'card') {
    return (
      <section className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm">
        {cardHead}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-stone-100 bg-orange-50/70">
                {columns.map((column) => (
                  <th key={column.key} className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400 ${column.key === 'actions' ? 'text-right' : ''}`}>
                    {heading(column)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((row, index) => (
                <tr key={rowKey(row, index)} className="border-b border-stone-100 last:border-b-0 hover:bg-orange-50/70">
                  {columns.map((column, columnIndex) => (
                    <td key={column.key} className={`px-5 py-3.5 align-middle text-sm text-stone-600 ${column.key === 'actions' ? 'text-right' : ''} ${columnIndex === 0 ? 'font-semibold text-stone-950' : ''}`}>
                      {cell(column, row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid gap-3 p-3 md:hidden">{phoneRows('rounded-2xl bg-orange-50/70 p-4')}</div>
      </section>
    );
  }
  return (
    <div className="rounded-[28px] bg-orange-50/70 p-2 sm:p-3">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] border-separate border-spacing-x-0 border-spacing-y-2 text-left">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={`px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400 ${column.key === 'actions' ? 'text-right' : ''}`}>
                  {heading(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((row, index) => (
              <tr key={rowKey(row, index)} className="group">
                {columns.map((column, columnIndex) => (
                  <td key={column.key} className={`border-y border-white bg-white px-4 py-3.5 align-middle text-sm text-stone-600 shadow-sm shadow-orange-900/5 transition group-hover:border-orange-100 group-hover:bg-orange-50/50 ${edge(columnIndex)} ${column.key === 'actions' ? 'text-right' : ''} ${columnIndex === 0 ? 'font-semibold text-stone-950' : ''}`}>
                    {cell(column, row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 md:hidden">{phoneRows('rounded-2xl border border-white bg-white p-4 shadow-sm shadow-orange-900/5')}</div>
    </div>
  );
}

export function Quick({ to, title, text }: { to: string; title: string; text: string }) {
  return (
    <Link to={to} className="group rounded-3xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-600 hover:shadow-lg">
      <p className="font-semibold text-stone-950 group-hover:text-orange-600">{title}</p>
      <p className="mt-1 text-sm text-stone-500">{text}</p>
    </Link>
  );
}

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" aria-label="Repeatmate" className="inline-flex min-w-0 items-center gap-1.5 sm:gap-2">
      <img src="/icons/logo%20.png" alt="" className={`h-8 w-8 shrink-0 object-contain sm:h-9 sm:w-9 ${light ? 'rounded-full bg-white' : ''}`} />
      <span className={`truncate font-display text-lg font-extrabold leading-none tracking-[-0.05em] sm:text-xl ${light ? 'text-white' : 'text-stone-950'}`}>
        Repeat<span className="text-[#FF5A1F]">mate</span>
      </span>
    </Link>
  );
}

export function Modal({ title, text, onClose, children, wide = false }: { title: string; text?: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);
  return createPortal(
    <div className="fixed inset-0 z-[80] flex h-dvh flex-col bg-white sm:grid sm:place-items-center sm:bg-transparent sm:p-6">
      <button type="button" className="absolute inset-0 hidden bg-stone-900/50 sm:block" onClick={onClose} aria-label="Close" />
      <div className={`relative flex h-full min-h-0 w-full flex-col bg-white sm:h-auto sm:max-h-[min(92dvh,40rem)] sm:rounded-3xl sm:shadow-2xl ${wide ? 'sm:max-w-xl' : 'sm:max-w-md'}`}>
        <div className="flex items-start justify-between gap-3 border-b border-stone-100 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
          <div><h2 className="font-display text-xl font-semibold tracking-tight text-stone-950">{title}</h2>{text && <p className="mt-1 text-sm text-stone-500">{text}</p>}</div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-stone-100 text-lg text-stone-600 transition hover:bg-stone-200">×</button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 [&_button]:relative [&_button]:z-10">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
