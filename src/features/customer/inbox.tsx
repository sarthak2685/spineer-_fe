import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { api } from '../../api/client';
import { Button, Empty, PageTitle } from '../../components/ui';

export type Notice = {
  customernotificationid: number;
  title: string;
  message: string;
  notificationtype: string;
  isread: boolean;
  createddate?: string;
  businessid?: number | null;
  businessname?: string | null;
  publicslug?: string | null;
  businesstoken?: string | null;
};

export const noticeFilters = [
  { id: 'All', label: 'All' },
  { id: 'Unread', label: 'Unread' },
  { id: 'Offer', label: 'Offers' },
  { id: 'RewardUpdate', label: 'Rewards' },
  { id: 'PurchaseApproval', label: 'Claims' },
  { id: 'CoinExpiry', label: 'Coins' },
  { id: 'OrderUpdate', label: 'Orders' },
];

const primaryFilterIds = ['All', 'Unread', 'OrderUpdate', 'Offer'] as const;
const moreFilterIds = ['PurchaseApproval', 'CoinExpiry', 'RewardUpdate'] as const;

const InboxCountContext = createContext<{ count: number; bump: number; setCount: (count: number) => void }>({ count: 0, bump: 0, setCount: () => undefined });

export function InboxCountProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState({ count: 0, bump: 0 });
  const setCount = useCallback((count: number) => {
    setState((prev) => (prev.count === count ? prev : { count, bump: count > prev.count ? prev.bump + 1 : prev.bump }));
  }, []);
  return <InboxCountContext.Provider value={{ ...state, setCount }}>{children}</InboxCountContext.Provider>;
}

export function useInboxCount() {
  return useContext(InboxCountContext);
}

/** Prefer the shop that sent the notice; fall back to generic customer pages. */
export function noticePath(row: Pick<Notice, 'notificationtype' | 'businessid' | 'publicslug' | 'businesstoken'> | string | undefined) {
  const type = typeof row === 'string' || row === undefined ? row : row.notificationtype;
  const token = typeof row === 'object' && row
    ? String(row.publicslug || row.businesstoken || '').trim()
    : '';
  const businessId = typeof row === 'object' && row ? Number(row.businessid) : NaN;

  if (token) {
    if (type === 'Offer' || type === 'RewardUpdate') return `/play/${token}#offers`;
    if (type === 'OrderUpdate') return `/menu/${token}`;
    if (type === 'PurchaseApproval' || type === 'CoinExpiry') return `/play/${token}`;
    return `/play/${token}`;
  }
  if (Number.isFinite(businessId) && businessId > 0) return `/customer/business/${businessId}`;

  if (type === 'Offer') return '/customer/offers';
  if (type === 'OrderUpdate') return '/customer/my-orders';
  if (type === 'RewardUpdate') return '/customer/rewards';
  if (type === 'PurchaseApproval') return '/customer/purchase-claims';
  if (type === 'CoinExpiry') return '/customer/wallet';
  return '/customer/notifications';
}

export function noticeLabel(type?: string) {
  return noticeFilters.find((item) => item.id === type)?.label || 'Update';
}

