import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/auth';
import { api, asset, client } from '../../api/client';
import { ListToolbar, Pager, usePagedQuery } from '../../components/list';
import { Alert, Button, Card, Empty, Field, Form, Modal, PageTitle, Quick, Select, Stat, Status, Table } from '../../components/ui';
import { toastErr, toastOk } from '../../lib/toast';
import { LatestInboxLink, LatestNotices, NotificationsPage } from './inbox';
import { ScanQr } from './dock';

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
    <Stat label="Coins" value={data?.customer?.totalcoins ?? '—'} gold />
    <LatestNotices />
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <Stat label="Plays" value={data?.prizes ?? '—'} />
      <Stat label="Unread" value={data?.unread ?? '—'} />
    </div>
    <DashboardOffers />
    <div className="mt-4 hidden xl:block"><ScanQr /></div>
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <Quick to="/customer/explore" title="Shops" text="Places you have opened, and a search for any other shop." />
      <Quick to="/customer/my-orders" title="Orders" text="Track what you already sent to the station." />
      <Quick to="/customer/rewards" title="Rewards" text="Spend coins on something at the counter." />
      <Quick to="/customer/notifications" title="Inbox" text="Shop offers and order updates land here." />
    </div>
    <NotifyCard />
  </Frame>;
}

function DashboardOffers() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    api<{ rewards?: any[] }>('/customer/offers').then((data) => setRows(Array.isArray(data?.rewards) ? data.rewards : [])).catch(() => setRows([]));
  }, []);
  if (!rows.length) return null;
  return (
    <section className="mt-4">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-stone-950">Offers</h2>
          <p className="text-sm text-stone-500">Open the shop to redeem.</p>
        </div>
        <Link to="/customer/offers" className="text-sm font-semibold text-orange-600">All offers</Link>
      </div>
      <div className="grid gap-3">
        {rows.slice(0, 4).map((reward) => <OfferCard key={reward.rewardid} reward={reward} />)}
      </div>
    </section>
  );
}

