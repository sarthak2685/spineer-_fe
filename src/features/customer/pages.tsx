import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, client } from '../../api/client';
import { ListToolbar, Pager, usePagedQuery } from '../../components/list';
import { Alert, Button, Card, Empty, Field, Form, PageTitle, Quick, Select, Stat, Status, Table } from '../../components/ui';
import { toastOk } from '../../lib/toast';

function Frame({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function CustomerDashboard() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { api('/customer/dashboard').then(setData); }, []);
  useEffect(() => {
    // Re-sync browser push if the customer already allowed notifications.
    import('../../lib/push').then(async ({ getPushPermission, enableBrowserPush }) => {
      const permission = await getPushPermission();
      if (permission === 'granted') await enableBrowserPush().catch(() => undefined);
    });
  }, []);
  return <Frame>
    <PageTitle title={`Hello, ${data?.customer?.customername || 'there'}`} text="Browse a shop menu, place an order, play for coins, and keep everything in one wallet." />
    <div className="grid gap-4 sm:grid-cols-3"><Stat label="Coins" value={data?.customer?.totalcoins ?? '—'} gold /><Stat label="Plays" value={data?.prizes ?? '—'} /><Stat label="Unread" value={data?.unread ?? '—'} /></div>
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Quick to="/customer/explore" title="Find a shop" text="Open any shop to view the menu and order food." />
      <Quick to="/customer/explore" title="Order food" text="Pick a business, tap Order, add items, and send to the table." />
      <Quick to="/customer/my-orders" title="My orders" text="Track what you already sent to the station." />
      <Quick to="/customer/wallet" title="Wallet" text="See every coin that came in or went out." />
    </div>
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Quick to="/customer/rewards" title="Rewards" text="Spend coins on something at the counter." />
      <Quick to="/customer/notifications" title="Notifications" text="Enable browser alerts so shop offers reach you." />
      <Quick to="/customer/explore" title="Play & review" text="Games and reviews stay on the same shop QR link." />
    </div>
  </Frame>;
}

export function ExplorePage() {
  const [data, setData] = useState<any>({ businesses: [], categories: [] });
  const [query, setQuery] = useState({ search: '', category: 'All', game: 'All' });
  function load(next = query) { const q = new URLSearchParams(next).toString(); api(`/customer/explore?${q}`).then(setData); }
  useEffect(() => { load(); }, []);
  return <Frame>
    <PageTitle title="Explore shops" text="Open a shop to view the menu, order food, play games, or leave a review." />
    <Card className="mb-4">
      <div className="grid items-end gap-3 md:grid-cols-[1fr_1fr_auto]">
        <Field label="Search" value={query.search} onChange={(e) => setQuery({ ...query, search: e.target.value })} />
        <Select label="Type" value={query.category} onChange={(e) => setQuery({ ...query, category: e.target.value })}><option>All</option>{data.categories.map((c: any) => <option key={c.businesstype}>{c.businesstype}</option>)}</Select>
        <Button onClick={() => load()}>Search</Button>
      </div>
    </Card>
    <div className="grid gap-3 sm:grid-cols-2">{data.businesses.map((b: any) => (
      <div key={b.businessid} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <Link to={`/customer/business/${b.businessid}`} className="block transition hover:text-orange-600">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">{b.businesstype || 'Shop'}</p>
          <p className="mt-1 font-display text-2xl font-semibold">{b.businessname}</p>
          <p className="mt-2 text-sm text-stone-500">{[b.cityname, b.active_offers ? `${b.active_offers} offers` : ''].filter(Boolean).join(' · ') || 'Open the shop'}</p>
        </Link>
        {b.businesstoken && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Link className="inline-flex h-9 items-center rounded-xl bg-orange-600 px-3 text-sm font-semibold text-white" to={`/menu/${b.businesstoken}`}>View menu</Link>
            <Link className="inline-flex h-9 items-center rounded-xl border border-stone-200 px-3 text-sm font-semibold" to={`/menu/${b.businesstoken}`}>Order</Link>
            <Link className="inline-flex h-9 items-center rounded-xl border border-stone-200 px-3 text-sm font-semibold" to={`/play/${b.businesstoken}`}>Play</Link>
          </div>
        )}
      </div>
    ))}{!data.businesses.length && <Empty text="No businesses match these filters." />}</div>
  </Frame>;
}

