import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, asset } from '../../api/client';
import { useAuth } from '../../app/auth';
import { CsvButton, ListToolbar, Pager, usePagedQuery } from '../../components/list';
import { ActionIcon, Alert, Button, Card, Field, Form, IconButton, Modal, PageTitle, Quick, RowMenu, Select, Stat, Status, Area, Table } from '../../components/ui';
import { toastErr, toastOk } from '../../lib/toast';

function Frame({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function BusinessDashboard() {
  const [data, setData] = useState<any>({});
  useEffect(() => { api('/business/dashboard').then(setData); }, []);
  return <Frame>
    <PageTitle title="Today" text="The queues that need a decision, and the shortcuts to set up the counter." />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Stat label="Registered customers" value={data.activeCustomers ?? '—'} /><Stat label="Plays" value={data.totalSpins ?? '—'} /><Stat label="Pending orders" value={data.pendingOrders ?? '—'} /><Stat label="Pending claims" value={data.pendingClaims ?? '—'} /></div>
    <div className="mt-4 grid gap-4 sm:grid-cols-3">
      <Quick to="/business/menu" title="Menu" text="Categories and items live on one page." />
      <Quick to="/business/rewards" title="Add a reward" text="Set the coin price customers redeem against." />
      <Quick to="/business/qr" title="Print the QR" text="The link uses the shop name, like /play/cafe-mocha." />
    </div>
    <div className="mt-6"><Table empty="No plays yet, so there is no game split." rows={data.distribution || []} columns={[{ key: 'gamecode', label: 'Game' }, { key: 'count', label: 'Plays' }]} /></div>
  </Frame>;
}

export function CustomersPage() {
  const [showAll, setShowAll] = useState(false);
  const list = usePagedQuery<any>('/business/customers', showAll ? '&scope=all' : '');
  const [open, setOpen] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget).entries());
    await api('/business/customers', { method: 'POST', body: JSON.stringify(form) });
    toastOk('Customer added.');
    setOpen(false);
    list.reload();
  }
  async function remove(row: any) {
    if (!window.confirm(`Remove ${row.customername || 'this customer'} from this shop? Their account stays.`)) return;
    await api(`/business/customers/${row.customerid}/delete`, { method: 'POST' });
    toastOk('Removed from this shop.');
    list.reload();
  }
  return <Frame>
    <PageTitle title="Customers" text="Anyone who joined or played at this shop. You can remove them from this list only." />
    <ListToolbar
      from={list.from}
      to={list.to}
      onApply={(from, to) => { setShowAll(false); list.applyDates(from, to); }}
    >
      <Button type="button" kind="ghost" onClick={() => setShowAll(true)}>All customers</Button>
      <CsvButton path="/business/customers" from={showAll ? undefined : list.from} to={showAll ? undefined : list.to} extra={showAll ? '&scope=all' : ''} filename="customers.csv" />
      <Button type="button" onClick={() => setOpen(true)}>Add customer</Button>
    </ListToolbar>
    <Table empty={list.loading ? 'Loading…' : showAll ? 'No customers yet.' : 'No customers in this date range.'} rows={list.rows} columns={[
      { key: 'customername', label: 'Name' },
      { key: 'mobile', label: 'Mobile' },
      { key: 'totalcoins', label: 'Coins' },
      { key: 'email', label: 'Email' },
      { key: 'createddate', label: 'Joined', render: (row) => String(row.createddate || '').slice(0, 10) },
      { key: 'actions', label: '', render: (row) => <RowMenu items={[{ label: 'Remove from this shop', danger: true, onClick: () => remove(row) }]} /> },
    ]} />
    <Pager page={list.page} pageSize={list.pageSize} total={list.total} onPage={list.setPage} />
    {open && (
      <Modal wide title="Add customer" text="Create a walk-in or registered guest for this shop." onClose={() => setOpen(false)}>
        <Form className="grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
          <Field label="Name" name="customerName" required />
          <Field label="Mobile" name="mobile" inputMode="numeric" maxLength={10} pattern="[6-9][0-9]{9}" placeholder="10-digit mobile" />
          <Field label="Email" name="email" />
          <Field label="Coins" name="totalCoins" defaultValue={0} />
          <div className="sm:col-span-2">
            <Field label="Password (optional)" name="password" type="password" placeholder="Min 6 characters" />
          </div>
          <div className="flex flex-wrap justify-end gap-2 border-t border-stone-100 pt-4 sm:col-span-2">
            <Button type="button" kind="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">Add customer</Button>
          </div>
        </Form>
      </Modal>
    )}
  </Frame>;
}