function OfferCard({ reward }: { reward: any }) {
  const token = reward.publicslug || reward.businesstoken;
  const status = String(reward.redemptionstatus || '');
  const closed = status === 'Pending' || status === 'Approved';
  const href = token ? `/play/${token}#offers` : '/customer/offers';
  return (
    <Link to={href} className="flex items-center gap-3 rounded-3xl border border-stone-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-600 hover:shadow-lg">
      <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-amber-100 text-amber-700">
        {reward.imagepath ? <img alt="" src={asset(reward.imagepath)} className="h-full w-full object-cover" /> : (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="10" width="18" height="10" rx="2" /><path d="M3 14h18M12 10v10M12 10c-2-3-6-3.5-6-1s4 1 6 1 6-1.5 6-1-4-2-6 1z" /></svg>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold leading-snug text-stone-950">{reward.rewardname}</span>
        <span className="mt-0.5 block truncate text-sm text-stone-500">{reward.businessname}</span>
        {reward.description && <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-stone-400">{reward.description}</span>}
        <span className="mt-1 block text-sm font-semibold text-orange-600">{reward.coinsrequired} coins</span>
      </span>
      <span className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${closed ? 'bg-stone-100 text-stone-500' : 'bg-orange-600 text-white'}`}>{closed ? (status === 'Approved' ? 'Redeemed' : 'Pending') : 'Redeem'}</span>
    </Link>
  );
}

function NotifyCard() {
  const [pushState, setPushState] = useState('default');
  useEffect(() => {
    import('../../lib/push').then(({ getPushPermission }) => getPushPermission().then(setPushState));
  }, []);
  if (pushState === 'granted' || pushState === 'unsupported') return null;
  async function enable() {
    const { enableBrowserPush } = await import('../../lib/push');
    await enableBrowserPush();
    setPushState('granted');
    toastOk('Notifications enabled.');
  }
  return (
    <Card className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="font-semibold text-stone-950">Enable notifications</p>
        <p className="mt-1 text-sm text-stone-500">{pushState === 'denied' ? 'Notifications are blocked for this site. Open your browser site settings, allow notifications, then reload this page.' : 'Turn these on so shop offers and order updates reach this phone. On iPhone, add Repeat Mate to the Home Screen first.'}</p>
      </div>
      {pushState === 'denied' ? (
        <Button kind="ghost" onClick={() => window.location.reload()}>Reload after allowing</Button>
      ) : (
        <Button onClick={enable}>Enable notifications</Button>
      )}
    </Card>
  );
}

export function ExplorePage() {
  const [data, setData] = useState<any>({ businesses: [], categories: [], scope: 'visited' });
  const [query, setQuery] = useState({ search: '', lat: '', lng: '', near: '' });
  const [locating, setLocating] = useState(false);
  const nearOn = query.near === '1';

  function load(next = query) {
    // Near me is an optional filter: only send geo params when it is selected.
    const params = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => {
      if ((key === 'near' || key === 'lat' || key === 'lng') && next.near !== '1') return;
      if (value) params.set(key, value);
    });
    api(`/customer/explore?${params.toString()}`, { cache: 'no-store' } as RequestInit & { quiet?: boolean }).then(setData);
  }

  useEffect(() => { load(); }, []);

  function nearMe() {
    if (nearOn) {
      const next = { ...query, near: '', lat: '', lng: '' };
      setQuery(next);
      load(next);
      return;
    }
    if (!navigator.geolocation) { toastErr('This browser cannot read your location. Search by city or state instead.'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition((position) => {
      const next = { ...query, lat: String(position.coords.latitude), lng: String(position.coords.longitude), near: '1' };
      setQuery(next);
      setLocating(false);
      load(next);
    }, () => { setLocating(false); toastErr('Location was blocked. Type a city or state in search instead.'); }, { enableHighAccuracy: true, timeout: 8000 });
  }

  function runSearch() {
    load(query);
  }

  const visited = data.scope !== 'directory';
  return <Frame>
    <PageTitle
      title={visited ? 'Your shops' : nearOn ? 'Nearby shops' : 'Explore shops'}
      text={visited
        ? 'Places you have already opened. Search by shop, city, state, or category — or turn on Near me.'
        : nearOn
          ? 'Near me is on — search only looks in nearby / same-city shops. Tap Near me again to search all shops.'
          : 'Search by shop name, city, state, or category. Turn on Near me to limit results to shops near you.'}
    />
    <div className="mb-4 space-y-3">
      <Field
        label="Search"
        value={query.search}
        onChange={(e) => setQuery({ ...query, search: e.target.value })}
        placeholder="Shop, city, state, or category"
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); runSearch(); } }}
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-pressed={nearOn}
          className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${nearOn ? 'bg-orange-600 text-white' : 'bg-white text-stone-600 ring-1 ring-stone-200'}`}
          onClick={nearMe}
        >
          {locating ? 'Finding you…' : nearOn ? 'Near me · On' : 'Near me'}
        </button>
        <Button onClick={runSearch}>Search</Button>
      </div>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">{data.businesses.map((b: any) => (
      <div key={b.businessid} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <Link to={`/customer/business/${b.businessid}`} className="block transition hover:text-orange-600">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">{b.businesstype || 'Shop'}</p>
          <p className="mt-1 font-display text-2xl font-semibold">{b.businessname}</p>
          <p className="mt-2 text-sm text-stone-500">{[
            b.cityname && b.cityname !== 'Unknown' ? b.cityname : '',
            b.statename && b.statename !== 'Unknown' ? b.statename : '',
            b.distancekm != null ? `${Number(b.distancekm).toFixed(1)} km` : (nearOn && (b.samecity || b.cityname) ? 'Same city' : ''),
            b.active_offers ? `${b.active_offers} offers` : '',
          ].filter(Boolean).join(' · ') || b.address || 'Open the shop'}</p>
        </Link>
        {(b.publicslug || b.businesstoken) && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Link className="inline-flex h-9 items-center rounded-xl bg-orange-600 px-3 text-sm font-semibold text-white" to={`/menu/${b.publicslug || b.businesstoken}`}>Menu & order</Link>
            <Link className="inline-flex h-9 items-center rounded-xl border border-stone-200 px-3 text-sm font-semibold" to={`/play/${b.publicslug || b.businesstoken}`}>Play</Link>
          </div>
        )}
      </div>
    ))}{!data.businesses.length && (
      <Empty text={visited
        ? 'No shops yet. Scan a QR, or search by name, city, state, or category.'
        : nearOn
          ? (query.search
            ? `No nearby shop matches “${query.search}”. Turn Near me off to search all shops.`
            : 'No nearby shops yet. Shops in your city show up here once they are active — ask them to set city (and map pin if possible) on their profile.')
          : query.search
            ? `No shops match “${query.search}”. Try another name, city, state, or category.`
            : 'Search for a shop, city, state, or category to explore.'}
      />
    )}</div>
  </Frame>;
}