export function BusinessDetailsPage() {
  const id = window.location.pathname.split('/').pop();
  const [data, setData] = useState<any>(null);
  useEffect(() => { api(`/customer/businesses/${id}`).then(setData); }, [id]);
  const token = data?.business?.businesstoken;
  return <Frame>
    <PageTitle title={data?.business?.businessname || 'Business'} text={data?.business?.description || data?.business?.tagline || 'View the menu, order to your table, or play for coins.'} />
    <Card>
      <p className="text-sm text-stone-500">{[data?.business?.businesstype, data?.business?.address].filter(Boolean).join(' · ')}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {token && <Link className="inline-flex h-10 items-center rounded-xl bg-orange-600 px-4 text-sm font-semibold text-white" to={`/menu/${token}`}>View menu & order</Link>}
        {token && <Link className="inline-flex h-10 items-center rounded-xl border border-stone-200 bg-white px-4 text-sm font-semibold" to={`/play/${token}`}>Play</Link>}
        {token && <Link className="inline-flex h-10 items-center rounded-xl border border-stone-200 bg-white px-4 text-sm font-semibold" to={`/review/${token}`}>Review</Link>}
      </div>
    </Card>
  </Frame>;
}

export function WalletPage() {
  const [data, setData] = useState<any>({ transactions: [] });
  useEffect(() => { api('/customer/wallet').then(setData); }, []);
  return <Frame><PageTitle title="Wallet" text={`${data.customer?.totalcoins ?? 0} coins available`} gold /><Table empty="No wallet activity yet." rows={data.transactions || []} columns={[{ key: 'transactiontype', label: 'Type' }, { key: 'coins', label: 'Coins' }, { key: 'description', label: 'Detail' }, { key: 'createddate', label: 'When', render: (row) => String(row.createddate || '').slice(0, 16).replace('T', ' ') }]} /></Frame>;
}

export function HistoryPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [game, setGame] = useState('All');
  function load(next = game) { api(`/customer/history?game=${next}`).then(setRows); }
  useEffect(() => { load(); }, []);
  return <Frame><PageTitle title="Play history" /><Select label="Game" value={game} onChange={(e) => { setGame(e.target.value); load(e.target.value); }}><option>All</option><option>SpinWheel</option><option>ScratchCard</option><option>MysteryGiftBox</option><option>SlotMachine</option></Select><div className="mt-4"><Table empty="No plays yet." rows={rows} columns={[{ key: 'businessname', label: 'Business' }, { key: 'gamecode', label: 'Game', render: (row) => <Status value={row.gamecode} /> }, { key: 'coinswon', label: 'Coins' }]} /></div></Frame>;
}

export function RewardsPage({ offers = false }: { offers?: boolean }) {
  const [data, setData] = useState<any>({ rewards: [], merchants: [] });
  const [error, setError] = useState('');
  useEffect(() => { api(offers ? '/customer/offers' : '/customer/rewards').then(setData); }, [offers]);
  async function redeem(id: number) { try { await api(`/customer/rewards/${id}/redeem`, { method: 'POST' }); toastOk('Reward claimed.'); api('/customer/rewards').then(setData); } catch (err) { setError(err instanceof Error ? err.message : 'Could not redeem.'); } }
  return <Frame>
    <PageTitle title={offers ? 'Offers' : 'Rewards'} text={`${data.customer?.totalcoins ?? 0} coins available`} gold />
    {error && <Alert text={error} />}
    <div className="grid gap-3 sm:grid-cols-2">{(data.rewards || []).map((reward: any) => (
      <Card key={reward.rewardid} className="flex items-center justify-between gap-3">
        <div><p className="font-semibold">{reward.rewardname}</p><p className="mt-1 text-sm text-stone-500">{reward.businessname}</p><p className="mt-2 text-sm font-semibold text-orange-600">{reward.coinsrequired} coins</p></div>
        {!offers && <Button onClick={() => redeem(reward.rewardid)}>Redeem</Button>}
      </Card>
    ))}{!(data.rewards || []).length && <Empty text="Nothing to redeem yet." />}</div>
  </Frame>;
}

export function PrizesPage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { api('/customer/prizes').then(setRows); }, []);
  return <Frame><PageTitle title="My prizes" /><Table empty="Play a game to collect a prize." rows={rows} columns={[{ key: 'prizename', label: 'Prize', render: (row) => row.prizename || row.gamecode }, { key: 'businessname', label: 'Business' }, { key: 'coinswon', label: 'Coins' }]} /></Frame>;
}

export function MyOrdersPage() {
  const list = usePagedQuery<any>('/customer/orders');
  return <Frame>
    <PageTitle title="My orders" text="Orders you placed from a shop menu." />
    <ListToolbar from={list.from} to={list.to} onApply={list.applyDates} />
    <Table empty={list.loading ? 'Loading…' : 'No orders in this date range.'} rows={list.rows} columns={[
      { key: 'ordernumber', label: 'Order' },
      { key: 'businessname', label: 'Business' },
      { key: 'tablenumber', label: 'Station' },
      { key: 'totalamount', label: 'Total', render: (row) => `₹${Number(row.totalamount || 0).toFixed(2)}` },
      { key: 'status', label: 'Status', render: (row) => <Status value={row.status} /> },
    ]} />
    <Pager page={list.page} pageSize={list.pageSize} total={list.total} onPage={list.setPage} />
  </Frame>;
}