export function PlaysPage() {
  const list = usePagedQuery<any>('/business/plays');
  return <Frame>
    <PageTitle title="Who played" text="Every game play for the selected dates." />
    <ListToolbar from={list.from} to={list.to} onApply={list.applyDates}>
      <CsvButton path="/business/plays" from={list.from} to={list.to} filename="plays.csv" />
    </ListToolbar>
    <Table empty={list.loading ? 'Loading…' : 'No plays in this date range.'} rows={list.rows} columns={[
      { key: 'customername', label: 'Guest' },
      { key: 'mobile', label: 'Mobile' },
      { key: 'gamecode', label: 'Game' },
      { key: 'prizename', label: 'Prize', render: (row) => row.prizename || '—' },
      { key: 'coinswon', label: 'Coins' },
      { key: 'createddate', label: 'When', render: (row) => String(row.createddate || '').slice(0, 16).replace('T', ' ') },
    ]} />
    <Pager page={list.page} pageSize={list.pageSize} total={list.total} onPage={list.setPage} />
  </Frame>;
}
export function RewardsAdminPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  function load() { api<any[]>('/business/rewards').then(setRows); }
  useEffect(load, []);
  function start(row?: any) { setEditing(row || null); setError(''); setOpen(true); }
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget).entries());
    try { await api('/business/rewards', { method: 'POST', body: JSON.stringify(form) }); setOpen(false); setEditing(null); setError(''); toastOk(editing ? 'Reward updated.' : 'Reward added.'); load(); } catch (err) { setError(err instanceof Error ? err.message : 'Save failed.'); }
  }
  return <Frame>
    <PageTitle title="Rewards" text="The list of what customers can redeem." actions={<Button onClick={() => start()}>Add reward</Button>} />
    <Table empty="No rewards yet." rows={rows} columns={[{ key: 'rewardname', label: 'Reward', render: (row) => <button type="button" className="font-medium text-orange-600" onClick={() => start(row)}>{row.rewardname}</button> }, { key: 'coinsrequired', label: 'Coins' }, { key: 'description', label: 'Description' }, { key: 'actions', label: '', render: (row) => <RowMenu items={[{ label: 'Edit', onClick: () => start(row) }, { label: 'Remove', danger: true, onClick: () => api(`/business/rewards/${row.rewardid}/delete`, { method: 'POST' }).then(load) }]} /> }]} />
    {open && (
      <Modal title={editing ? 'Edit reward' : 'Add reward'} onClose={() => setOpen(false)}>
        <Form key={editing?.rewardid || 'new'} className="grid gap-3" onSubmit={onSubmit}>
          {editing && <input type="hidden" name="id" value={editing.rewardid} />}
          <Field label="Reward name" name="rewardName" defaultValue={editing?.rewardname} required />
          <Field label="Coins required" name="coinsRequired" defaultValue={editing?.coinsrequired} required />
          <Area label="Description" name="description" defaultValue={editing?.description} />
          {error && <Alert text={error} />}
          <Button type="submit">{editing ? 'Update reward' : 'Add reward'}</Button>
        </Form>
      </Modal>
    )}
  </Frame>;
}
export function RedemptionsPage() {
  const list = usePagedQuery<any>('/business/redemptions');
  return <Frame>
    <PageTitle title="Redemptions" text="Reward claims for the selected dates." />
    <ListToolbar from={list.from} to={list.to} onApply={list.applyDates}>
      <CsvButton path="/business/redemptions" from={list.from} to={list.to} filename="redemptions.csv" />
    </ListToolbar>
    <Table empty={list.loading ? 'Loading…' : 'No redemptions in this date range.'} rows={list.rows} columns={[
      { key: 'rewardname', label: 'Reward' },
      { key: 'customername', label: 'Customer' },
      { key: 'status', label: 'Status', render: (row) => <Status value={row.status} /> },
      { key: 'actions', label: '', render: (row) => <RowMenu items={[
        { label: 'Approve', onClick: () => api(`/business/redemptions/${row.rewardredemptionid}`, { method: 'POST', body: JSON.stringify({ status: 'Approved' }) }).then(() => { toastOk('Approved.'); list.reload(); }) },
        { label: 'Reject', danger: true, onClick: () => api(`/business/redemptions/${row.rewardredemptionid}`, { method: 'POST', body: JSON.stringify({ status: 'Rejected' }) }).then(() => { toastOk('Rejected.'); list.reload(); }) },
      ]} /> },
    ]} />
    <Pager page={list.page} pageSize={list.pageSize} total={list.total} onPage={list.setPage} />
  </Frame>;
}
export function BusinessClaimsPage() {
  const list = usePagedQuery<any>('/business/claims');
  const [approveRow, setApproveRow] = useState<any>(null);
  const [coins, setCoins] = useState('');
  const [saving, setSaving] = useState(false);

  function openApprove(row: any) {
    const suggested = Number(row.coins);
    setCoins(Number.isFinite(suggested) && suggested >= 0 ? String(Math.floor(suggested)) : String(Math.floor(Number(row.purchaseamount) || 0)));
    setApproveRow(row);
  }

  async function confirmApprove(event: FormEvent) {
    event.preventDefault();
    if (!approveRow) return;
    const value = Math.floor(Number(coins));
    if (!Number.isFinite(value) || value < 0) {
      toastErr('Enter a valid coin amount (0 or more).');
      return;
    }
    setSaving(true);
    try {
      await api(`/business/claims/${approveRow.purchaseclaimid}`, { method: 'POST', body: JSON.stringify({ action: 'approve', coins: value }) });
      toastOk(value > 0 ? `Approved. ${value} coins added to the customer.` : 'Claim approved.');
      setApproveRow(null);
      list.reload();
    } catch {
      /* toast from api */
    } finally {
      setSaving(false);
    }
  }

  return <Frame>
    <PageTitle title="Purchase claims" text="Bill claims for the selected dates. When you approve, choose how many coins to give." />
    <ListToolbar from={list.from} to={list.to} onApply={list.applyDates}>
      <CsvButton path="/business/claims" from={list.from} to={list.to} filename="claims.csv" />
    </ListToolbar>
    <Table empty={list.loading ? 'Loading…' : 'No claims in this date range.'} rows={list.rows} columns={[
      { key: 'customername', label: 'Customer' },
      { key: 'purchaseamount', label: 'Amount', render: (row) => `₹${row.purchaseamount}` },
      { key: 'coins', label: 'Coins' },
      { key: 'status', label: 'Status', render: (row) => <Status value={row.status} /> },
      { key: 'actions', label: '', render: (row) => row.status === 'Pending' ? <RowMenu items={[
        { label: 'Approve', onClick: () => openApprove(row) },
        { label: 'Reject', danger: true, onClick: () => api(`/business/claims/${row.purchaseclaimid}`, { method: 'POST', body: JSON.stringify({ action: 'reject', reason: 'Not accepted' }) }).then(() => { toastOk('Claim rejected.'); list.reload(); }) },
      ]} /> : null },
    ]} />
    <Pager page={list.page} pageSize={list.pageSize} total={list.total} onPage={list.setPage} />
    {approveRow && (
      <Modal
        title="Approve claim"
        text={`Bill ₹${approveRow.purchaseamount} from ${approveRow.customername || 'customer'}. Enter coins to add to their wallet.`}
        onClose={() => !saving && setApproveRow(null)}
      >
        <form className="space-y-4" onSubmit={confirmApprove}>
          <Field
            label="Coins to give"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={coins}
            onChange={(event) => setCoins(event.target.value.replace(/[^\d]/g, ''))}
            autoFocus
            required
          />
          <p className="text-xs text-stone-500">These coins are added to the customer wallet when you confirm.</p>
          <div className="flex gap-2">
            <Button type="button" kind="ghost" className="flex-1" disabled={saving} onClick={() => setApproveRow(null)}>Cancel</Button>
            <Button type="submit" className="flex-1" busy={saving} disabled={saving}>{saving ? 'Approving…' : 'Approve & add coins'}</Button>
          </div>
        </form>
      </Modal>
    )}
  </Frame>;
}
export function QrPage() {
  const [data, setData] = useState<any>(null);
  function load() { api('/business/qr').then(setData); }
  useEffect(load, []);
  return <Frame>
    <PageTitle title="QR and poster" text="The code is black on white. The frame uses your shop color. The poster prints that same image. Regenerate if the shop name changed." />
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <Card className="mx-auto w-full max-w-sm text-center lg:max-w-none">
        {data?.code?.imagepath && (
          <img alt="QR" src={asset(data.code.imagepath)} className="mx-auto block aspect-square w-[min(100%,16rem)] object-contain" />
        )}
        <p className="my-3 break-all text-sm text-stone-500">{data?.code?.qrcodetext}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => api('/business/qr/regenerate', { method: 'POST' }).then(load)}>Regenerate</Button>
          <Link className="inline-flex h-10 items-center rounded-xl border border-stone-200 px-4 text-sm font-semibold" to="/business/poster">Open print poster</Link>
        </div>
      </Card>
      <Card>
        <p className="mb-4 font-semibold">Guest experience</p>
        <Form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); return api('/business/experience', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget).entries())) }).then(() => { toastOk('Experience saved.'); load(); }); }}>
          <Field label="Catalog title" name="catalogTitle" defaultValue={data?.settings?.catalogtitle} />
          <Field label="Station label" name="stationLabel" defaultValue={data?.settings?.stationlabel} />
          <Field label="Station placeholder" name="stationPlaceholder" defaultValue={data?.settings?.stationplaceholder} />
          <Field label="Review keywords" name="reviewKeywords" defaultValue={data?.settings?.reviewkeywords} placeholder="Words guests can tap, separated by commas" />
          <Button type="submit">Save experience</Button>
        </Form>
      </Card>
    </div>
  </Frame>;
}
const posterLayouts = [
  { id: 'classic', label: 'Classic' },
  { id: 'bold', label: 'Bold' },
  { id: 'night', label: 'Night' },
] as const;

function posterColor(value?: string) {
  return value && /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#ea580c';
}

function QrPlate({ src }: { src: string }) {
  return (
    <div className="mx-auto aspect-square w-[min(100%,15rem)]">
      {src ? <img alt="QR code" src={src} className="mx-auto block h-full w-full object-contain" /> : <span className="grid h-full place-items-center text-sm text-stone-400">QR is loading</span>}
    </div>
  );
}