export function BusinessDetailsPage() {
  const id = window.location.pathname.split('/').pop();
  const [data, setData] = useState<any>(null);
  useEffect(() => { api(`/customer/businesses/${id}`).then(setData); }, [id]);
  const token = data?.business?.publicslug || data?.business?.businesstoken;
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
  return <Frame><PageTitle title="Wallet" text={`${data.customer?.totalcoins ?? 0} coins available`} gold /><Table empty="No wallet activity yet." rows={data.transactions || []} columns={[{ key: 'coins', label: 'Coins', render: (row) => `${Number(row.coins) > 0 ? '+' : ''}${row.coins} coins` }, { key: 'description', label: 'Detail', render: (row) => row.description || row.transactiontype }, { key: 'createddate', label: 'When', render: (row) => String(row.createddate || '').slice(0, 16).replace('T', ' ') }]} /></Frame>;
}

export function HistoryPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [game, setGame] = useState('All');
  function load(next = game) { api(`/customer/history?game=${next}`).then(setRows); }
  useEffect(() => { load(); }, []);
  const games = ['All', 'SpinWheel', 'ScratchCard', 'MysteryGiftBox', 'SlotMachine'];
  return <Frame>
    <PageTitle title="Play history" />
    <div className="mb-4 flex w-full min-w-0 max-w-full gap-2 overflow-x-auto">{games.map((item) => <button key={item} type="button" className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${game === item ? 'bg-orange-600 text-white' : 'bg-white text-stone-600 ring-1 ring-stone-200'}`} onClick={() => { setGame(item); load(item); }}>{item === 'All' ? 'All' : item.replace(/([A-Z])/g, ' $1').trim()}</button>)}</div>
    <Table empty="No plays yet." rows={rows} columns={[{ key: 'businessname', label: 'Business' }, { key: 'gamecode', label: 'Game', render: (row) => <Status value={row.gamecode} /> }, { key: 'coinswon', label: 'Coins', render: (row) => `${row.coinswon} coins` }]} />
  </Frame>;
}

export function RewardsPage({ offers = false }: { offers?: boolean }) {
  const [data, setData] = useState<any>({ rewards: [], merchants: [] });
  const [error, setError] = useState('');
  useEffect(() => { api(offers ? '/customer/offers' : '/customer/rewards').then(setData); }, [offers]);
  async function redeem(id: number) {
    try {
      const result = await api<{ message?: string }>(`/customer/rewards/${id}/redeem`, { method: 'POST' });
      toastOk(result.message || 'This offer is pending until the shop approves it.');
      api(offers ? '/customer/offers' : '/customer/rewards').then(setData);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not redeem.'); }
  }
  return <Frame>
    <PageTitle title={offers ? 'Offers' : 'Rewards'} text={offers ? 'Open the shop to redeem an offer.' : `${data.customer?.totalcoins ?? 0} coins available`} gold={!offers} />
    {error && <Alert text={error} />}
    <div className="grid gap-3 sm:grid-cols-2">{(data.rewards || []).map((reward: any) => {
      if (offers) return <OfferCard key={reward.rewardid} reward={reward} />;
      const status = String(reward.redemptionstatus || '');
      const closed = status === 'Pending' || status === 'Approved';
      const label = status === 'Pending' ? 'Pending' : status === 'Approved' ? 'Redeemed' : status === 'Rejected' ? 'Redeem again' : 'Redeem';
      return (
      <Card key={reward.rewardid} className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{reward.rewardname}</p>
          <p className="mt-1 text-sm text-stone-500">{reward.businessname}</p>
          <p className="mt-2 text-sm font-semibold text-orange-600">{reward.coinsrequired} coins</p>
        </div>
        {closed ? <Status value={status === 'Approved' ? 'Redeemed' : status} /> : <Button onClick={() => redeem(reward.rewardid)}>{label}</Button>}
      </Card>
      );
    })}{!(data.rewards || []).length && <Empty text="Nothing to redeem yet." />}</div>
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
      { key: 'ordernumber', label: 'Order', render: (row) => <span className="inline-flex flex-wrap items-center gap-2">{row.ordernumber} <Status value={row.status} /></span> },
      { key: 'businessname', label: 'Business' },
      { key: 'totalamount', label: 'Total', render: (row) => `₹${Number(row.totalamount || 0).toFixed(2)}` },
      { key: 'tablenumber', label: 'Station' },
    ]} />
    <Pager page={list.page} pageSize={list.pageSize} total={list.total} onPage={list.setPage} />
  </Frame>;
}

export function ClaimsPage() {
  const list = usePagedQuery<any>('/customer/claims');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [shops, setShops] = useState<{ businessid: number; businessname: string }[]>([]);
  useEffect(() => { api<{ businesses?: { businessid: number; businessname: string }[] }>('/customer/explore').then((data) => setShops(data.businesses || [])).catch(() => undefined); }, []);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await client.post('/customer/claims', { businessId: form.get('businessId'), amount: form.get('amount'), invoiceNumber: form.get('invoiceNumber'), remarks: form.get('remarks') });
      toastOk('Claim submitted.');
      setOpen(false);
      list.reload();
    } catch (err) { setError(err instanceof Error ? err.message : 'Claim failed.'); }
  }
  return <Frame>
    <PageTitle title="Purchase claims" actions={<Button onClick={() => { setError(''); setOpen(true); }}>New claim</Button>} />
    <ListToolbar from={list.from} to={list.to} onApply={list.applyDates} />
    <Table empty={list.loading ? 'Loading…' : 'No claims in this date range.'} rows={list.rows} columns={[
      { key: 'businessname', label: 'Business', render: (row) => <span className="inline-flex flex-wrap items-center gap-2">{row.businessname} <Status value={row.status} /></span> },
      { key: 'purchaseamount', label: 'Amount', render: (row) => `₹${row.purchaseamount}` },
    ]} />
    <Pager page={list.page} pageSize={list.pageSize} total={list.total} onPage={list.setPage} />
    {open && (
      <Modal title="New claim" text="Choose a shop you have already opened." onClose={() => setOpen(false)}>
        {error && <Alert text={error} />}
        {shops.length ? (
          <Form onSubmit={onSubmit} className="grid gap-3">
            <Select label="Shop" name="businessId" required><option value="">Select a shop</option>{shops.map((shop) => <option key={shop.businessid} value={shop.businessid}>{shop.businessname}</option>)}</Select>
            <Field label="Amount" name="amount" required />
            <Field label="Invoice" name="invoiceNumber" />
            <Field label="Remarks" name="remarks" />
            <Button type="submit">Submit claim</Button>
          </Form>
        ) : <Empty text="Open a shop from a QR first, then you can submit a claim for it." />}
      </Modal>
    )}
  </Frame>;
}

export { NotificationsPage };

export function ProfilePage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>({});
  const [message, setMessage] = useState('');
  const [alertsOn, setAlertsOn] = useState(false);
  useEffect(() => { api('/customer/profile').then(setProfile); }, []);
  useEffect(() => {
    import('../../lib/push').then(({ getPushPermission }) => getPushPermission().then((permission) => setAlertsOn(permission === 'granted')));
  }, []);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget).entries());
    const saved = await client.post('/customer/profile', form);
    setProfile(saved); setMessage('Profile saved.');
  }
  async function removeAccount() {
    if (!window.confirm('Delete this account? Shops keep the visit history, and you will not be able to sign in.')) return;
    await api('/customer/account/delete', { method: 'POST' });
    await auth.clear();
    navigate('/login');
  }
  return <Frame>
    <PageTitle title="Profile" />
    <Form onSubmit={onSubmit} className="grid max-w-xl gap-3"><Field label="Name" name="name" defaultValue={profile.customername} required /><Field label="Email" name="email" defaultValue={profile.email} /><Field label="Address" name="address" defaultValue={profile.address} required /><Field label="Pincode" name="pincode" defaultValue={profile.pincode} />{message && <p className="text-sm text-emerald-700">{message}</p>}<Button type="submit">Save</Button></Form>
    <div className="mt-8 grid max-w-xl gap-2">
      <LatestInboxLink />
      {alertsOn && (
        <button type="button" className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-left" onClick={() => import('../../lib/push').then(({ disableBrowserPush }) => disableBrowserPush().then(() => setAlertsOn(false)))}>
          <span>
            <span className="block text-sm font-semibold text-stone-950">Browser alerts</span>
            <span className="mt-0.5 block text-xs text-stone-500">On for this phone</span>
          </span>
          <span className="relative h-6 w-11 shrink-0 rounded-full bg-orange-600" aria-hidden="true"><span className="absolute right-0.5 top-0.5 h-5 w-5 rounded-full bg-white" /></span>
        </button>
      )}
      <Link className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold" to="/customer/purchase-claims">Claims</Link>
      <Link className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold" to="/customer/history">History</Link>
      <button type="button" className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-left text-sm font-semibold text-stone-600" onClick={() => auth.clear().then(() => navigate('/login'))}>Sign out</button>
    </div>
    <Button kind="danger" className="mt-8" onClick={removeAccount}>Delete account</Button>
  </Frame>;
}
