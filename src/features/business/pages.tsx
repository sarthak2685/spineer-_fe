import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, asset } from '../../api/client';
import { ListToolbar, Pager, usePagedQuery } from '../../components/list';
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
  const [editing, setEditing] = useState<any>(null);

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(row: any) {
    setEditing(row);
    setOpen(true);
  }
  function closeModal() {
    setOpen(false);
    setEditing(null);
  }
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget).entries());
    await api('/business/customers', { method: 'POST', body: JSON.stringify(form) });
    toastOk(editing ? 'Customer updated.' : 'Customer added.');
    closeModal();
    list.reload();
  }
  async function remove(row: any) {
    if (!window.confirm(`Remove ${row.customername || 'this customer'}?`)) return;
    await api(`/business/customers/${row.customerid}/delete`, { method: 'POST' });
    toastOk('Customer removed.');
    list.reload();
  }
  return <Frame>
    <PageTitle title="Customers" text="Filter by date, then add or manage guests for this shop." />
    <ListToolbar
      from={list.from}
      to={list.to}
      onApply={(from, to) => { setShowAll(false); list.applyDates(from, to); }}
    >
      <Button type="button" kind="ghost" onClick={() => setShowAll(true)}>All customers</Button>
      <Button type="button" onClick={openCreate}>Add customer</Button>
    </ListToolbar>
    <Table empty={list.loading ? 'Loading…' : showAll ? 'No customers yet.' : 'No customers in this date range.'} rows={list.rows} columns={[
      { key: 'customername', label: 'Name', render: (row) => <button type="button" className="font-medium text-orange-600" onClick={() => openEdit(row)}>{row.customername}</button> },
      { key: 'mobile', label: 'Mobile' },
      { key: 'totalcoins', label: 'Coins' },
      { key: 'email', label: 'Email' },
      { key: 'createddate', label: 'Joined', render: (row) => String(row.createddate || '').slice(0, 10) },
      { key: 'actions', label: '', render: (row) => <RowMenu items={[{ label: 'Edit', onClick: () => openEdit(row) }, { label: 'Delete', danger: true, onClick: () => remove(row) }]} /> },
    ]} />
    <Pager page={list.page} pageSize={list.pageSize} total={list.total} onPage={list.setPage} />
    {open && (
      <Modal
        wide
        title={editing ? 'Edit customer' : 'Add customer'}
        text={editing ? 'Update details for this guest.' : 'Create a walk-in or registered guest for this shop.'}
        onClose={closeModal}
      >
        <Form key={editing?.customerid || 'new'} className="grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
          {editing && <input type="hidden" name="id" value={editing.customerid} />}
          <Field label="Name" name="customerName" defaultValue={editing?.customername} required />
          <Field label="Mobile" name="mobile" defaultValue={editing?.mobile || ''} inputMode="numeric" maxLength={10} pattern="[6-9][0-9]{9}" placeholder="10-digit mobile" />
          <Field label="Email" name="email" defaultValue={editing?.email || ''} />
          <Field label="Coins" name="totalCoins" defaultValue={editing?.totalcoins ?? 0} />
          <div className="sm:col-span-2">
            <Field label={editing ? 'New password (optional)' : 'Password (optional)'} name="password" type="password" placeholder="Min 6 characters" />
          </div>
          <div className="flex flex-wrap justify-end gap-2 border-t border-stone-100 pt-4 sm:col-span-2">
            <Button type="button" kind="ghost" onClick={closeModal}>Cancel</Button>
            <Button type="submit">{editing ? 'Save changes' : 'Add customer'}</Button>
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
    <ListToolbar from={list.from} to={list.to} onApply={list.applyDates} />
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
  const [error, setError] = useState('');
  function load() { api<any[]>('/business/rewards').then(setRows); }
  useEffect(load, []);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget).entries());
    try { await api('/business/rewards', { method: 'POST', body: JSON.stringify(form) }); setEditing(null); setError(''); toastOk(editing ? 'Reward updated.' : 'Reward added.'); load(); } catch (err) { setError(err instanceof Error ? err.message : 'Save failed.'); }
  }
  return <Frame><PageTitle title="Rewards" text="Add one here. Click a row to edit it." /><Form key={editing?.rewardid || 'new'} className="mb-5 grid gap-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm md:grid-cols-2" onSubmit={onSubmit}>{editing && <input type="hidden" name="id" value={editing.rewardid} />}<Field label="Reward name" name="rewardName" defaultValue={editing?.rewardname} required /><Field label="Coins required" name="coinsRequired" defaultValue={editing?.coinsrequired} required /><div className="md:col-span-2"><Area label="Description" name="description" defaultValue={editing?.description} /></div><div className="flex items-center gap-2"><Button type="submit">{editing ? 'Update reward' : 'Add reward'}</Button>{error && <Alert text={error} />}</div></Form><Table rows={rows} columns={[{ key: 'rewardname', label: 'Reward', render: (row) => <button type="button" className="font-medium text-orange-600" onClick={() => setEditing(row)}>{row.rewardname}</button> }, { key: 'coinsrequired', label: 'Coins' }, { key: 'description', label: 'Description' }, { key: 'actions', label: '', render: (row) => <RowMenu items={[{ label: 'Remove', danger: true, onClick: () => api(`/business/rewards/${row.rewardid}/delete`, { method: 'POST' }).then(load) }]} /> }]} /></Frame>;
}
export function RedemptionsPage() {
  const list = usePagedQuery<any>('/business/redemptions');
  return <Frame>
    <PageTitle title="Redemptions" text="Reward claims for the selected dates." />
    <ListToolbar from={list.from} to={list.to} onApply={list.applyDates} />
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
    <ListToolbar from={list.from} to={list.to} onApply={list.applyDates} />
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
    <PageTitle title="QR and poster" text="The link uses the shop name. Older printed codes still open. Regenerate if the shop name changed." />
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <Card className="text-center">
        {data?.code?.imagepath && <img alt="QR" src={asset(data.code.imagepath)} className="mx-auto h-56 w-56 rounded-3xl bg-stone-100 p-3" />}
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
          <Field label="Review keywords" name="reviewKeywords" defaultValue={data?.settings?.reviewkeywords} placeholder="spicy, quick service, friendly staff" />
          <Button type="submit">Save experience</Button>
        </Form>
      </Card>
    </div>
  </Frame>;
}
export function PosterPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { api('/business/qr').then(setData); }, []);
  return <Frame><PageTitle title="Print poster" /><Card className="text-center"><p className="font-display text-4xl">{data?.business?.businessname}</p><p>Scan to play, order, and review</p>{data?.code?.imagepath && <img alt="QR" src={asset(data.code.imagepath)} className="mx-auto mt-4 h-64 w-64" />}{data?.code?.qrcodetext && <p className="mt-3 break-all text-sm text-stone-500">{data.code.qrcodetext}</p>}<Button className="mt-4" onClick={() => window.print()}>Print</Button></Card></Frame>;
}
export function BusinessProfilePage() {
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
      <Field label="Name" name="businessName" defaultValue={profile.businessname} required /><Field label="Phone" name="phone" defaultValue={profile.phone} /><Field label="Email" name="email" defaultValue={profile.email} /><Field label="Tagline" name="tagline" defaultValue={profile.tagline} />
      <div className="md:col-span-2"><Area label="Address" name="address" required defaultValue={profile.address} /></div>
      <Select label="Country" name="countryId" required value={loc.countryId} onChange={(event) => setLoc({ countryId: event.target.value, stateId: '', districtId: '', cityId: '' })}><option value="">Select</option>{countries.map((row) => <option key={row.countryid} value={row.countryid}>{row.countryname}</option>)}</Select>
      <Select label="State" name="stateId" required value={loc.stateId} onChange={(event) => setLoc((current) => ({ ...current, stateId: event.target.value, districtId: '', cityId: '' }))}><option value="">Select</option>{states.map((row) => <option key={row.stateid} value={row.stateid}>{row.statename}</option>)}</Select>
      <Select label="District" name="districtId" value={loc.districtId} onChange={(event) => setLoc((current) => ({ ...current, districtId: event.target.value, cityId: '' }))}><option value="">Select</option>{districts.map((row) => <option key={row.districtid} value={row.districtid}>{row.districtname}</option>)}</Select>
      <Select label="City" name="cityId" value={loc.cityId} onChange={(event) => setLoc((current) => ({ ...current, cityId: event.target.value }))}><option value="">Select</option>{cities.map((row) => <option key={row.cityid} value={row.cityid}>{row.cityname}</option>)}</Select>
      <div className="md:col-span-2"><Area label="Description" name="description" defaultValue={profile.description} /></div>
      <Field label="Theme color" name="themeColor" defaultValue={profile.themecolor} /><Field label="Website" name="website" defaultValue={profile.website} />
      <Field label="Facebook" name="facebookUrl" defaultValue={profile.facebookurl} /><Field label="Instagram" name="instagramUrl" defaultValue={profile.instagramurl} />
      <Field label="LinkedIn" name="linkedinUrl" defaultValue={profile.linkedinurl} /><Field label="X" name="twitterUrl" defaultValue={profile.twitterurl} />
      <Field label="YouTube" name="youtubeUrl" defaultValue={profile.youtubeurl} /><Field label="WhatsApp for orders" name="whatsappNumber" defaultValue={profile.whatsappnumber} inputMode="numeric" maxLength={10} placeholder="10-digit mobile" />
      <Field label="Support email" name="supportEmail" defaultValue={profile.supportemail} /><Field label="Pincode" name="pincode" defaultValue={profile.pincode} />
      <Field label="Latitude" name="latitude" defaultValue={profile.latitude} /><Field label="Longitude" name="longitude" defaultValue={profile.longitude} />
      <Field label="Google map URL" name="googleMapUrl" defaultValue={profile.googlemapurl} /><Field label="Google review URL" name="googleReviewUrl" defaultValue={profile.googlereviewurl} />
      <label className="text-sm">Logo<input className="mt-1 block w-full" type="file" name="logo" accept="image/png,image/jpeg,image/webp" /></label>
      <label className="text-sm">Banner<input className="mt-1 block w-full" type="file" name="banner" accept="image/png,image/jpeg,image/webp" /></label>
      <Button type="submit">Save profile</Button>
    </Form>
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
    <ListToolbar from={list.from} to={list.to} onApply={list.applyDates} />
    <div className="mb-4 flex gap-2 overflow-x-auto">{filters.map((item) => <button key={item} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold ${status === item ? 'bg-orange-600 text-white' : 'bg-white text-stone-500 ring-1 ring-stone-200'}`} onClick={() => setStatus(item)}>{item}</button>)}</div>
    <Table empty={list.loading ? 'Loading…' : 'No orders for this filter.'} rows={list.rows} columns={[
      { key: 'ordernumber', label: 'Order', render: (row) => <Link className="font-medium text-orange-600" to={`/business/menu/orders/${row.orderid}`}>{row.ordernumber}</Link> },
      { key: 'customername', label: 'Customer' },
      { key: 'mobile', label: 'Mobile' },
      { key: 'fulfillment', label: 'Service', render: (row) => ({ DineIn: 'Dine in', Delivery: 'Delivery', Pickup: 'Pickup' } as Record<string, string>)[row.fulfillment] || '—' },
      { key: 'tablenumber', label: 'Where' },
      { key: 'totalamount', label: 'Total', render: (row) => `₹${Number(row.totalamount || 0).toFixed(2)}` },
      { key: 'status', label: 'Status', render: (row) => <Status value={row.status} /> },
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
    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-stone-400">Public reviews</h2>
    <Table empty="No guest reviews yet." rows={reviews} columns={[{ key: 'customername', label: 'Guest' }, { key: 'rating', label: 'Stars' }, { key: 'body', label: 'Review' }]} />
    <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wider text-stone-400">Private feedback</h2>
    <Table empty="No private feedback yet." rows={feedback} columns={[{ key: 'customername', label: 'Guest' }, { key: 'rating', label: 'Stars' }, { key: 'message', label: 'Message' }, { key: 'status', label: 'Status', render: (row) => <Status value={row.status === 'resolved' ? 'Completed' : row.status === 'read' ? 'Accepted' : 'Pending'} /> }, { key: 'actions', label: '', render: (row) => <RowMenu items={[{ label: row.status === 'resolved' ? 'Reopen' : 'Resolve', onClick: () => api(`/business/guest-feedback/${row.feedbackid}`, { method: 'POST', body: JSON.stringify({ status: row.status === 'resolved' ? 'read' : 'resolved' }) }).then(load) }]} /> }]} />
  </Frame>;
}

export function PushPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  function load() { api<any[]>('/business/push/templates').then(setRows); }
  useEffect(load, []);
  return <Frame>
    <PageTitle title="Push campaigns" />
    <Form className="mb-6 grid gap-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm" onSubmit={async (e) => { e.preventDefault(); const form = Object.fromEntries(new FormData(e.currentTarget).entries()); const result = await api<{ recipientCount: number; browserPush?: { sent: number; attempted: number } }>('/business/push/send', { method: 'POST', body: JSON.stringify(form) }); const push = result.browserPush; const text = `Inbox: ${result.recipientCount} customers` + (push ? ` · Browser push: ${push.sent}/${push.attempted}` : ''); setMessage(text); toastOk(text); }}>
      <Field label="Title" name="title" required />
      <Area label="Message" name="message" required />
      <Select label="Segment" name="segment"><option>All</option><option>ScannedQR</option><option>Registered</option><option>WalletBalance</option><option>ExpiringCoins</option><option>RedeemedRewards</option><option>Inactive30Days</option><option>PendingClaims</option></Select>
      <p className="text-xs text-stone-500">Customers who enabled browser notifications also get a real system notification.</p>
      <Button type="submit">Send</Button>
      {message && <p className="text-sm text-emerald-700">{message}</p>}
    </Form>
    <div className="space-y-2">{rows.map((row) => <Card key={row.templateid}><p className="font-medium">{row.title}</p><p className="text-sm text-stone-500">{row.message}</p></Card>)}</div>
  </Frame>;
}
export function GameAdminPage() {
  const { code = 'SpinWheel' } = useParams();
  const [configs, setConfigs] = useState<any[]>([]);
  const [prizes, setPrizes] = useState<any[]>([]);
  const [configId, setConfigId] = useState<number | null>(null);
  useEffect(() => { api<any>(`/business/games/${code}`).then((data) => { const rows = Array.isArray(data) ? data : data.configs || []; setConfigs(rows); const first = rows[0]; if (first) { setConfigId(first.gameconfigurationid); api(`/business/prizes/${first.gameconfigurationid}`).then(setPrizes); } }); }, [code]);
  const tabs = ['SpinWheel', 'ScratchCard', 'MysteryGiftBox', 'SlotMachine'];
  return <Frame>
    <PageTitle title="Games" text="Prize chances are still decided on the server." />
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="inline-flex flex-wrap gap-1 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-stone-200">{tabs.map((tab) => <Link key={tab} to={`/business/games/${tab}`} className={`rounded-xl px-3 py-2 text-sm font-semibold ${tab === code ? 'bg-orange-600 text-white' : 'text-stone-500 hover:bg-stone-100'}`}>{tab.replace(/([A-Z])/g, ' $1').trim()}</Link>)}</div>
      <Button onClick={() => api(`/business/games/${code}`, { method: 'POST', body: JSON.stringify({ name: `New ${code}` }) }).then(() => api<any>(`/business/games/${code}`).then((data) => setConfigs(Array.isArray(data) ? data : data.configs || [])))}>New configuration</Button>
    </div>
    <div className="space-y-2">{configs.map((config) => <Card key={config.gameconfigurationid} className={config.gameconfigurationid === configId ? 'ring-2 ring-orange-600' : ''}><button className="w-full text-left font-medium" onClick={() => { setConfigId(config.gameconfigurationid); api(`/business/prizes/${config.gameconfigurationid}`).then(setPrizes); }}>{config.configurationname}</button></Card>)}</div>
    <div className="mt-4 space-y-2">{prizes.map((prize) => <Card key={prize.prizeconfigurationid}>{prize.prizename} · {prize.winningpercentage}%</Card>)}{configId && <Form className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-5 md:grid-cols-3" onSubmit={(e) => { e.preventDefault(); const form = Object.fromEntries(new FormData(e.currentTarget).entries()); return api('/business/prizes', { method: 'POST', body: JSON.stringify({ ...form, configId }) }).then(() => api(`/business/prizes/${configId}`).then(setPrizes)); }}><Field label="Prize" name="prizeName" /><Field label="Coins" name="coins" /><Field label="Winning %" name="winningPercentage" /><div className="md:col-span-3"><Button type="submit">Add sector</Button></div></Form>}</div>
  </Frame>;
}
