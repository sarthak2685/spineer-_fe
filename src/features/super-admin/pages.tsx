import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, asset } from '../../api/client';
import { Button, Field, Form, PageTitle, RowMenu, Status, Table } from '../../components/ui';
import { toastOk } from '../../lib/toast';

const searchClass = 'h-10 w-full rounded-xl border border-transparent bg-orange-50 px-4 text-sm text-stone-950 outline-none ring-orange-600/15 placeholder:text-stone-400 focus:border-orange-200 focus:bg-white focus:ring-4';

function Metric({ label, value, children }: { label: string; value: string | number; children: ReactNode }) {
  return (
    <section className="flex items-center gap-4 rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-100 text-orange-700">{children}</span>
      <div>
        <p className="text-sm text-stone-500">{label}</p>
        <p className="text-2xl font-semibold tracking-tight text-stone-950">{value}</p>
      </div>
    </section>
  );
}

function Mark({ d }: { d: string }) {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}

function Frame({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function joined(value?: string) {
  if (!value) return '—';
  return String(value).slice(0, 10);
}

function ShopMark({ row, token = false }: { row: any; token?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <span className="grid h-10 w-10 shrink-0 overflow-hidden rounded-2xl bg-orange-100 text-sm font-semibold text-orange-700">
        {row.logoimagepath ? <img alt="" src={asset(row.logoimagepath)} className="h-full w-full object-cover" /> : String(row.businessname || '?').slice(0, 1)}
      </span>
      <span>
        <span className="block">{row.businessname}</span>
        {token && row.businesstoken && <span className="block text-xs font-normal text-stone-400">{row.businesstoken}</span>}
      </span>
    </span>
  );
}

export function SuperDashboard() {
  const [data, setData] = useState<any>({ recent: [] });
  useEffect(() => { api('/super/dashboard').then(setData); }, []);
  return <Frame>
    <PageTitle kicker="Platform" title="Overview" text="Every shop on RewardSpinner, and the newest ones to review." />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Businesses" value={data.totalBusinesses ?? '—'}><Mark d="M4 10h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9zM3 10l2-5h14l2 5" /></Metric>
      <Metric label="Customers" value={data.totalCustomers ?? '—'}><Mark d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM20 19v-1a3.5 3.5 0 0 0-2.5-3.3M16 5.1a3 3 0 0 1 0 5.8" /></Metric>
      <Metric label="Plays" value={data.totalSpins ?? '—'}><Mark d="M12 3a9 9 0 1 0 9 9M12 7v5l3 2" /></Metric>
      <Metric label="Redemptions" value={data.totalRedemptions ?? '—'}><Mark d="M12 3l2.2 4.6L19 8.2l-3.5 3.4.8 4.9L12 14.8 7.7 16.5l.8-4.9L5 8.2l4.8-.6L12 3z" /></Metric>
    </div>
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <Link to="/super/businesses" className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm transition hover:border-orange-200 hover:bg-orange-50">
        <p className="font-semibold text-stone-950">Businesses</p>
        <p className="mt-1 text-sm text-stone-500">Pause a shop or open the page a guest sees.</p>
      </Link>
      <Link to="/super/business-types" className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm transition hover:border-orange-200 hover:bg-orange-50">
        <p className="font-semibold text-stone-950">Business types</p>
        <p className="mt-1 text-sm text-stone-500">The labels that drive the public hub and catalog.</p>
      </Link>
    </div>
    <div className="mt-4">
      <Table variant="card" title={<span className="flex items-center justify-between gap-3"><span>Recent shops</span><Link to="/super/businesses" className="text-sm font-semibold text-orange-600">View all</Link></span>} empty="No businesses yet." rows={data.recent || []} columns={[
        { key: 'businessname', label: 'Business', render: (row) => <ShopMark row={row} /> },
        { key: 'businesstype', label: 'Type' },
        { key: 'phone', label: 'Phone' },
        { key: 'createddate', label: 'Joined', render: (row) => joined(row.createddate) },
        { key: 'isactive', label: 'Status', render: (row) => <Status value={row.isactive ? 'Active' : 'Inactive'} /> },
        { key: 'actions', label: 'Actions', render: () => <RowMenu items={[{ label: 'Manage', to: '/super/businesses' }]} /> },
      ]} />
    </div>
  </Frame>;
}

export function SuperBusinesses() {
  const [rows, setRows] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  function load() { api<any[]>('/super/businesses').then(setRows); }
  useEffect(load, []);
  const visible = useMemo(() => rows.filter((row) => {
    const blob = `${row.businessname || ''} ${row.phone || ''} ${row.email || ''}`.toLowerCase();
    if (query.trim() && !blob.includes(query.trim().toLowerCase())) return false;
    if (filter === 'Active') return Boolean(row.isactive);
    if (filter === 'Inactive') return !row.isactive;
    return true;
  }), [rows, query, filter]);
  async function toggle(row: any) {
    await api(`/super/businesses/${row.businessid}/active`, { method: 'POST', body: JSON.stringify({ isActive: !row.isactive }) });
    toastOk(row.isactive ? 'Shop paused.' : 'Shop resumed.');
    load();
  }
  return <Frame>
    <PageTitle kicker="Platform" title="Businesses" text="Pause a shop to hide it from guests. Orders stay on the account." />
    <Table variant="card" empty="No businesses match this filter." rows={visible} toolbar={
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, phone, or email" className={`${searchClass} sm:max-w-xs`} />
        <div className="flex gap-2">
          {(['All', 'Active', 'Inactive'] as const).map((item) => (
            <button key={item} type="button" className={`rounded-full px-3 py-1.5 text-sm font-semibold ${filter === item ? 'bg-orange-600 text-white' : 'bg-orange-50 text-stone-600'}`} onClick={() => setFilter(item)}>{item}</button>
          ))}
        </div>
      </div>
    } columns={[
      { key: 'businessname', label: 'Business', render: (row) => <ShopMark row={row} token /> },
      { key: 'businesstype', label: 'Type' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'createddate', label: 'Joined', render: (row) => joined(row.createddate) },
      { key: 'isactive', label: 'Status', render: (row) => <Status value={row.isactive ? 'Active' : 'Inactive'} /> },
      { key: 'actions', label: 'Actions', render: (row) => <RowMenu items={[
        { label: row.isactive ? 'Pause' : 'Resume', onClick: () => toggle(row) },
        ...(row.businesstoken ? [{ label: 'Open guest page', to: `/play/${row.businesstoken}` }] : []),
      ]} /> },
    ]} />
  </Frame>;
}

type TypeDraft = {
  typename: string;
  typecode: string;
  hubicon: string;
  displayorder: string;
  hubtitle: string;
  hubsubtitle: string;
  hubbadge: string;
  catalogtitle: string;
  categoryterm: string;
  itemterm: string;
  stationlabel: string;
  stationplaceholder: string;
  actionbuttontext: string;
  isactive: boolean;
};

const typeGroups: { title: string; hint: string; fields: [Exclude<keyof TypeDraft, 'isactive'>, string][] }[] = [
  { title: 'Identity', hint: 'The name and code shops pick, plus the sort order.', fields: [['typename', 'Name'], ['typecode', 'Code'], ['hubicon', 'Hub icon'], ['displayorder', 'Display order']] },
  { title: 'Guest hub', hint: 'The words and icon a guest sees on the public hub.', fields: [['hubtitle', 'Hub title'], ['hubsubtitle', 'Hub subtitle'], ['hubbadge', 'Hub badge']] },
  { title: 'Catalog', hint: 'The words used for categories, items, and the station field.', fields: [['catalogtitle', 'Catalog title'], ['categoryterm', 'Category term'], ['itemterm', 'Item term'], ['stationlabel', 'Station label'], ['stationplaceholder', 'Station placeholder'], ['actionbuttontext', 'Action button']] },
];

function blankDraft(): TypeDraft {
  return {
    typename: '', typecode: '', hubicon: '', displayorder: '0',
    hubtitle: '', hubsubtitle: '', hubbadge: '',
    catalogtitle: '', categoryterm: '', itemterm: '', stationlabel: '', stationplaceholder: '', actionbuttontext: '',
    isactive: true,
  };
}

function draftFrom(row: any): TypeDraft {
  const draft = blankDraft();
  (Object.keys(draft) as (keyof TypeDraft)[]).forEach((key) => {
    if (key === 'isactive') draft.isactive = row.isactive !== false;
    else if (typeof draft[key] === 'string') draft[key] = String(row[key] ?? '');
  });
  return draft;
}

export function SuperTypes() {
  const [rows, setRows] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [draft, setDraft] = useState<TypeDraft>(blankDraft);
  function load() { api<any[]>('/super/business-types').then(setRows); }
  useEffect(load, []);
  const visible = useMemo(() => rows.filter((row) => {
    const blob = `${row.typename || ''} ${row.typecode || ''}`.toLowerCase();
    return !query.trim() || blob.includes(query.trim().toLowerCase());
  }), [rows, query]);
  const openAdd = useCallback(() => {
    setEditing(null);
    setDraft(blankDraft());
    setOpen(true);
  }, []);
  const addButton = useMemo(() => <Button type="button" className="!rounded-full" onClick={openAdd}>Add type</Button>, [openAdd]);
  function close() {
    setOpen(false);
    setEditing(null);
    setDraft(blankDraft());
  }
  function edit(row: any) {
    setEditing(row);
    setDraft(draftFrom(row));
    setOpen(true);
  }
  function setField(key: Exclude<keyof TypeDraft, 'isactive'>, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
  }
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = { ...draft, displayorder: Number(draft.displayorder || 0), isactive: draft.isactive, ...(editing ? { id: editing.businesstypeid } : {}) };
    await api('/super/business-types', { method: 'POST', body: JSON.stringify(body) });
    toastOk(editing ? 'Type updated.' : 'Type added.');
    close();
    load();
  }
  async function remove(row: any) {
    if (!window.confirm(`Delete ${row.typename}?`)) return;
    await api(`/super/business-types/${row.businesstypeid}/delete`, { method: 'POST' });
    toastOk('Type deleted.');
    if (editing?.businesstypeid === row.businesstypeid) close();
    load();
  }
  return <Frame>
    <PageTitle kicker="Platform" title="Business types" text="These labels drive the public hub, catalog, and station field." actions={addButton} />
    <Table variant="card" empty={query.trim() ? 'No types match this search.' : 'No business types yet.'} rows={visible} toolbar={
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or code" className={`${searchClass} sm:max-w-xs`} />
    } columns={[
      { key: 'typename', label: 'Type', render: (row) => <span>{row.hubicon} {row.typename}</span> },
      { key: 'typecode', label: 'Code' },
      { key: 'hubtitle', label: 'Hub' },
      { key: 'displayorder', label: 'Order' },
      { key: 'isactive', label: 'Status', render: (row) => <Status value={row.isactive === false ? 'Inactive' : 'Active'} /> },
      { key: 'actions', label: 'Actions', render: (row) => <RowMenu items={[
        { label: 'Edit', onClick: () => edit(row) },
        { label: 'Delete', danger: true, onClick: () => remove(row) },
      ]} /> },
    ]} />
    {open && (
      <div className="fixed inset-0 z-50 flex justify-end">
        <button type="button" className="absolute inset-0 bg-stone-900/40" aria-label="Close" onClick={close} />
        <aside className="relative flex h-full w-full max-w-[26rem] flex-col bg-white shadow-2xl">
          <Form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-start justify-between gap-3 border-b border-stone-100 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">{editing ? 'Edit type' : 'New type'}</p>
                <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">{editing ? `Edit ${editing.typename}` : 'Add type'}</h2>
              </div>
              <button type="button" onClick={close} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200"><ActionIcon name="close" /></button>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-xl shadow-sm">{draft.hubicon || '•'}</span>
                  <div className="min-w-0">
                    {draft.hubbadge && <span className="mb-1 inline-flex rounded-full bg-orange-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">{draft.hubbadge}</span>}
                    <p className="truncate font-semibold text-stone-950">{draft.hubtitle || 'Hub title'}</p>
                    <p className="truncate text-sm text-stone-500">{draft.hubsubtitle || 'Subtitle'}</p>
                  </div>
                </div>
                <span className="mt-3 inline-flex rounded-full bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white">{draft.actionbuttontext || 'Action'}</span>
              </div>
              {typeGroups.map((group) => (
                <section key={group.title} className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">{group.title}</p>
                  <p className="mt-1 text-sm text-stone-500">{group.hint}</p>
                  <div className="mt-3 space-y-3">
                    {group.fields.map(([name, label]) => (
                      <Field key={name} label={label} name={name} value={String(draft[name] ?? '')} onChange={(event) => setField(name, event.target.value)} required={name !== 'displayorder'} />
                    ))}
                    {group.title === 'Identity' && (
                      <div className="flex items-center justify-between rounded-2xl bg-white px-3.5 py-3">
                        <div>
                          <p className="text-sm font-medium text-stone-950">Active</p>
                          <p className="text-xs text-stone-500">Off pauses this type.</p>
                        </div>
                        <button type="button" role="switch" aria-checked={draft.isactive} aria-label="Active" onClick={() => setDraft((current) => ({ ...current, isactive: !current.isactive }))} className={`relative h-7 w-12 rounded-full transition ${draft.isactive ? 'bg-orange-600' : 'bg-stone-300'}`}>
                          <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition ${draft.isactive ? 'left-5' : 'left-0.5'}`} />
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              ))}
            </div>
            <div className="flex gap-2 border-t border-stone-100 bg-white px-5 py-4">
              <Button type="submit" className="!rounded-full">{editing ? 'Update type' : 'Add type'}</Button>
              {editing && <Button type="button" kind="ghost" className="!rounded-full" onClick={close}>Cancel</Button>}
            </div>
          </Form>
        </aside>
      </div>
    )}
  </Frame>;
}