function printPoster() {
  const sheet = document.querySelector('.poster-print');
  if (!sheet) return;
  const frame = window.open('', '_blank', 'width=480,height=720');
  if (!frame) {
    window.print();
    return;
  }
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).map((node) => node.outerHTML).join('');
  frame.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Poster</title>${styles}<style>
    @page { margin: 8mm; size: auto; }
    html, body { margin: 0; padding: 0; background: #fff; }
    .poster-print { width: 100%; max-width: 100%; margin: 0 auto; }
    .poster-print article { width: 100%; max-width: 100%; margin: 0 auto; border-radius: 0; box-shadow: none; overflow: visible; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  </style></head><body>${sheet.outerHTML}</body></html>`);
  frame.document.close();
  window.setTimeout(() => {
    frame.focus();
    frame.print();
    frame.onafterprint = () => frame.close();
  }, 300);
}

export function PosterPage() {
  const [data, setData] = useState<any>(null);
  const [layout, setLayout] = useState<(typeof posterLayouts)[number]['id']>('classic');
  useEffect(() => { api('/business/qr').then(setData); }, []);
  const name = data?.business?.businessname || 'Scan to visit';
  const line = data?.business?.tagline || 'Play, order, and collect coins';
  const qr = data?.code?.imagepath ? asset(data.code.imagepath) : '';
  const color = posterColor(data?.business?.themecolor);
  const link = String(data?.code?.qrcodetext || '').replace(/^https?:\/\//, '');
  return <Frame>
    <div className="print:hidden">
      <PageTitle title="Print poster" text="Choose a layout. Print shows only the poster." />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button type="button" onClick={printPoster}>Print</Button>
        {posterLayouts.map((item) => (
          <button key={item.id} type="button" className={`rounded-full px-4 py-2 text-sm font-semibold ${layout === item.id ? 'bg-orange-600 text-white' : 'bg-orange-50 text-stone-600'}`} onClick={() => setLayout(item.id)}>{item.label}</button>
        ))}
      </div>
    </div>
    <div className="poster-print mx-auto w-full max-w-[420px]">
      {layout === 'classic' && (
        <article className="overflow-hidden rounded-[36px] bg-[#fffaf5] px-5 pb-8 pt-8 text-center shadow-xl shadow-stone-950/10 ring-1 ring-stone-200 sm:px-8 sm:pt-10" style={{ backgroundImage: `radial-gradient(circle at top, ${color}18, transparent 42%)` }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em]" style={{ color }}>Welcome</p>
          <h2 className="mt-3 break-words font-display text-3xl font-semibold leading-none tracking-tight text-stone-950 sm:text-[2.4rem]">{name}</h2>
          <p className="mx-auto mt-2 max-w-[16rem] text-sm leading-relaxed text-stone-500">{line}</p>
          <div className="mt-7"><QrPlate src={qr} /></div>
          {link && <p className="mt-5 text-[11px] tracking-wide text-stone-400">{link}</p>}
        </article>
      )}
      {layout === 'bold' && (
        <article className="overflow-hidden rounded-[36px] text-center text-white shadow-xl shadow-stone-950/15" style={{ background: `linear-gradient(165deg, ${color} 0%, #1c1917 78%)` }}>
          <div className="px-5 pb-6 pt-8 sm:px-8 sm:pt-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/70">Scan to start</p>
            <h2 className="mt-2 break-words font-display text-3xl font-semibold leading-none tracking-tight sm:text-[2.5rem]">{name}</h2>
            <p className="mx-auto mt-2 max-w-[16rem] text-sm text-white/75">{line}</p>
          </div>
          <div className="mx-3 mb-3 rounded-[28px] bg-white px-4 pb-6 pt-6 text-stone-950 sm:mx-4 sm:px-6">
            <QrPlate src={qr} />
            {link && <p className="mt-4 text-[11px] tracking-wide text-stone-400">{link}</p>}
          </div>
        </article>
      )}
      {layout === 'night' && (
        <article className="overflow-hidden rounded-[36px] bg-stone-950 px-5 pb-8 pt-8 text-center text-white shadow-xl shadow-stone-950/20 sm:px-8 sm:pt-10">
          <div className="mx-auto mb-6 h-1.5 w-16 rounded-full" style={{ background: color }} />
          <h2 className="break-words font-display text-3xl font-semibold leading-none tracking-tight sm:text-[2.5rem]">{name}</h2>
          <p className="mx-auto mt-2 max-w-[16rem] text-sm text-stone-400">{line}</p>
          <div className="mt-7"><QrPlate src={qr} /></div>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.22em]" style={{ color }}>Scan</p>
          {link && <p className="mt-5 text-[11px] tracking-wide text-stone-500">{link}</p>}
        </article>
      )}
    </div>
  </Frame>;
}
type ProfileDraft = {
  businessName: string;
  tagline: string;
  phone: string;
  email: string;
  supportEmail: string;
  whatsappNumber: string;
  description: string;
  address: string;
  pincode: string;
  website: string;
  wifiName: string;
  wifiPassword: string;
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  youtubeUrl: string;
  latitude: string;
  longitude: string;
  googleMapUrl: string;
  googleReviewUrl: string;
};

const PROFILE_SECTIONS = [
  { id: 'images', label: 'Images' },
  { id: 'identity', label: 'Contact' },
  { id: 'address', label: 'Address' },
  { id: 'branding', label: 'Website' },
  { id: 'wifi', label: 'Wi‑Fi' },
  { id: 'social', label: 'Social' },
  { id: 'maps', label: 'Maps' },
] as const;

function draftFromProfile(row: any): ProfileDraft {
  return {
    businessName: String(row.businessname || ''),
    tagline: String(row.tagline || ''),
    phone: String(row.phone || ''),
    email: String(row.email || ''),
    supportEmail: String(row.supportemail || ''),
    whatsappNumber: String(row.whatsappnumber || ''),
    description: String(row.description || ''),
    address: String(row.address || ''),
    pincode: String(row.pincode || ''),
    website: stripProtocol(String(row.website || '')),
    wifiName: String(row.wifiname || ''),
    wifiPassword: String(row.wifipassword || ''),
    facebookUrl: stripProtocol(String(row.facebookurl || '')),
    instagramUrl: stripProtocol(String(row.instagramurl || '')),
    twitterUrl: stripProtocol(String(row.twitterurl || '')),
    youtubeUrl: stripProtocol(String(row.youtubeurl || '')),
    latitude: row.latitude != null && row.latitude !== '' ? String(row.latitude) : '',
    longitude: row.longitude != null && row.longitude !== '' ? String(row.longitude) : '',
    googleMapUrl: stripProtocol(String(row.googlemapurl || '')),
    googleReviewUrl: stripProtocol(String(row.googlereviewurl || '')),
  };
}