export function ClaimsPage() {
  const list = usePagedQuery<any>('/customer/claims');
  const [error, setError] = useState('');
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await client.post('/customer/claims', { businessId: form.get('businessId'), amount: form.get('amount'), invoiceNumber: form.get('invoiceNumber'), remarks: form.get('remarks') });
      toastOk('Claim submitted.');
      list.reload();
    } catch (err) { setError(err instanceof Error ? err.message : 'Claim failed.'); }
  }
  return <Frame>
    <PageTitle title="Purchase claims" />
    {error && <Alert text={error} />}
    <Form onSubmit={onSubmit} className="mb-6 grid gap-3 md:grid-cols-2"><Field label="Business id" name="businessId" required /><Field label="Amount" name="amount" required /><Field label="Invoice" name="invoiceNumber" /><Field label="Remarks" name="remarks" /><Button type="submit">Submit claim</Button></Form>
    <ListToolbar from={list.from} to={list.to} onApply={list.applyDates} />
    <Table empty={list.loading ? 'Loading…' : 'No claims in this date range.'} rows={list.rows} columns={[
      { key: 'businessname', label: 'Business' },
      { key: 'purchaseamount', label: 'Amount', render: (row) => `₹${row.purchaseamount}` },
      { key: 'status', label: 'Status', render: (row) => <Status value={row.status} /> },
    ]} />
    <Pager page={list.page} pageSize={list.pageSize} total={list.total} onPage={list.setPage} />
  </Frame>;
}

export function NotificationsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [filter, setFilter] = useState('All');
  const [pushState, setPushState] = useState<string>('default');
  function load(next = filter) { api(`/customer/notifications?filter=${next}`).then(setRows); }
  useEffect(() => {
    load();
    import('../../lib/push').then(({ getPushPermission }) => getPushPermission().then(setPushState));
  }, []);
  async function enablePush() {
    const { enableBrowserPush } = await import('../../lib/push');
    await enableBrowserPush();
    setPushState('granted');
    toastOk('Browser notifications enabled.');
  }
  return <Frame>
    <PageTitle title="Notifications" text="Inbox for shop offers — enable browser alerts to get real pop-ups too." />
    <Card className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-stone-950">Browser notifications</p>
        <p className="mt-1 text-sm text-stone-500">
          {pushState === 'granted' ? 'Enabled. Shop campaigns can reach you as system notifications.'
            : pushState === 'denied' ? 'Blocked in the browser. Allow notifications for this site in browser settings.'
              : pushState === 'unsupported' ? 'This browser does not support push notifications.'
                : 'Turn on so push campaigns appear even when the tab is in the background.'}
        </p>
      </div>
      {pushState !== 'granted' && pushState !== 'unsupported' && (
        <Button onClick={enablePush}>Enable notifications</Button>
      )}
    </Card>
    <div className="mb-4 flex flex-wrap gap-2">
      <Select label="Filter" value={filter} onChange={(e) => { setFilter(e.target.value); load(e.target.value); }}>
        <option>All</option><option>Unread</option><option>Offer</option><option>RewardUpdate</option><option>PurchaseApproval</option><option>CoinExpiry</option><option>OrderUpdate</option>
      </Select>
      <Button kind="ghost" onClick={() => api('/customer/notifications/read-all', { method: 'POST' }).then(() => load())}>Mark all read</Button>
    </div>
    <Table empty="No notifications." rows={rows} columns={[
      { key: 'title', label: 'Title', render: (row) => <button className="text-left font-medium" onClick={() => api(`/customer/notifications/${row.customernotificationid}/read`, { method: 'POST' }).then(() => load())}>{row.title}</button> },
      { key: 'message', label: 'Message' },
      { key: 'notificationtype', label: 'Type' },
    ]} />
  </Frame>;
}

export function ProfilePage() {
  const [profile, setProfile] = useState<any>({});
  const [message, setMessage] = useState('');
  useEffect(() => { api('/customer/profile').then(setProfile); }, []);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget).entries());
    const saved = await client.post('/customer/profile', form);
    setProfile(saved); setMessage('Profile saved.');
  }
  return <Frame><PageTitle title="Profile" /><Form onSubmit={onSubmit} className="grid max-w-xl gap-3"><Field label="Name" name="name" defaultValue={profile.customername} /><Field label="Email" name="email" defaultValue={profile.email} /><Field label="Address" name="address" defaultValue={profile.address} /><Field label="Pincode" name="pincode" defaultValue={profile.pincode} />{message && <p>{message}</p>}<Button type="submit">Save</Button></Form></Frame>;
}
