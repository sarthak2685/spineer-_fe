import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { Button, Field } from './ui';

export type PageResult<T> = { rows: T[]; total: number; page: number; pageSize: number };

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function ListToolbar({
  from,
  to,
  onApply,
  children,
}: {
  from: string;
  to: string;
  onApply: (from: string, to: string) => void;
  children?: ReactNode;
}) {
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);
  useEffect(() => { setDraftFrom(from); setDraftTo(to); }, [from, to]);
  function submit(event: FormEvent) {
    event.preventDefault();
    onApply(draftFrom || today(), draftTo || today());
  }
  return (
    <form onSubmit={submit} className="mb-4 flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="From" type="date" value={draftFrom} onChange={(e) => setDraftFrom(e.target.value)} />
        <Field label="To" type="date" value={draftTo} onChange={(e) => setDraftTo(e.target.value)} />
        <Button type="submit" kind="soft">Apply</Button>
        <Button type="button" kind="ghost" onClick={() => { const day = today(); setDraftFrom(day); setDraftTo(day); onApply(day, day); }}>Today</Button>
      </div>
      {children ? <div className="flex flex-wrap items-end gap-2">{children}</div> : null}
    </form>
  );
}

export function Pager({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return <p className="mt-3 text-sm text-stone-500">{total} row{total === 1 ? '' : 's'}</p>;
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-stone-500">Page {page} of {pages} · {total} total</p>
      <div className="flex gap-2">
        <Button type="button" kind="ghost" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button>
        <Button type="button" kind="ghost" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</Button>
      </div>
    </div>
  );
}

export function usePagedQuery<T>(path: string, extra = '') {
  const day = useMemo(() => today(), []);
  const [from, setFrom] = useState(day);
  const [to, setTo] = useState(day);
  const [page, setPageState] = useState(1);
  const [data, setData] = useState<PageResult<T>>({ rows: [], total: 0, page: 1, pageSize: 10 });
  const [loading, setLoading] = useState(true);
  const pageSize = 10;
  const load = useCallback((nextPage: number, nextFrom: string, nextTo: string) => {
    setLoading(true);
    const query = `page=${nextPage}&pageSize=${pageSize}&from=${encodeURIComponent(nextFrom)}&to=${encodeURIComponent(nextTo)}${extra}`;
    return api<PageResult<T> | T[]>(`${path}?${query}`)
      .then((result) => {
        if (Array.isArray(result)) {
          setData({ rows: result, total: result.length, page: nextPage, pageSize });
          return;
        }
        setData({
          rows: Array.isArray(result?.rows) ? result.rows : [],
          total: Number(result?.total ?? 0),
          page: Number(result?.page ?? nextPage),
          pageSize: Number(result?.pageSize ?? pageSize),
        });
      })
      .catch(() => setData({ rows: [], total: 0, page: nextPage, pageSize }))
      .finally(() => setLoading(false));
  }, [path, extra, pageSize]);
  useEffect(() => {
    setPageState(1);
    load(1, from, to);
  }, [load, from, to]);
  return {
    rows: Array.isArray(data.rows) ? data.rows : [],
    total: data.total ?? 0,
    page,
    pageSize,
    loading,
    from,
    to,
    applyDates: (nextFrom: string, nextTo: string) => { setFrom(nextFrom); setTo(nextTo); },
    setPage: (next: number) => { setPageState(next); load(next, from, to); },
    reload: () => load(page, from, to),
  };
}