function stripProtocol(value: string) {
  return value.trim().replace(/^https?:\/\//i, '');
}

function withHttps(value: string) {
  const cleaned = stripProtocol(value);
  return cleaned ? `https://${cleaned}` : '';
}

function isHttpUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return true;
  try {
    const url = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function parseMapCoords(url: string): { lat: string; lng: string } | null {
  const at = url.match(/@(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
  if (at) return { lat: at[1], lng: at[2] };
  const q = url.match(/[?&]q=(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
  if (q) return { lat: q[1], lng: q[2] };
  const d = url.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
  if (d) return { lat: d[1], lng: d[2] };
  return null;
}

function ProfileSection({ id, title, text, children }: { id: string; title: string; text?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <header className="mb-5 border-b border-stone-100 pb-4">
        <h2 className="text-sm font-semibold text-stone-950">{title}</h2>
        {text ? <p className="mt-1 text-sm text-stone-500">{text}</p> : null}
      </header>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function ImageUpload({ label, kind, preview, hint, onPick }: { label: string; kind: 'logo' | 'banner'; preview?: string | null; hint: string; onPick: (file: File | null) => void }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-stone-500">{label}</span>
      <span className="flex min-h-[7.5rem] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-4 text-center transition hover:border-orange-600 hover:bg-orange-50 sm:flex-row sm:justify-start sm:text-left">
        {preview ? (
          <img alt="" src={preview} className={kind === 'logo' ? 'h-16 w-16 rounded-2xl object-cover shadow-sm ring-2 ring-white' : 'h-16 w-28 rounded-xl object-cover shadow-sm ring-2 ring-white'} />
        ) : (
          <span className={`grid place-items-center rounded-2xl bg-white text-stone-400 ring-1 ring-stone-200 ${kind === 'logo' ? 'h-16 w-16' : 'h-16 w-28'}`}>
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 16l4.5-4.5a2 2 0 0 1 2.8 0L16 16m-2-2l1.2-1.2a2 2 0 0 1 2.8 0L20 14M8 8h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" /></svg>
          </span>
        )}
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-stone-950">{preview ? 'Replace image' : 'Choose file'}</span>
          <span className="mt-0.5 block text-xs text-stone-500">{hint}</span>
        </span>
      </span>
      <input
        className="sr-only"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(event) => {
          const file = event.target.files?.[0] || null;
          if (file && file.size > 2 * 1024 * 1024) {
            toastErr('Image must be 2 MB or smaller.');
            event.target.value = '';
            return;
          }
          onPick(file);
        }}
      />
    </label>
  );
}

/** Full URL length (including https://). Long Google Maps / review share links need room. */
const URL_MAX = 2000;

function UrlField({ label, value, hint, invalid, tip, onChange }: { label: string; value: string; hint?: string; invalid?: boolean; tip?: string; onChange: (value: string) => void }) {
  const shown = stripProtocol(value);
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-stone-500">{label}</span>
      <span className={`flex min-h-11 overflow-hidden rounded-xl border bg-white ring-orange-600/20 focus-within:ring-4 ${invalid ? 'border-rose-400' : 'border-stone-200 focus-within:border-orange-600'}`}>
        <span className="grid shrink-0 place-items-center self-stretch border-r border-stone-200 bg-stone-50 px-3 text-xs font-semibold text-stone-400">https://</span>
        <textarea
          value={shown}
          rows={shown.length > 80 ? 3 : 1}
          onChange={(event) => onChange(stripProtocol(event.target.value).slice(0, URL_MAX - 'https://'.length))}
          className="min-w-0 flex-1 resize-y bg-transparent px-3 py-2.5 text-sm outline-none"
          placeholder={hint}
          inputMode="url"
          autoComplete="url"
        />
      </span>
      {invalid ? <span className="mt-1 block text-xs text-rose-600">Enter a valid URL</span> : null}
      {!invalid && tip ? <span className="mt-1 block text-xs text-stone-500">{tip}</span> : null}
    </label>
  );
}

function GuestPreview({ draft, logoSrc, bannerSrc }: { draft: ProfileDraft; logoSrc: string | null; bannerSrc: string | null }) {
  const color = '#ea580c';
  const mark = (draft.businessName || 'S').trim().charAt(0).toUpperCase() || 'S';
  return (
    <div className="mx-auto w-full max-w-[220px]">
      <div className="overflow-hidden rounded-[1.6rem] border border-stone-200 bg-stone-950 shadow-xl shadow-stone-900/15 ring-4 ring-stone-100">
        <div className="relative h-28" style={{ background: `linear-gradient(160deg, ${color}, #7c2d12 70%)` }}>
          {bannerSrc ? <img alt="" src={bannerSrc} className="h-full w-full object-cover opacity-90" /> : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 text-white">
            <p className="truncate text-sm font-bold">{draft.businessName || 'Your shop'}</p>
            <p className="truncate text-[11px] text-white/80">{draft.tagline || 'Tagline appears here'}</p>
          </div>
          <div className="absolute -bottom-5 left-3 grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-white shadow-md ring-2 ring-white">
            {logoSrc ? <img alt="" src={logoSrc} className="h-full w-full object-cover" /> : <span className="text-lg font-semibold text-orange-600">{mark}</span>}
          </div>
        </div>
        <div className="bg-white px-3 pb-3 pt-7">
          <p className="text-[11px] leading-relaxed text-stone-500">Guest preview · updates as you type</p>
        </div>
      </div>
    </div>
  );
}

export function BusinessProfilePage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [baseline, setBaseline] = useState('');
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loc, setLoc] = useState({ countryId: '', stateId: '', districtId: '', cityId: '' });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoLocal, setLogoLocal] = useState<string | null>(null);
  const [bannerLocal, setBannerLocal] = useState<string | null>(null);
  const [showAdvancedMap, setShowAdvancedMap] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [activeSection, setActiveSection] = useState<string>('images');
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);

  function setField<K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  function loadProfile() {
    setLoading(true);
    setLoadError('');
    return api<any>('/business/profile', { quiet: true })
      .then((row) => {
        const next = draftFromProfile(row);
        setProfile(row);
        setDraft(next);
        setBaseline(JSON.stringify(next));
        setLoc({
          countryId: row.countryid ? String(row.countryid) : '',
          stateId: row.stateid ? String(row.stateid) : '',
          districtId: row.districtid ? String(row.districtid) : '',
          cityId: row.cityid ? String(row.cityid) : '',
        });
        setShowAdvancedMap(Boolean(row.latitude || row.longitude));
        setLogoFile(null);
        setBannerFile(null);
        setLogoLocal(null);
        setBannerLocal(null);
      })
      .catch((error) => {
        setLoadError(error instanceof Error ? error.message : 'Could not load profile.');
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    void loadProfile();
    api<any[]>('/locations/countries', { quiet: true }).then(setCountries).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (profile?.businessid && !profile.countryid && countries.length === 1 && !loc.countryId) {
      setLoc((current) => ({ ...current, countryId: String(countries[0].countryid) }));
    }
  }, [profile, countries, loc.countryId]);
  useEffect(() => { if (loc.countryId) api<any[]>(`/locations/states?countryId=${loc.countryId}`).then(setStates); else setStates([]); }, [loc.countryId]);
  useEffect(() => { if (loc.stateId) api<any[]>(`/locations/districts?stateId=${loc.stateId}`).then(setDistricts); else setDistricts([]); }, [loc.stateId]);
  useEffect(() => { if (loc.districtId) api<any[]>(`/locations/cities?districtId=${loc.districtId}`).then(setCities); else setCities([]); }, [loc.districtId]);

  useEffect(() => {
    if (!logoFile) { setLogoLocal(null); return undefined; }
    const url = URL.createObjectURL(logoFile);
    setLogoLocal(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);
  useEffect(() => {
    if (!bannerFile) { setBannerLocal(null); return undefined; }
    const url = URL.createObjectURL(bannerFile);
    setBannerLocal(url);
    return () => URL.revokeObjectURL(url);
  }, [bannerFile]);

  useEffect(() => {
    const nodes = PROFILE_SECTIONS.map((section) => document.getElementById(section.id)).filter((node): node is HTMLElement => Boolean(node));
    if (!nodes.length) return undefined;
    const observer = new IntersectionObserver((entries) => {
      const seen = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (seen?.target.id) setActiveSection(seen.target.id);
    }, { rootMargin: '-20% 0px -55% 0px', threshold: [0.15, 0.4] });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [draft]);

  const logoSrc = logoLocal || (profile?.logoimagepath ? asset(profile.logoimagepath) : null);
  const bannerSrc = bannerLocal || (profile?.bannerimagepath ? asset(profile.bannerimagepath) : null);
  const dirty = Boolean(draft && (JSON.stringify(draft) !== baseline || logoFile || bannerFile || JSON.stringify(loc) !== JSON.stringify({
    countryId: profile?.countryid ? String(profile.countryid) : '',
    stateId: profile?.stateid ? String(profile.stateid) : '',
    districtId: profile?.districtid ? String(profile.districtid) : '',
    cityId: profile?.cityid ? String(profile.cityid) : '',
  })));

  const checklist = useMemo(() => {
    if (!draft) return [];
    return [
      { label: 'Shop name', done: Boolean(draft.businessName.trim()) },
      { label: 'Logo', done: Boolean(logoSrc) },
      { label: 'Banner', done: Boolean(bannerSrc) },
      { label: 'Phone or WhatsApp', done: Boolean(draft.phone.trim() || draft.whatsappNumber.trim()) },
      { label: 'Address', done: Boolean(draft.address.trim()) },
      { label: 'Google review link', done: Boolean(draft.googleReviewUrl.trim()) },
      { label: 'Website or social', done: Boolean(draft.website.trim() || draft.facebookUrl.trim() || draft.instagramUrl.trim() || draft.twitterUrl.trim() || draft.youtubeUrl.trim()) },
    ];
  }, [draft, logoSrc, bannerSrc]);
  const doneCount = checklist.filter((item) => item.done).length;

  const urlErrors = draft ? {
    website: !isHttpUrl(draft.website),
    facebookUrl: !isHttpUrl(draft.facebookUrl),
    instagramUrl: !isHttpUrl(draft.instagramUrl),
    twitterUrl: !isHttpUrl(draft.twitterUrl),
    youtubeUrl: !isHttpUrl(draft.youtubeUrl),
    googleMapUrl: !isHttpUrl(draft.googleMapUrl),
    googleReviewUrl: !isHttpUrl(draft.googleReviewUrl),
  } : null;
  const hasUrlError = Boolean(urlErrors && Object.values(urlErrors).some(Boolean));

  async function save() {
    if (!draft) return;
    if (hasUrlError) {
      toastErr('Fix invalid URLs before saving.');
      return;
    }
    if (!draft.businessName.trim()) {
      toastErr('Business name is required.');
      return;
    }
    if (!draft.address.trim()) {
      toastErr('Address is required.');
      return;
    }
    if (!loc.countryId || !loc.stateId) {
      toastErr('Country and state are required.');
      return;
    }
    const body = new FormData();
    body.set('businessName', draft.businessName.trim());
    body.set('tagline', draft.tagline.trim());
    body.set('phone', draft.phone.trim());
    body.set('email', draft.email.trim());
    body.set('supportEmail', draft.supportEmail.trim());
    body.set('whatsappNumber', draft.whatsappNumber.trim());
    body.set('description', draft.description.trim());
    body.set('address', draft.address.trim());
    body.set('pincode', draft.pincode.trim());
    body.set('website', withHttps(draft.website));
    body.set('wifiName', draft.wifiName.trim());
    body.set('wifiPassword', draft.wifiPassword.trim());
    body.set('facebookUrl', withHttps(draft.facebookUrl));
    body.set('instagramUrl', withHttps(draft.instagramUrl));
    body.set('twitterUrl', withHttps(draft.twitterUrl));
    body.set('youtubeUrl', withHttps(draft.youtubeUrl));
    body.set('latitude', draft.latitude.trim());
    body.set('longitude', draft.longitude.trim());
    body.set('googleMapUrl', withHttps(draft.googleMapUrl));
    body.set('googleReviewUrl', withHttps(draft.googleReviewUrl));
    body.set('countryId', loc.countryId);
    body.set('stateId', loc.stateId);
    body.set('districtId', loc.districtId);
    body.set('cityId', loc.cityId);
    if (logoFile) body.set('logo', logoFile);
    if (bannerFile) body.set('banner', bannerFile);
    const next = await api<any>('/business/profile', { method: 'POST', body });
    const nextDraft = draftFromProfile(next);
    setProfile(next);
    setDraft(nextDraft);
    setBaseline(JSON.stringify(nextDraft));
    setLoc({
      countryId: next.countryid ? String(next.countryid) : '',
      stateId: next.stateid ? String(next.stateid) : '',
      districtId: next.districtid ? String(next.districtid) : '',
      cityId: next.cityid ? String(next.cityid) : '',
    });
    setLogoFile(null);
    setBannerFile(null);
    toastOk('Profile saved.');
  }

  if (loading) {
    return (
      <Frame>
        <PageTitle title="Business profile" text="Keep shop details, links, and images up to date for guests and your QR page." />
        <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
          <div className="space-y-4">
            {[0, 1, 2].map((item) => <div key={item} className="h-40 animate-pulse rounded-2xl bg-stone-200/70" />)}
          </div>
          <div className="h-64 animate-pulse rounded-2xl bg-stone-200/70" />
        </div>
      </Frame>
    );
  }

  if (loadError || !draft || !profile) {
    return (
      <Frame>
        <PageTitle title="Business profile" text="Keep shop details, links, and images up to date for guests and your QR page." />
        <Card className="max-w-xl">
          <p className="text-sm font-semibold text-stone-950">Could not open profile</p>
          <p className="mt-2 text-sm text-stone-600">{loadError || 'Profile data is unavailable.'}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={() => void loadProfile()}>Try again</Button>
            <Button kind="ghost" type="button" onClick={() => navigate('/business')}>Back to dashboard</Button>
          </div>
        </Card>
      </Frame>
    );
  }

  return (
    <Frame>
      <PageTitle title="Business profile" text="Keep shop details, links, and images up to date for guests and your QR page." />

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {PROFILE_SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition ${activeSection === section.id ? 'bg-orange-600 text-white' : 'bg-white text-stone-500 ring-1 ring-stone-200 hover:bg-orange-50'}`}
            onClick={() => document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          >
            {section.label}
          </button>
        ))}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
        <Form className="space-y-5" onSubmit={(event) => { event.preventDefault(); return save(); }}>
          <ProfileSection id="images" title="Images" text="Shown first on your guest page and QR poster.">
            <ImageUpload label="Logo" kind="logo" preview={logoSrc} hint="PNG, JPG, or WebP · max 2 MB · square works best" onPick={setLogoFile} />
            <ImageUpload label="Banner" kind="banner" preview={bannerSrc} hint="PNG, JPG, or WebP · max 2 MB · wide image works best" onPick={setBannerFile} />
          </ProfileSection>

          <ProfileSection id="identity" title="Name and contact" text="How your shop appears on the guest page.">
            <Field label="Name" value={draft.businessName} onChange={(event) => setField('businessName', event.target.value)} required />
            <Field label="Tagline" value={draft.tagline} onChange={(event) => setField('tagline', event.target.value)} />
            <Field label="Phone" value={draft.phone} onChange={(event) => setField('phone', event.target.value)} inputMode="numeric" maxLength={10} pattern="[6-9][0-9]{9}" />
            <Field label="Email" value={draft.email} onChange={(event) => setField('email', event.target.value)} />
            <Field label="Support email" value={draft.supportEmail} onChange={(event) => setField('supportEmail', event.target.value)} />
            <Field label="WhatsApp for orders" value={draft.whatsappNumber} onChange={(event) => setField('whatsappNumber', event.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" maxLength={10} />
            <div className="sm:col-span-2"><Area label="Description" value={draft.description} onChange={(event) => setField('description', event.target.value)} /></div>
          </ProfileSection>

          <ProfileSection id="address" title="Address" text="Where guests find you.">
            <div className="sm:col-span-2"><Area label="Address" value={draft.address} onChange={(event) => setField('address', event.target.value)} required /></div>
            <Select label="Country" value={loc.countryId} onChange={(event) => setLoc({ countryId: event.target.value, stateId: '', districtId: '', cityId: '' })} required>
              <option value="">Select</option>
              {countries.map((row) => <option key={row.countryid} value={row.countryid}>{row.countryname}</option>)}
            </Select>
            <Select label="State" value={loc.stateId} onChange={(event) => setLoc((current) => ({ ...current, stateId: event.target.value, districtId: '', cityId: '' }))} required>
              <option value="">Select</option>
              {states.map((row) => <option key={row.stateid} value={row.stateid}>{row.statename}</option>)}
            </Select>
            <Select label="District" value={loc.districtId} onChange={(event) => setLoc((current) => ({ ...current, districtId: event.target.value, cityId: '' }))}>
              <option value="">Select</option>
              {districts.map((row) => <option key={row.districtid} value={row.districtid}>{row.districtname}</option>)}
            </Select>
            <Select label="City" value={loc.cityId} onChange={(event) => setLoc((current) => ({ ...current, cityId: event.target.value }))}>
              <option value="">Select</option>
              {cities.map((row) => <option key={row.cityid} value={row.cityid}>{row.cityname}</option>)}
            </Select>
            <Field label="Pincode" value={draft.pincode} onChange={(event) => setField('pincode', event.target.value)} />
          </ProfileSection>

          <ProfileSection id="branding" title="Website" text="Optional link guests can open from your page.">
            <div className="sm:col-span-2">
              <UrlField label="Website" value={draft.website} hint="yourshop.com" invalid={urlErrors?.website} onChange={(value) => setField('website', value)} />
            </div>
          </ProfileSection>

          <ProfileSection id="wifi" title="Guest Wi‑Fi" text="Optional. Not a link — this is the network name and password guests see on your page so they can connect at the shop.">
            <Field label="Network name (SSID)" value={draft.wifiName} onChange={(event) => setField('wifiName', event.target.value)} placeholder="e.g. Cafe_Guest" />
            <Field label="Wi‑Fi password" value={draft.wifiPassword} onChange={(event) => setField('wifiPassword', event.target.value)} placeholder="Password guests can use" />
          </ProfileSection>

          <ProfileSection id="social" title="Social links" text="Optional profiles guests can open from your page.">
            <UrlField label="Facebook" value={draft.facebookUrl} hint="facebook.com/yourpage" invalid={urlErrors?.facebookUrl} onChange={(value) => setField('facebookUrl', value)} />
            <UrlField label="Instagram" value={draft.instagramUrl} hint="instagram.com/yourpage" invalid={urlErrors?.instagramUrl} onChange={(value) => setField('instagramUrl', value)} />
            <UrlField label="X" value={draft.twitterUrl} hint="x.com/yourpage" invalid={urlErrors?.twitterUrl} onChange={(value) => setField('twitterUrl', value)} />
            <UrlField label="YouTube" value={draft.youtubeUrl} hint="youtube.com/@yourchannel" invalid={urlErrors?.youtubeUrl} onChange={(value) => setField('youtubeUrl', value)} />
          </ProfileSection>

          <ProfileSection id="maps" title="Maps and reviews" text="Paste a Google Maps link to fill coordinates automatically.">
            <div className="sm:col-span-2">
              <UrlField
                label="Google map URL"
                value={draft.googleMapUrl}
                hint="Paste the full Google Maps share link"
                tip="Long Google Maps links are supported."
                invalid={urlErrors?.googleMapUrl}
                onChange={(value) => {
                  setField('googleMapUrl', value);
                  const coords = parseMapCoords(withHttps(value));
                  if (coords) {
                    setDraft((current) => current ? { ...current, googleMapUrl: stripProtocol(value), latitude: coords.lat, longitude: coords.lng } : current);
                    setShowAdvancedMap(true);
                  }
                }}
              />
            </div>
            <div className="sm:col-span-2">
              <UrlField
                label="Google review URL"
                value={draft.googleReviewUrl}
                hint="Paste the full Google review / g.page link"
                tip="Long review links are supported."
                invalid={urlErrors?.googleReviewUrl}
                onChange={(value) => setField('googleReviewUrl', value)}
              />
            </div>
            <div className="sm:col-span-2">
              <button type="button" className="text-sm font-semibold text-orange-600" onClick={() => setShowAdvancedMap((open) => !open)}>
                {showAdvancedMap ? 'Hide coordinates' : 'Show latitude / longitude'}
              </button>
            </div>
            {showAdvancedMap ? (
              <>
                <Field label="Latitude" value={draft.latitude} onChange={(event) => setField('latitude', event.target.value)} />
                <Field label="Longitude" value={draft.longitude} onChange={(event) => setField('longitude', event.target.value)} />
              </>
            ) : null}
          </ProfileSection>

          <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white/95 p-4 shadow-lg shadow-stone-900/5 backdrop-blur">
            <p className="text-sm text-stone-500">{dirty ? 'You have unsaved changes.' : 'All changes saved.'}</p>
            <Button type="submit" className="w-full sm:w-auto" disabled={!dirty || hasUrlError}>{dirty ? 'Save profile' : 'Saved'}</Button>
          </div>
    </Form>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">Guest preview</p>
            <GuestPreview draft={draft} logoSrc={logoSrc} bannerSrc={bannerSrc} />
          </section>
          <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">Profile strength</p>
              <p className="text-sm font-semibold text-orange-600">{doneCount}/{checklist.length}</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100">
              <div className="h-full rounded-full bg-orange-600 transition-all" style={{ width: `${(doneCount / checklist.length) * 100}%` }} />
            </div>
            <ul className="mt-4 space-y-2">
              {checklist.map((item) => (
                <li key={item.label} className="flex items-center gap-2 text-sm text-stone-600">
                  <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${item.done ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-400'}`}>{item.done ? '✓' : ''}</span>
                  {item.label}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <section className="mt-8 rounded-2xl border border-rose-200 bg-rose-50/60 p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-rose-800">Danger zone</h2>
        <p className="mt-1 text-sm text-rose-700/80">Pauses the shop and signs you out. Orders and plays are kept.</p>
        <Button kind="danger" className="mt-4" type="button" onClick={() => { setDeleteConfirm(''); setDeleteOpen(true); }}>Delete account</Button>
      </section>

      {deleteOpen && (
        <Modal title="Delete this shop?" text={`Type ${profile.businessname || 'the shop name'} to confirm.`} onClose={() => setDeleteOpen(false)}>
          <Field label="Shop name" value={deleteConfirm} onChange={(event) => setDeleteConfirm(event.target.value)} autoFocus />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button kind="ghost" type="button" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button
              kind="danger"
              type="button"
              disabled={deleteConfirm.trim().toLowerCase() !== String(profile.businessname || '').trim().toLowerCase()}
              onClick={async () => {
      await api('/business/account/delete', { method: 'POST' });
      await auth.clear();
      navigate('/login');
              }}
            >
              Delete account
            </Button>
          </div>
        </Modal>
      )}
    </Frame>
  );
}
export { CategoriesPage, ItemsPage, MenuStudio } from './menu-studio';

const orderActions: Record<string, [string, string, 'primary' | 'danger' | 'ghost' | 'soft', 'check' | 'close' | 'clock' | 'ban' | 'flag'][]> = {
  Pending: [['AcceptOrder', 'Accept', 'primary', 'check'], ['RejectOrder', 'Reject', 'danger', 'close']],
  Accepted: [['PreparingOrder', 'Preparing', 'soft', 'clock'], ['CancelOrder', 'Cancel', 'ghost', 'ban']],
  Preparing: [['ReadyOrder', 'Ready', 'soft', 'flag'], ['CancelOrder', 'Cancel', 'ghost', 'ban']],
  Ready: [['CompleteOrder', 'Complete', 'primary', 'check'], ['CancelOrder', 'Cancel', 'ghost', 'ban']],
};

export function OrdersPage() {
  const [status, setStatus] = useState('All');
  const list = usePagedQuery<any>('/business/menu/orders', `&status=${encodeURIComponent(status)}`);
  async function act(id: number, command: string) {
    const result = await api<{ message: string }>(`/business/menu/orders/${id}`, { method: 'POST', body: JSON.stringify({ status: command }) });
    toastOk(result.message);
    list.reload();
  }
  const filters = ['All', 'Pending', 'Accepted', 'Preparing', 'Ready', 'Completed', 'Cancelled', 'Rejected'];
  return <Frame>
    <PageTitle title="Orders" text="Accept a new order, move it through the kitchen, or reject and cancel it from this list." />
    <ListToolbar from={list.from} to={list.to} onApply={list.applyDates}>
      <CsvButton path="/business/menu/orders" from={list.from} to={list.to} extra={`&status=${encodeURIComponent(status)}`} filename="orders.csv" />
    </ListToolbar>
    <div className="mb-4 flex gap-2 overflow-x-auto">{filters.map((item) => <button key={item} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold ${status === item ? 'bg-orange-600 text-white' : 'bg-white text-stone-500 ring-1 ring-stone-200'}`} onClick={() => setStatus(item)}>{item}</button>)}</div>
    <Table empty={list.loading ? 'Loading…' : 'No orders for this filter.'} rows={list.rows} columns={[
      { key: 'ordernumber', label: 'Order', render: (row) => <span className="inline-flex flex-wrap items-center gap-2"><Link className="font-medium text-orange-600" to={`/business/menu/orders/${row.orderid}`}>{row.ordernumber}</Link><Status value={row.status} /></span> },
      { key: 'customername', label: 'Customer' },
      { key: 'mobile', label: 'Mobile' },
      { key: 'fulfillment', label: 'Service', render: (row) => ({ DineIn: 'Dine in', Delivery: 'Delivery', Pickup: 'Pickup' } as Record<string, string>)[row.fulfillment] || '—' },
      { key: 'tablenumber', label: 'Where' },
      { key: 'totalamount', label: 'Total', render: (row) => `₹${Number(row.totalamount || 0).toFixed(2)}` },
      { key: 'actions', label: '', render: (row) => <RowMenu items={(orderActions[row.status] || []).map(([command, label, kind]) => ({ label, danger: kind === 'danger', onClick: () => act(row.orderid, command) }))} /> },
    ]} />
    <Pager page={list.page} pageSize={list.pageSize} total={list.total} onPage={list.setPage} />
  </Frame>;
}
export function OrderDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [message, setMessage] = useState('');
  function load() { api(`/business/menu/orders/${id}`).then(setData); }
  useEffect(load, [id]);
  async function setStatus(status: string) { const result = await api<{ message: string }>(`/business/menu/orders/${id}`, { method: 'POST', body: JSON.stringify({ status }) }); setMessage(result.message); toastOk(result.message); load(); }
  const steps = orderActions[data?.order?.status] || [];
  return <Frame>
    <PageTitle title={data?.order?.ordernumber || 'Order'} text={data?.order ? `${data.order.customername || 'Guest'} · ${data.order.mobile || 'no mobile'} · ${({ DineIn: 'Dine in', Delivery: 'Delivery', Pickup: 'Pickup' } as Record<string, string>)[data.order.fulfillment] || 'Order'}` : 'Loading this order.'} />
    {message && <p className="mb-4 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">{message}</p>}
    <Card>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Status value={data?.order?.status || 'Pending'} />
          <p className="mt-3 text-3xl font-semibold tracking-tight">₹{Number(data?.order?.totalamount || 0).toFixed(2)}</p>
          {data?.order?.deliveryaddress && <p className="mt-2 text-sm text-stone-600">{data.order.deliveryaddress}</p>}
          {data?.order?.tablenumber && data?.order?.fulfillment === 'DineIn' && <p className="mt-2 text-sm text-stone-600">Table {data.order.tablenumber}</p>}
          {data?.order?.remarks && <p className="mt-2 text-sm text-stone-500">Instructions: {data.order.remarks}</p>}
        </div>
        <div className="flex flex-wrap gap-2">{steps.map(([command, label, kind, icon]) => <Button key={command} kind={kind} onClick={() => setStatus(command)}><ActionIcon name={icon} />{label}</Button>)}{!steps.length && <p className="text-sm text-stone-500">This order is already closed.</p>}</div>
      </div>
      <div className="mt-5 divide-y divide-stone-100 rounded-2xl bg-stone-100">
        {(data?.items || []).map((item: any) => (
          <div key={item.orderitemid} className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="font-medium">{item.itemname} <span className="text-stone-400">× {item.quantity}</span></span>
            <span>₹{Number(item.subtotal || 0).toFixed(2)}</span>
          </div>
        ))}
      </div>
    </Card>
  </Frame>;
}
export function BusinessReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  function load() {
    api<any[]>('/business/guest-reviews').then(setReviews);
    api<any[]>('/business/guest-feedback').then(setFeedback);
  }
  useEffect(load, []);
  return <Frame>
    <PageTitle title="Reviews" text="High ratings become Google reviews. Lower ratings stay here as private feedback." />
    <div className="mb-4"><CsvButton path="/business/guest-reviews" filename="reviews.csv" /></div>
    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-stone-400">Public reviews</h2>
    <Table empty="No named guest reviews yet." rows={reviews.filter((row) => String(row.customername || '').trim())} columns={[{ key: 'customername', label: 'Guest' }, { key: 'rating', label: 'Stars' }, { key: 'body', label: 'Review' }]} />
    <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wider text-stone-400">Private feedback</h2>
    <Table empty="No private feedback yet." rows={feedback} columns={[{ key: 'customername', label: 'Guest' }, { key: 'rating', label: 'Stars' }, { key: 'message', label: 'Message' }, { key: 'status', label: 'Status', render: (row) => <Status value={row.status === 'resolved' ? 'Completed' : row.status === 'read' ? 'Accepted' : 'Pending'} /> }, { key: 'actions', label: '', render: (row) => <RowMenu items={[{ label: row.status === 'resolved' ? 'Reopen' : 'Resolve', onClick: () => api(`/business/guest-feedback/${row.feedbackid}`, { method: 'POST', body: JSON.stringify({ status: row.status === 'resolved' ? 'read' : 'resolved' }) }).then(load) }]} /> }]} />
  </Frame>;
}

const pushSegments = [
  { value: 'All', label: 'Everyone' },
  { value: 'ScannedQR', label: 'Scanned a QR' },
  { value: 'Registered', label: 'Registered' },
  { value: 'WalletBalance', label: 'Wallet balance' },
  { value: 'ExpiringCoins', label: 'Expiring coins' },
  { value: 'RedeemedRewards', label: 'Redeemed a reward' },
  { value: 'Inactive30Days', label: 'Quiet for 30 days' },
  { value: 'PendingClaims', label: 'Pending claims' },
];

export function PushPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [phones, setPhones] = useState(0);
  const [message, setMessage] = useState('');
  const [draft, setDraft] = useState({ title: '', message: '', segment: 'All' });
  function load() {
    api<any>('/business/push/templates').then((data) => {
      const list = Array.isArray(data) ? data : Array.isArray(data?.templates) ? data.templates : Array.isArray(data?.rows) ? data.rows : [];
      setRows(list);
      setPhones(Array.isArray(data) ? 0 : Number(data?.phones || 0));
    }).catch(() => { setRows([]); setPhones(0); });
  }
  useEffect(load, []);
  return <Frame>
    <PageTitle title="Push" text="The message goes into each customer’s inbox. A browser alert only appears on a phone that already turned alerts on." />
    <div className="max-w-xl">
      <Form className="grid gap-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6" onSubmit={async (e) => {
        e.preventDefault();
        const result = await api<{ recipientCount: number; browserPush?: { sent: number; attempted: number } }>('/business/push/send', { method: 'POST', body: JSON.stringify(draft) });
        const push = result.browserPush;
        const inbox = `Saved for ${result.recipientCount} ${result.recipientCount === 1 ? 'customer' : 'customers'}.`;
        const detail = !push || push.attempted === 0
          ? `${inbox} None of them have browser alerts turned on, so it stays in the inbox.`
          : `${inbox} Browser alert reached ${push.sent} of ${push.attempted} ${push.attempted === 1 ? 'phone' : 'phones'}.`;
        setMessage(detail);
        toastOk(detail, { title: 'Message sent', detail });
        setDraft({ title: '', message: '', segment: 'All' });
        load();
      }}>
        <Field label="Title" name="title" required value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
        <Area label="Message" name="message" required value={draft.message} onChange={(event) => setDraft((current) => ({ ...current, message: event.target.value }))} />
        <Select label="Who receives it" name="segment" value={draft.segment} onChange={(event) => setDraft((current) => ({ ...current, segment: event.target.value }))}>{pushSegments.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select>
        <p className="rounded-2xl bg-orange-50 px-4 py-3 text-sm text-stone-600">{phones === 0 ? 'No phone at this shop has browser alerts on yet. Customers turn them on from their home screen.' : `${phones} ${phones === 1 ? 'phone has' : 'phones have'} browser alerts on for this shop.`}</p>
        {message && <p className="text-sm text-stone-600">{message}</p>}
        <Button type="submit" className="w-full">Send</Button>
      </Form>
    </div>
    <h2 className="mb-3 mt-10 text-sm font-semibold uppercase tracking-[0.16em] text-stone-400">Sent</h2>
    <div className="space-y-2">{(Array.isArray(rows) ? rows : []).map((row) => <Card key={row.notificationid || row.templateid}><p className="font-medium text-stone-950">{row.title}</p><p className="mt-1 text-sm text-stone-500">{row.message}</p>{row.recipientcount != null && <p className="mt-2 text-xs font-medium text-stone-400">{row.recipientcount} in the inbox · {pushSegments.find((item) => item.value === row.targetsegment)?.label || row.targetsegment}</p>}</Card>)}{!(Array.isArray(rows) && rows.length) && <Card><p className="text-sm text-stone-500">No messages sent yet.</p></Card>}</div>
  </Frame>;
}
export function GameAdminPage() {
  const { code = 'SpinWheel' } = useParams();
  const [configs, setConfigs] = useState<any[]>([]);
  const [prizes, setPrizes] = useState<any[]>([]);
  const [configId, setConfigId] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const tabs = ['SpinWheel', 'ScratchCard', 'MysteryGiftBox', 'SlotMachine'];
  const total = prizes.reduce((sum, prize) => sum + Number(prize.winningpercentage || 0), 0);

  async function load(prefer?: number | null) {
    const data = await api<any>(`/business/games/${code}`);
    const rows = Array.isArray(data) ? data : data.configs || [];
    setConfigs(rows);
    const picked = rows.find((row: { gameconfigurationid: number }) => row.gameconfigurationid === prefer) || rows[0];
    if (!picked) {
      setConfigId(null);
      setPrizes([]);
      return;
    }
    setConfigId(picked.gameconfigurationid);
    setPrizes(await api(`/business/prizes/${picked.gameconfigurationid}`));
  }

  useEffect(() => { load().catch(() => { setConfigs([]); setPrizes([]); }); }, [code]);

  async function openConfig(id: number) {
    setConfigId(id);
    setPrizes(await api(`/business/prizes/${id}`));
  }

  return <Frame>
    <PageTitle title="Games" text="The percentages on the configuration marked In use are the chances a customer gets. They should add up to 100." actions={configId ? <Button onClick={() => setAddOpen(true)}>Add sector</Button> : undefined} />
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex gap-1 overflow-x-auto rounded-2xl bg-white p-1 shadow-sm ring-1 ring-stone-200">{tabs.map((tab) => <Link key={tab} to={`/business/games/${tab}`} className={`shrink-0 rounded-xl px-3 py-2 text-sm font-semibold ${tab === code ? 'bg-orange-600 text-white' : 'text-stone-500 hover:bg-stone-100'}`}>{tab.replace(/([A-Z])/g, ' $1').trim()}</Link>)}</div>
      <Button kind="ghost" onClick={async () => { const created = await api<{ id: number }>(`/business/games/${code}`, { method: 'POST', body: JSON.stringify({ name: `New ${code}` }) }); await load(created.id); }}>New configuration</Button>
    </div>
    <div className="space-y-2">{configs.map((config) => (
      <Card key={config.gameconfigurationid} className={config.gameconfigurationid === configId ? 'ring-2 ring-orange-600' : ''}>
        <div className="flex items-center justify-between gap-3">
          <button type="button" className="min-w-0 flex-1 text-left" onClick={() => openConfig(config.gameconfigurationid)}>
            <p className="font-medium text-stone-950">{config.configurationname}</p>
            <p className="text-xs text-stone-500">{config.isactive ? 'In use on the shop' : 'Saved, not in use'}</p>
          </button>
          <div className="flex shrink-0 items-center gap-2">
            {!config.isactive && <Button type="button" kind="ghost" className="!h-8 px-3" onClick={() => api(`/business/games/${config.gameconfigurationid}/active`, { method: 'POST', body: JSON.stringify({ isActive: true }) }).then(() => load(config.gameconfigurationid))}>Use this</Button>}
            <IconButton type="button" kind="ghost" label={`Delete ${config.configurationname}`} onClick={() => { if (!window.confirm(`Delete ${config.configurationname}? Its sectors are removed too.`)) return; return api(`/business/games/${config.gameconfigurationid}/delete`, { method: 'POST' }).then(() => load(config.gameconfigurationid === configId ? null : configId)); }}><ActionIcon name="trash" /></IconButton>
          </div>
        </div>
      </Card>
    ))}</div>
    {!!prizes.length && <p className={`mb-2 mt-4 text-sm ${total === 100 ? 'text-stone-500' : 'text-rose-600'}`}>Chances add up to {total}%. {total === 100 ? 'A customer’s spin uses these odds.' : 'Set them to 100 so every spin lands on a sector you chose.'}</p>}
    <div className={`space-y-2 ${prizes.length ? '' : 'mt-4'}`}>{prizes.map((prize) => (
      <Card key={prize.prizeconfigurationid}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-stone-950">{prize.prizename}</p>
            <p className="text-sm text-stone-500">{Number(prize.coins)} coins</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <label className="flex items-center gap-1 text-sm font-semibold text-stone-700">
              <input
                key={`${prize.prizeconfigurationid}-${prize.winningpercentage}`}
                type="number"
                min={0}
                max={100}
                defaultValue={Number(prize.winningpercentage)}
                aria-label={`Winning chance for ${prize.prizename}`}
                className="h-9 w-16 rounded-xl border border-stone-200 px-2 text-right"
                onBlur={(event) => {
                  const next = Number(event.target.value);
                  if (!Number.isFinite(next) || next === Number(prize.winningpercentage)) return;
                  api('/business/prizes', { method: 'POST', body: JSON.stringify({ id: prize.prizeconfigurationid, configId, prizeName: prize.prizename, coins: prize.coins, winningPercentage: next }) }).then(() => { if (configId) return api(`/business/prizes/${configId}`).then(setPrizes); });
                }}
              />
              %
            </label>
            <IconButton type="button" kind="ghost" label={`Delete ${prize.prizename}`} onClick={() => api(`/business/prizes/${prize.prizeconfigurationid}/delete`, { method: 'POST' }).then(() => { if (configId) return api(`/business/prizes/${configId}`).then(setPrizes); })}><ActionIcon name="trash" /></IconButton>
          </div>
        </div>
      </Card>
    ))}</div>
    {addOpen && configId && (
      <Modal title="Add sector" onClose={() => setAddOpen(false)}>
        <Form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); const form = Object.fromEntries(new FormData(e.currentTarget).entries()); return api('/business/prizes', { method: 'POST', body: JSON.stringify({ ...form, configId }) }).then(() => { setAddOpen(false); api(`/business/prizes/${configId}`).then(setPrizes); }); }}>
          <Field label="Prize" name="prizeName" required />
          <Field label="Coins" name="coins" />
          <Field label="Winning %" name="winningPercentage" />
          <Button type="submit" className="w-full">Add sector</Button>
        </Form>
      </Modal>
    )}
  </Frame>;
}
