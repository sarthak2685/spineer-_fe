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
      <Quick to="/business/qr" title="Print the QR" text="The flyer stays on /play/your-token." />
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
          <Field label="Mobile" name="mobile" defaultValue={editing?.mobile || ''} inputMode="numeric" placeholder="10-digit mobile" />
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
    <PageTitle title="QR and poster" text="Printed codes keep working. The public address is still /play/token." />
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
  return <Frame><PageTitle title="Print poster" /><Card className="text-center"><p className="font-display text-4xl">{data?.business?.businessname}</p><p>Scan to play, order, and review</p>{data?.code?.imagepath && <img alt="QR" src={asset(data.code.imagepath)} className="mx-auto mt-4 h-64 w-64" />}<Button className="mt-4" onClick={() => window.print()}>Print</Button></Card></Frame>;
}
export function BusinessProfilePage() {
  const [profile, setProfile] = useState<any>({});
  useEffect(() => { api('/business/profile').then(setProfile); }, []);
  return <Frame>
    <PageTitle title="Business profile" />
    {profile.logoimagepath && <img alt="Logo" src={asset(profile.logoimagepath)} className="mb-4 h-16 w-16 rounded-2xl object-cover" />}
    <Form className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); const body = new FormData(e.currentTarget); return api('/business/profile', { method: 'POST', body }).then((next) => { setProfile(next); toastOk('Profile saved.'); }); }}>
      <Field label="Name" name="businessName" defaultValue={profile.businessname} required /><Field label="Phone" name="phone" defaultValue={profile.phone} /><Field label="Email" name="email" defaultValue={profile.email} /><Field label="Tagline" name="tagline" defaultValue={profile.tagline} />
      <div className="md:col-span-2"><Area label="Address" name="address" defaultValue={profile.address} /></div>
      <div className="md:col-span-2"><Area label="Description" name="description" defaultValue={profile.description} /></div>
      <Field label="Theme color" name="themeColor" defaultValue={profile.themecolor} /><Field label="Website" name="website" defaultValue={profile.website} />
      <Field label="Facebook" name="facebookUrl" defaultValue={profile.facebookurl} /><Field label="Instagram" name="instagramUrl" defaultValue={profile.instagramurl} />
      <Field label="LinkedIn" name="linkedinUrl" defaultValue={profile.linkedinurl} /><Field label="X" name="twitterUrl" defaultValue={profile.twitterurl} />
      <Field label="YouTube" name="youtubeUrl" defaultValue={profile.youtubeurl} /><Field label="WhatsApp for orders" name="whatsappNumber" defaultValue={profile.whatsappnumber} placeholder="10-digit mobile" />
      <Field label="Support email" name="supportEmail" defaultValue={profile.supportemail} /><Field label="Pincode" name="pincode" defaultValue={profile.pincode} />
      <Field label="Latitude" name="latitude" defaultValue={profile.latitude} /><Field label="Longitude" name="longitude" defaultValue={profile.longitude} />
      <Field label="Google map URL" name="googleMapUrl" defaultValue={profile.googlemapurl} /><Field label="Google review URL" name="googleReviewUrl" defaultValue={profile.googlereviewurl} />
      <label className="text-sm">Logo<input className="mt-1 block w-full" type="file" name="logo" accept="image/png,image/jpeg,image/webp" /></label>
      <label className="text-sm">Banner<input className="mt-1 block w-full" type="file" name="banner" accept="image/png,image/jpeg,image/webp" /></label>
      <Button type="submit">Save profile</Button>
    </Form>
  </Frame>;
}
export function MenuStudio() {
  const [tick, setTick] = useState(0);
  return <Frame>
    <PageTitle title="Menu" text="Add items one by one, or upload a CSV for the whole menu." />
    <div className="grid items-start gap-3 lg:grid-cols-2">
      <CategoryPanel onChange={() => setTick((value) => value + 1)} />
      <ItemPanel tick={tick} />
    </div>
  </Frame>;
}
export function CategoriesPage() { return <MenuStudio />; }
function CategoryPanel({ onChange }: { onChange: () => void }) {
  const [rows, setRows] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  function load() { api<any[]>('/business/menu/categories').then(setRows); }
  useEffect(load, []);
  return <Card><p className="mb-2 text-sm font-semibold">Categories</p><Form key={editing?.categoryid || 'new'} className="mb-3 grid gap-2" onSubmit={(e) => { e.preventDefault(); return api('/business/menu/categories', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget).entries())) }).then(() => { setEditing(null); toastOk(editing ? 'Category updated.' : 'Category added.'); load(); onChange(); }); }}>{editing && <input type="hidden" name="id" value={editing.categoryid} />}<Field label="Name" name="categoryName" defaultValue={editing?.categoryname} required /><div className="flex items-end gap-2"><Field label="Order" name="displayOrder" defaultValue={editing?.displayorder ?? 0} /><Button type="submit">{editing ? 'Update' : 'Add'}</Button></div></Form><Table rows={rows} columns={[{ key: 'categoryname', label: 'Category', render: (row) => <button type="button" className="font-medium text-orange-600" onClick={() => setEditing(row)}>{row.categoryname}</button> }, { key: 'displayorder', label: 'Order' }, { key: 'actions', label: '', render: (row) => <RowMenu items={[{ label: 'Delete', danger: true, onClick: () => api(`/business/menu/categories/${row.categoryid}/delete`, { method: 'POST' }).then(() => { toastOk('Category removed.'); load(); }) }]} /> }]} /></Card>;
}
export function ItemsPage() { return <MenuStudio />; }
function ItemPanel({ tick }: { tick: number }) {
  const [rows, setRows] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [bulk, setBulk] = useState('');
  function load() { api<any[]>('/business/menu/items').then(setRows); api<any[]>('/business/menu/categories').then(setCategories); }
  useEffect(load, [tick]);
  async function saveItem(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = new FormData(e.currentTarget);
    await api('/business/menu/items', { method: 'POST', body });
    toastOk(editing ? 'Item updated.' : 'Item added.');
    setEditing(null);
    load();
  }
  function sampleCsv() {
    const csv = 'Category,Item,Price,Description\nStarters,Paneer Tikka,220,Spicy cottage cheese\nDrinks,Masala Chai,40,With ginger\n';
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'menu-sample.csv';
    link.click();
    URL.revokeObjectURL(url);
  }
  async function uploadMenu(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = new FormData(e.currentTarget);
    const file = body.get('file');
    if (!(file instanceof File) || !file.size) return;
    const result = await api<{ created: number; categoriesCreated: number }>('/business/menu/items/import', { method: 'POST', body });
    toastOk(`Added ${result.created} items${result.categoriesCreated ? ` and ${result.categoriesCreated} categories` : ''}.`);
    e.currentTarget.reset();
    load();
  }
  async function saveBulk(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const categoryId = String(new FormData(e.currentTarget).get('categoryId') || '');
    const items = bulk.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
      const [itemName, price, ...rest] = line.split(',').map((part) => part.trim());
      return { categoryId, itemName, price, description: rest.join(', ') || undefined };
    });
    const result = await api<{ created: number }>('/business/menu/items/bulk', { method: 'POST', body: JSON.stringify({ items }) });
    toastOk(`Added ${result.created} items.`);
    setBulk('');
    load();
  }
  return <Card>
    <p className="mb-2 text-sm font-semibold">Items</p>
    <Form key={editing?.itemid || 'new'} className="mb-3 grid gap-2 sm:grid-cols-2" onSubmit={saveItem}>
      {editing && <input type="hidden" name="id" value={editing.itemid} />}
      <Field label="Name" name="itemName" defaultValue={editing?.itemname} required />
      <Field label="Price" name="price" defaultValue={editing?.price} required />
      <Select label="Category" name="categoryId" defaultValue={editing?.categoryid}>{categories.map((c) => <option key={c.categoryid} value={c.categoryid}>{c.categoryname}</option>)}</Select>
      <label className="text-sm"><span className="mb-1.5 block font-medium text-stone-500">Image</span><input className="block w-full text-sm" type="file" name="image" accept="image/png,image/jpeg,image/webp" /></label>
      <div className="flex items-end sm:col-span-2"><Button type="submit">{editing ? 'Update' : 'Add item'}</Button></div>
    </Form>
    <Form className="mb-3 grid gap-2 rounded-xl border border-dashed border-stone-200 bg-stone-50 p-3" onSubmit={uploadMenu}>
      <p className="text-sm font-semibold text-stone-700">Upload menu file</p>
      <p className="text-xs text-stone-500">CSV columns: Category, Item, Price, Description. New categories are created from the file. In Excel, use Save As and choose CSV.</p>
      <input className="block w-full text-sm" type="file" name="file" accept=".csv,text/csv,.txt" required />
      <div className="flex flex-wrap gap-2">
        <Button type="submit">Upload CSV</Button>
        <Button type="button" kind="ghost" onClick={sampleCsv}>Download sample</Button>
      </div>
    </Form>
    <Form className="mb-4 grid gap-2 rounded-xl border border-dashed border-stone-200 bg-stone-50 p-3" onSubmit={saveBulk}>
      <p className="text-sm font-semibold text-stone-700">Bulk add</p>
      <p className="text-xs text-stone-500">One item per line: Name, Price, optional description</p>
      <Select label="Category" name="categoryId" required>{categories.map((c) => <option key={c.categoryid} value={c.categoryid}>{c.categoryname}</option>)}</Select>
      <Area label="Lines" value={bulk} onChange={(e) => setBulk(e.target.value)} placeholder={'Masala Dosa, 80, crispy\nFilter Coffee, 40'} />
      <Button type="submit" kind="soft">Insert lines</Button>
    </Form>
    <Table rows={rows} columns={[
      { key: 'itemname', label: 'Item', render: (row) => (
        <button type="button" className="flex items-center gap-2 font-medium text-orange-600" onClick={() => setEditing(row)}>
          {row.imagepath ? <img alt="" src={asset(row.imagepath)} className="h-8 w-8 rounded-lg object-cover" /> : null}
          {row.itemname}
        </button>
      ) },
      { key: 'price', label: 'Price', render: (row) => `₹${row.price}` },
      { key: 'actions', label: '', render: (row) => <RowMenu items={[{ label: 'Delete', danger: true, onClick: () => api(`/business/menu/items/${row.itemid}/delete`, { method: 'POST' }).then(() => { toastOk('Item removed.'); load(); }) }]} /> },
    ]} />
  </Card>;
}
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
      { key: 'tablenumber', label: 'Station' },
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
    <PageTitle title={data?.order?.ordernumber || 'Order'} text={data?.order ? `${data.order.customername || 'Guest'} · table ${data.order.tablenumber || '—'}` : 'Loading this order.'} />
    {message && <p className="mb-4 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">{message}</p>}
    <Card>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Status value={data?.order?.status || 'Pending'} />
          <p className="mt-3 text-3xl font-semibold tracking-tight">₹{Number(data?.order?.totalamount || 0).toFixed(2)}</p>
          {data?.order?.remarks && <p className="mt-2 text-sm text-stone-500">{data.order.remarks}</p>}
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