export function noticeWhen(value?: string) {
  if (!value) return '';
  const then = new Date(value);
  const time = then.getTime();
  if (!Number.isFinite(time)) return '';
  const delta = Date.now() - time;
  const hour = 60 * 60 * 1000;
  if (delta < hour) return `${Math.max(1, Math.floor(delta / 60000))}m`;
  if (delta < 24 * hour) return `${Math.floor(delta / hour)}h`;
  return then.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function noticeWhenTitle(value?: string) {
  if (!value) return undefined;
  const then = new Date(value);
  if (!Number.isFinite(then.getTime())) return undefined;
  return then.toLocaleString();
}

function noticeGroup(value?: string) {
  if (!value) return 'Earlier';
  const then = new Date(value);
  if (!Number.isFinite(then.getTime())) return 'Earlier';
  const start = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diff = start(new Date()) - start(then);
  if (diff <= 0) return 'Today';
  if (diff <= 24 * 60 * 60 * 1000) return 'Yesterday';
  return 'Earlier';
}

function NoticeIcon({ type }: { type?: string }) {
  const common = { viewBox: '0 0 24 24', className: 'h-4 w-4', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (type === 'Offer') return <svg {...common}><path d="M4 12V6h6l10 10-6 6z" /><circle cx="8.5" cy="8.5" r="1" fill="currentColor" stroke="none" /></svg>;
  if (type === 'OrderUpdate') return <svg {...common}><path d="M6 7h15l-1.5 9H8L6 7z" /><path d="M6 7 5 4H2" /></svg>;
  if (type === 'RewardUpdate') return <svg {...common}><circle cx="12" cy="12" r="8" /><path d="M12 8v8M9.5 10.5h5a1.5 1.5 0 0 1 0 3h-5" /></svg>;
  if (type === 'CoinExpiry') return <svg {...common}><circle cx="12" cy="12" r="8" /><path d="M12 8v4l2.5 1.5" /></svg>;
  if (type === 'PurchaseApproval') return <svg {...common}><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2H4.5z" /><path d="M10 19a2 2 0 0 0 4 0" /></svg>;
  return <svg {...common}><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2H4.5z" /><path d="M10 19a2 2 0 0 0 4 0" /></svg>;
}

function enterFrom(type: string) {
  if (type === 'Offer') return { x: 18, opacity: 0 };
  if (type === 'OrderUpdate') return { y: 16, opacity: 0 };
  if (type === 'RewardUpdate') return { scale: 0.94, opacity: 0 };
  if (type === 'CoinExpiry') return { opacity: 0 };
  return { y: 10, opacity: 0 };
}

function InboxFilterChip({ id, label, on, reduce, onPick }: { id: string; label: string; on: boolean; reduce: boolean | null; onPick: () => void }) {
  return (
    <button id={`inbox-filter-${id}`} type="button" onClick={onPick} className={`relative min-h-9 shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold ${on ? 'text-white' : 'text-stone-600'}`}>
      {on && !reduce && <motion.span layoutId="inbox-chip" className="absolute inset-0 rounded-full bg-orange-600" transition={{ type: 'spring', bounce: 0.18, duration: 0.4 }} />}
      {on && reduce && <span className="absolute inset-0 rounded-full bg-orange-600" />}
      {!on && <span className="absolute inset-0 rounded-full bg-white ring-1 ring-stone-200" />}
      <span className="relative z-10">{label}</span>
    </button>
  );
}

export function NoticeRow({ row, onRead, compact = false }: { row: Notice; onRead?: (id: number) => void; compact?: boolean }) {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [more, setMore] = useState(false);
  const [shift, setShift] = useState(0);
  const origin = useRef<number | null>(null);
  const moved = useRef(false);
  const unread = !row.isread;
  const whenTitle = noticeWhenTitle(row.createddate);

  function open() {
    if (moved.current) return;
    if (unread && !compact) onRead?.(row.customernotificationid);
    navigate(noticePath(row));
  }

  function markRead(event?: { stopPropagation: () => void }) {
    event?.stopPropagation();
    if (unread) onRead?.(row.customernotificationid);
    setShift(0);
  }

  return (
    <motion.article
      layout={!reduce}
      initial={reduce ? false : enterFrom(row.notificationtype)}
      animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
      exit={reduce ? undefined : { opacity: 0, y: -8 }}
      transition={{ type: 'spring', bounce: 0.18, duration: reduce ? 0 : 0.4 }}
      className="relative overflow-hidden rounded-2xl"
    >
      {unread && onRead && (
        <button type="button" className="absolute inset-y-0 right-0 flex w-28 items-center justify-center bg-orange-600 text-sm font-semibold text-white sm:hidden" onClick={() => markRead()}>
          Mark read
        </button>
      )}
      <div
        className={`relative flex items-start gap-3 border p-4 text-left shadow-sm transition-colors duration-300 touch-pan-y ${unread ? 'border-orange-200 bg-orange-50' : 'border-stone-200 bg-white'}`}
        style={{ transform: `translateX(${shift}px)`, transition: reduce || origin.current !== null ? 'none' : 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)' }}
        onPointerDown={(event) => {
          if (reduce || event.pointerType === 'mouse' || !unread || !onRead) return;
          origin.current = event.clientX;
          moved.current = false;
        }}
        onPointerMove={(event) => {
          if (origin.current === null) return;
          const dx = event.clientX - origin.current;
          if (Math.abs(dx) < 10) return;
          // Prefer vertical scroll: ignore mostly-vertical moves.
          if (Math.abs(event.movementY) > Math.abs(event.movementX) * 1.4) return;
          const next = Math.max(-112, Math.min(0, dx));
          if (Math.abs(next) > 8) moved.current = true;
          setShift(next);
        }}
        onPointerUp={() => {
          setShift((value) => (value < -56 ? -112 : 0));
          origin.current = null;
          window.setTimeout(() => { moved.current = false; }, 0);
        }}
        onPointerCancel={() => { origin.current = null; setShift(0); }}
      >
        <button type="button" onClick={open} className="flex min-w-0 flex-1 items-start gap-3 text-left">
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${unread ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-700'}`}>
            <NoticeIcon type={row.notificationtype} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-start justify-between gap-3">
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">{row.businessname || noticeLabel(row.notificationtype)}</span>
                <span className="mt-0.5 block font-semibold text-stone-950">{row.title}</span>
              </span>
              <span className="shrink-0 text-xs font-medium text-stone-400" title={whenTitle}>{noticeWhen(row.createddate)}</span>
            </span>
            <span className={`mt-1 block text-sm text-stone-500 ${more || compact ? '' : 'line-clamp-2'}`}>{row.message}</span>
          </span>
        </button>
        {!compact && (
          <span className="flex shrink-0 flex-col items-end gap-2">
            {row.message.length > 80 && (
              <button type="button" className="min-h-9 text-xs font-semibold text-orange-600" onClick={() => setMore((value) => !value)}>{more ? 'Less' : 'More'}</button>
            )}
            {unread && onRead && (
              <button type="button" className="min-h-9 rounded-full bg-orange-100 px-3 text-xs font-semibold text-orange-700" onClick={() => markRead()}>
                Mark read
              </button>
            )}
          </span>
        )}
      </div>
    </motion.article>
  );
}

function InboxSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading notifications">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="animate-pulse rounded-2xl border border-stone-200 bg-white p-4 motion-reduce:animate-none">
          <div className="flex gap-3">
            <div className="h-9 w-9 rounded-full bg-stone-100" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-24 rounded-full bg-stone-100" />
              <div className="h-4 w-3/4 rounded-full bg-stone-100" />
              <div className="h-3 w-full rounded-full bg-stone-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function NotificationsPage() {
  const reduce = useReducedMotion();
  const [rows, setRows] = useState<Notice[]>([]);
  const [filter, setFilter] = useState('All');
  const [moreOpen, setMoreOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const load = useCallback(async (next = filter) => {
    setLoading(true);
    try {
      const list = await api<Notice[]>(`/customer/notifications?filter=${next}`);
      setRows(list);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { void load(filter); }, [filter, load]);
  useEffect(() => {
    document.getElementById(`inbox-filter-${filter}`)?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }, [filter, reduce]);

  async function mark(id: number) {
    setRows((current) => current.map((row) => (row.customernotificationid === id ? { ...row, isread: true } : row)));
    if (filter === 'Unread') window.setTimeout(() => setRows((current) => current.filter((row) => row.customernotificationid !== id)), 240);
    await api(`/customer/notifications/${id}/read`, { method: 'POST' });
  }

  const markAll = useCallback(async () => {
    setRows((current) => current.map((row) => ({ ...row, isread: true })));
    if (filter === 'Unread') window.setTimeout(() => setRows([]), 240);
    await api('/customer/notifications/read-all', { method: 'POST' });
  }, [filter]);

  const showMarkAll = rows.some((row) => !row.isread);
  const headerAction = useMemo(
    () => (showMarkAll ? <span className="hidden sm:block"><Button kind="ghost" onClick={() => void markAll()}>Mark all read</Button></span> : null),
    [showMarkAll, markAll],
  );

  const groups = ['Today', 'Yesterday', 'Earlier'].map((name) => ({ name, rows: rows.filter((row) => noticeGroup(row.createddate) === name) })).filter((group) => group.rows.length);
  const emptyLabel = noticeFilters.find((item) => item.id === filter)?.label || 'items';
  const primaryFilters = noticeFilters.filter((item) => (primaryFilterIds as readonly string[]).includes(item.id));
  const moreFilters = noticeFilters.filter((item) => (moreFilterIds as readonly string[]).includes(item.id));
  const moreActive = moreFilters.some((item) => item.id === filter);

  return (
    <>
      <PageTitle title="Notifications" text="Inbox for shop offers and order updates." actions={headerAction} />
      <div className="mb-3 flex items-center justify-between gap-3 sm:hidden">
        <p className="text-sm text-stone-500">Shop offers and order updates.</p>
        {showMarkAll && <Button kind="ghost" onClick={markAll}>Mark all read</Button>}
      </div>
      <div className="relative mb-4">
        <div className="flex flex-wrap gap-2">
          {primaryFilters.map((item) => (
            <InboxFilterChip
              key={item.id}
              id={item.id}
              label={item.label}
              on={filter === item.id}
              reduce={reduce}
              onPick={() => { setMoreOpen(false); setFilter(item.id); }}
            />
          ))}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMoreOpen((open) => !open)}
              className={`relative min-h-9 shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold ${moreActive || moreOpen ? 'bg-orange-600 text-white' : 'bg-white text-stone-600 ring-1 ring-stone-200'}`}
              aria-expanded={moreOpen}
            >
              More{moreActive ? ` · ${noticeFilters.find((item) => item.id === filter)?.label}` : ''}
            </button>
            {moreOpen && (
              <div className="absolute left-0 top-full z-20 mt-2 flex min-w-[10rem] flex-col gap-1 rounded-2xl bg-white p-2 shadow-lg ring-1 ring-stone-200">
                {moreFilters.map((item) => (
                  <button
                    key={item.id}
                    id={`inbox-filter-${item.id}`}
                    type="button"
                    className={`rounded-xl px-3 py-2.5 text-left text-sm font-semibold ${filter === item.id ? 'bg-orange-50 text-orange-700' : 'text-stone-700 hover:bg-stone-50'}`}
                    onClick={() => { setFilter(item.id); setMoreOpen(false); }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div
        ref={scroller}
        onTouchStart={(event) => { if (window.scrollY <= 4) startY.current = event.touches[0].clientY; }}
        onTouchMove={(event) => {
          if (startY.current === null) return;
          const next = event.touches[0].clientY - startY.current;
          if (next > 0 && window.scrollY <= 4) setPull(Math.min(72, next * 0.45));
        }}
        onTouchEnd={() => {
          if (pull > 48) {
            setRefreshing(true);
            void load(filter).finally(() => setRefreshing(false));
          }
          setPull(0);
          startY.current = null;
        }}
      >
        <div className="overflow-hidden text-center text-xs font-semibold text-orange-600" style={{ height: pull || refreshing ? 28 : 0 }}>{refreshing ? 'Refreshing' : pull > 48 ? 'Release to refresh' : pull > 8 ? 'Pull to refresh' : ''}</div>
        {loading && !rows.length ? (
          <InboxSkeleton />
        ) : !rows.length ? (
          <Empty
            text={filter === 'All' ? 'Offers and order updates will show up here. Pull down to refresh.' : filter === 'Unread' ? 'No unread updates.' : `No ${emptyLabel.toLowerCase()}.`}
            action={filter === 'All' ? <Link to="/customer/explore" className="inline-flex h-10 items-center rounded-full bg-orange-600 px-4 text-sm font-semibold text-white">Find a shop</Link> : undefined}
          />
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <section key={group.name}>
                <p className="mb-2 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-stone-400">{group.name}</p>
                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {group.rows.map((row) => <NoticeRow key={row.customernotificationid} row={row} onRead={mark} />)}
                  </AnimatePresence>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export function LatestNotices() {
  const [rows, setRows] = useState<Notice[]>([]);
  useEffect(() => { api<Notice[]>('/customer/notifications?filter=Unread', { quiet: true }).then((list) => setRows(list.slice(0, 3))).catch(() => setRows([])); }, []);
  if (!rows.length) return null;
  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-stone-950">Latest updates</p>
        <Link to="/customer/notifications" className="text-sm font-semibold text-orange-600">Inbox</Link>
      </div>
      {rows.map((row) => <NoticeRow key={row.customernotificationid} row={row} compact />)}
    </div>
  );
}

export function LatestInboxLink() {
  const [row, setRow] = useState<Notice | null>(null);
  useEffect(() => { api<Notice[]>('/customer/notifications', { quiet: true }).then((list) => setRow(list[0] || null)).catch(() => setRow(null)); }, []);
  return (
    <Link className="rounded-2xl border border-stone-200 bg-white px-4 py-3" to="/customer/notifications">
      <span className="block text-sm font-semibold text-stone-950">Inbox</span>
      {row && <span className="mt-1 block truncate text-xs text-stone-500">{[row.businessname, noticeLabel(row.notificationtype), noticeWhen(row.createddate)].filter(Boolean).join(' · ')}</span>}
    </Link>
  );
}
