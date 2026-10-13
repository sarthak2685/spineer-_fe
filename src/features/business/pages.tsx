import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, asset } from '../../api/client';
import { useAuth } from '../../app/auth';
import { CsvButton, ListToolbar, Pager, usePagedQuery } from '../../components/list';
import { ActionIcon, Alert, Button, Card, Field, Form, Modal, PageTitle, Quick, RowMenu, Select, Stat, Status, Area, Table } from '../../components/ui';
import { toastOk } from '../../lib/toast';

function Frame({ children }: { children: React.ReactNode }) {
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
  return <Frame>
    <PageTitle title="Purchase claims" text="Bill claims for the selected dates." />
    <ListToolbar from={list.from} to={list.to} onApply={list.applyDates}>
      <CsvButton path="/business/claims" from={list.from} to={list.to} filename="claims.csv" />
    </ListToolbar>
    <Table empty={list.loading ? 'Loading…' : 'No claims in this date range.'} rows={list.rows} columns={[
      { key: 'customername', label: 'Customer' },
      { key: 'purchaseamount', label: 'Amount', render: (row) => `₹${row.purchaseamount}` },
      { key: 'coins', label: 'Coins' },
      { key: 'status', label: 'Status', render: (row) => <Status value={row.status} /> },
      { key: 'actions', label: '', render: (row) => row.status === 'Pending' ? <RowMenu items={[
        { label: 'Approve', onClick: () => api(`/business/claims/${row.purchaseclaimid}`, { method: 'POST', body: JSON.stringify({ action: 'approve' }) }).then(() => { toastOk('Claim approved.'); list.reload(); }) },
        { label: 'Reject', danger: true, onClick: () => api(`/business/claims/${row.purchaseclaimid}`, { method: 'POST', body: JSON.stringify({ action: 'reject', reason: 'Not accepted' }) }).then(() => { toastOk('Claim rejected.'); list.reload(); }) },
      ]} /> : null },
    ]} />
    <Pager page={list.page} pageSize={list.pageSize} total={list.total} onPage={list.setPage} />
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
          <img alt="QR" src={asset(data.code.imagepath)} className="mx-auto h-72 w-72" />
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

const posterSteps = ['Scan', 'Play', 'Earn'];

function posterColor(value?: string) {
  return value && /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#ea580c';
}

function QrPlate({ src }: { src: string }) {
  return (
    <div className="mx-auto grid h-[280px] w-[280px] place-items-center">
      {src ? <img alt="QR code" src={src} className="h-full w-full object-contain" /> : <span className="text-sm text-stone-400">QR is loading</span>}
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
    @page { margin: 0; size: 108mm 176mm; }
    html, body { margin: 0; padding: 0; width: 108mm; height: 176mm; overflow: hidden; background: transparent; }
    .poster-print { width: 108mm; max-width: none; margin: 0; }
    .poster-print article { width: 108mm; min-height: 176mm; margin: 0; border-radius: 0; box-shadow: none; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  </style></head><body>${sheet.outerHTML}</body></html>`);
  frame.document.close();
  window.setTimeout(() => {
    frame.focus();
    frame.print();
    frame.onafterprint = () => frame.close();
  }, 300);
}

function PosterSteps({ color, light = false }: { color: string; light?: boolean }) {
  return (
    <ol className="mt-7 flex items-center justify-center gap-2">
      {posterSteps.map((step, index) => (
        <li key={step} className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${light ? 'bg-white/10 text-white' : 'bg-white text-stone-800 shadow-sm'}`}>
            <span className="grid h-4 w-4 place-items-center rounded-full text-[10px] text-white" style={{ background: color }}>{index + 1}</span>
            {step}
          </span>
          {index < posterSteps.length - 1 && <span className={`h-px w-3 ${light ? 'bg-white/30' : 'bg-stone-300'}`} />}
        </li>
      ))}
    </ol>
  );
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
        <article className="overflow-hidden rounded-[36px] bg-[#fffaf5] px-8 pb-8 pt-10 text-center shadow-xl shadow-stone-950/10 ring-1 ring-stone-200" style={{ backgroundImage: `radial-gradient(circle at top, ${color}18, transparent 42%)` }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em]" style={{ color }}>Welcome</p>
          <h2 className="mt-3 font-display text-[2.4rem] font-semibold leading-none tracking-tight text-stone-950">{name}</h2>
          <p className="mx-auto mt-2 max-w-[16rem] text-sm leading-relaxed text-stone-500">{line}</p>
          <div className="mt-7"><QrPlate src={qr} /></div>
          <p className="mt-6 font-display text-xl font-semibold text-stone-950">Point your camera here</p>
          <PosterSteps color={color} />
          {link && <p className="mt-5 text-[11px] tracking-wide text-stone-400">{link}</p>}
        </article>
      )}
      {layout === 'bold' && (
        <article className="overflow-hidden rounded-[36px] text-center text-white shadow-xl shadow-stone-950/15" style={{ background: `linear-gradient(165deg, ${color} 0%, #1c1917 78%)` }}>
          <div className="px-8 pb-6 pt-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/70">Scan to start</p>
            <h2 className="mt-2 font-display text-[2.5rem] font-semibold leading-none tracking-tight">{name}</h2>
            <p className="mx-auto mt-2 max-w-[16rem] text-sm text-white/75">{line}</p>
          </div>
          <div className="mx-4 mb-4 rounded-[28px] bg-white px-6 pb-7 pt-7 text-stone-950">
            <QrPlate src={qr} />
            <p className="mt-5 font-display text-lg font-semibold">Play a game. Keep the coins.</p>
            <PosterSteps color={color} />
            {link && <p className="mt-4 text-[11px] tracking-wide text-stone-400">{link}</p>}
          </div>
        </article>
      )}
      {layout === 'night' && (
        <article className="overflow-hidden rounded-[36px] bg-stone-950 px-8 pb-8 pt-10 text-center text-white shadow-xl shadow-stone-950/20">
          <div className="mx-auto mb-6 h-1.5 w-16 rounded-full" style={{ background: color }} />
          <h2 className="font-display text-[2.5rem] font-semibold leading-none tracking-tight">{name}</h2>
          <p className="mx-auto mt-2 max-w-[16rem] text-sm text-stone-400">{line}</p>
          <div className="mt-7"><QrPlate src={qr} /></div>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.22em]" style={{ color }}>Scan · Play · Earn</p>
          <PosterSteps color={color} light />
          {link && <p className="mt-5 text-[11px] tracking-wide text-stone-500">{link}</p>}
        </article>
      )}
    </div>
  </Frame>;
}
export function BusinessProfilePage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>({});
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loc, setLoc] = useState({ countryId: '', stateId: '', districtId: '', cityId: '' });
  useEffect(() => {
    api<any>('/business/profile').then((row) => {
      setProfile(row);
      setLoc({ countryId: row.countryid ? String(row.countryid) : '', stateId: row.stateid ? String(row.stateid) : '', districtId: row.districtid ? String(row.districtid) : '', cityId: row.cityid ? String(row.cityid) : '' });
    });
    api<any[]>('/locations/countries').then(setCountries);
  }, []);
  useEffect(() => {
    if (profile.businessid && !profile.countryid && countries.length === 1 && !loc.countryId) setLoc((current) => ({ ...current, countryId: String(countries[0].countryid) }));
  }, [profile, countries, loc.countryId]);
  useEffect(() => { if (loc.countryId) api<any[]>(`/locations/states?countryId=${loc.countryId}`).then(setStates); else setStates([]); }, [loc.countryId]);
  useEffect(() => { if (loc.stateId) api<any[]>(`/locations/districts?stateId=${loc.stateId}`).then(setDistricts); else setDistricts([]); }, [loc.stateId]);
  useEffect(() => { if (loc.districtId) api<any[]>(`/locations/cities?districtId=${loc.districtId}`).then(setCities); else setCities([]); }, [loc.districtId]);
  return <Frame>
    <PageTitle title="Business profile" />
    {profile.logoimagepath && <img alt="Logo" src={asset(profile.logoimagepath)} className="mb-4 h-16 w-16 rounded-2xl object-cover" />}
    <Form key={profile.businessid || 'new'} className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); const body = new FormData(e.currentTarget); return api('/business/profile', { method: 'POST', body }).then((next) => { setProfile(next); toastOk('Profile saved.'); }); }}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400 md:col-span-2">Name and contact</p>
      <Field label="Name" name="businessName" defaultValue={profile.businessname} required /><Field label="Phone" name="phone" defaultValue={profile.phone} /><Field label="Email" name="email" defaultValue={profile.email} /><Field label="Tagline" name="tagline" defaultValue={profile.tagline} />
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone-400 md:col-span-2">Address</p>
      <div className="md:col-span-2"><Area label="Address" name="address" required defaultValue={profile.address} /></div>
      <Select label="Country" name="countryId" required value={loc.countryId} onChange={(event) => setLoc({ countryId: event.target.value, stateId: '', districtId: '', cityId: '' })}><option value="">Select</option>{countries.map((row) => <option key={row.countryid} value={row.countryid}>{row.countryname}</option>)}</Select>
      <Select label="State" name="stateId" required value={loc.stateId} onChange={(event) => setLoc((current) => ({ ...current, stateId: event.target.value, districtId: '', cityId: '' }))}><option value="">Select</option>{states.map((row) => <option key={row.stateid} value={row.stateid}>{row.statename}</option>)}</Select>
      <Select label="District" name="districtId" value={loc.districtId} onChange={(event) => setLoc((current) => ({ ...current, districtId: event.target.value, cityId: '' }))}><option value="">Select</option>{districts.map((row) => <option key={row.districtid} value={row.districtid}>{row.districtname}</option>)}</Select>
      <Select label="City" name="cityId" value={loc.cityId} onChange={(event) => setLoc((current) => ({ ...current, cityId: event.target.value }))}><option value="">Select</option>{cities.map((row) => <option key={row.cityid} value={row.cityid}>{row.cityname}</option>)}</Select>
      <div className="md:col-span-2"><Area label="Description" name="description" defaultValue={profile.description} /></div>
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone-400 md:col-span-2">Links</p>
      <Field label="Theme color" name="themeColor" defaultValue={profile.themecolor} /><Field label="Website" name="website" defaultValue={profile.website} />
      <Field label="Facebook" name="facebookUrl" defaultValue={profile.facebookurl} /><Field label="Instagram" name="instagramUrl" defaultValue={profile.instagramurl} />
      <Field label="LinkedIn" name="linkedinUrl" defaultValue={profile.linkedinurl} /><Field label="X" name="twitterUrl" defaultValue={profile.twitterurl} />
      <Field label="YouTube" name="youtubeUrl" defaultValue={profile.youtubeurl} /><Field label="WhatsApp for orders" name="whatsappNumber" defaultValue={profile.whatsappnumber} inputMode="numeric" maxLength={10} placeholder="10-digit mobile" />
      <Field label="Support email" name="supportEmail" defaultValue={profile.supportemail} /><Field label="Pincode" name="pincode" defaultValue={profile.pincode} />
      <Field label="Latitude" name="latitude" defaultValue={profile.latitude} /><Field label="Longitude" name="longitude" defaultValue={profile.longitude} />
      <Field label="Google map URL" name="googleMapUrl" defaultValue={profile.googlemapurl} /><Field label="Google review URL" name="googleReviewUrl" defaultValue={profile.googlereviewurl} />
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone-400 md:col-span-2">Images</p>
      <label className="text-sm">Logo<input className="mt-1 block w-full" type="file" name="logo" accept="image/png,image/jpeg,image/webp" /></label>
      <label className="text-sm">Banner<input className="mt-1 block w-full" type="file" name="banner" accept="image/png,image/jpeg,image/webp" /></label>
      <div className="md:col-span-2"><Button type="submit" className="w-full sm:w-auto">Save profile</Button></div>
    </Form>
    <Button kind="danger" className="mt-6" onClick={async () => {
      if (!window.confirm('Delete this shop account? The shop is paused and you will not be able to sign in. Orders and plays stay.')) return;
      await api('/business/account/delete', { method: 'POST' });
      await auth.clear();
      navigate('/login');
    }}>Delete account</Button>
  </Frame>;
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
  useEffect(() => { api<any>(`/business/games/${code}`).then((data) => { const rows = Array.isArray(data) ? data : data.configs || []; setConfigs(rows); const first = rows[0]; if (first) { setConfigId(first.gameconfigurationid); api(`/business/prizes/${first.gameconfigurationid}`).then(setPrizes); } }); }, [code]);
  const tabs = ['SpinWheel', 'ScratchCard', 'MysteryGiftBox', 'SlotMachine'];
  return <Frame>
    <PageTitle title="Games" text="Prize chances are still decided on the server." actions={configId ? <Button onClick={() => setAddOpen(true)}>Add sector</Button> : undefined} />
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex gap-1 overflow-x-auto rounded-2xl bg-white p-1 shadow-sm ring-1 ring-stone-200">{tabs.map((tab) => <Link key={tab} to={`/business/games/${tab}`} className={`shrink-0 rounded-xl px-3 py-2 text-sm font-semibold ${tab === code ? 'bg-orange-600 text-white' : 'text-stone-500 hover:bg-stone-100'}`}>{tab.replace(/([A-Z])/g, ' $1').trim()}</Link>)}</div>
      <Button kind="ghost" onClick={() => api(`/business/games/${code}`, { method: 'POST', body: JSON.stringify({ name: `New ${code}` }) }).then(() => api<any>(`/business/games/${code}`).then((data) => setConfigs(Array.isArray(data) ? data : data.configs || [])))}>New configuration</Button>
    </div>
    <div className="space-y-2">{configs.map((config) => <Card key={config.gameconfigurationid} className={config.gameconfigurationid === configId ? 'ring-2 ring-orange-600' : ''}><button className="w-full text-left font-medium" onClick={() => { setConfigId(config.gameconfigurationid); api(`/business/prizes/${config.gameconfigurationid}`).then(setPrizes); }}>{config.configurationname}</button></Card>)}</div>
    <div className="mt-4 space-y-2">{prizes.map((prize) => <Card key={prize.prizeconfigurationid}><p className="font-semibold">{prize.prizename}</p><p className="text-sm text-stone-500">{prize.winningpercentage}%</p></Card>)}</div>
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
