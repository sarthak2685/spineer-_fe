import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { client } from '../../api/client';
import { homeFor, useAuth } from '../../app/auth';
import { Lift, Rise } from '../../components/motion';
import { Alert, Area, Button, Card, Field, Form, PageTitle, Select, Brand } from '../../components/ui';
import { Marketing } from '../../components/layout/Shells';
export { HomePage } from './landing';

function useSignedInHome() {
  const auth = useAuth();
  const navigate = useNavigate();
  const redirect = Boolean(auth.ready && auth.user && !auth.user.name.startsWith('Guest_'));
  useEffect(() => {
    if (redirect && auth.user) navigate(homeFor(auth.user.role), { replace: true });
  }, [redirect, auth.user, navigate]);
  return redirect;
}

function AuthShell({ kicker, title, text, wide = false, asideTitle, asidePoints, asideSteps, children }: { kicker: string; title: string; text: string; wide?: boolean; asideTitle?: string; asidePoints?: string[]; asideSteps?: { title: string; text: string }[]; children: React.ReactNode }) {
  const points = asidePoints ?? [
    'Print one poster. The link never changes.',
    'Guests play and order in the browser.',
    'Coins stay in one wallet across visits.',
  ];
  return (
    <div className="min-h-screen bg-orange-50 lg:grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
      <aside className="relative hidden overflow-hidden bg-stone-950 text-white lg:flex lg:flex-col lg:p-12">
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(520px 280px at 20% 0%, rgba(234,88,12,.5), transparent 60%), radial-gradient(420px 240px at 90% 100%, rgba(245,158,11,.28), transparent 55%)' }} />
        <div className="relative"><Brand light /></div>
        <Rise className="relative mt-16 max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">For shops and guests</p>
          <h2 className="mt-3 font-display text-4xl font-semibold leading-tight">{asideTitle || 'One QR for games, orders, and a wallet.'}</h2>
          {asideSteps ? (
            <ol className="mt-8 space-y-5">
              {asideSteps.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span className="text-sm font-semibold text-orange-400">{String(index + 1).padStart(2, '0')}</span>
                  <span>
                    <span className="block text-sm font-semibold text-white">{step.title}</span>
                    <span className="mt-1 block text-sm text-stone-300">{step.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <ul className="mt-8 space-y-3 text-sm leading-relaxed text-white/70">
              {points.map((point) => <li key={point}>{point}</li>)}
            </ul>
          )}
          <p className="mt-10 text-xs text-white/35">Restaurants, salons, gyms, clinics, and shops.</p>
        </Rise>
      </aside>
      <div className="flex items-center justify-center px-4 py-10">
        <div className={`w-full ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
          <div className="mb-6 lg:hidden"><Brand /></div>
          <Rise>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">{kicker}</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-stone-500">{text}</p>
          </Rise>
          <Rise delay={0.12} className="mt-6 rounded-3xl border border-stone-200 bg-white p-6 shadow-xl shadow-stone-950/10 sm:p-8">{children}</Rise>
        </div>
      </div>
    </div>
  );
}

export function AboutPage() {
  return (
    <Marketing>
      <section className="px-5 py-12 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">About</p>
          <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Loyalty that lives on the counter, not in an app store.</h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-stone-600">RewardSpinner is for restaurants, cafes, salons, gyms, clinics, garages, and shops. Guests scan a QR, play, order, and keep coins. Owners approve claims, print one flyer, and see who came back.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Lift className="public-card rounded-3xl border border-stone-200 bg-white p-6"><h2 className="font-semibold">For the shop</h2><p className="mt-2 text-sm leading-relaxed text-stone-500">Menu, games, orders, claims, and a poster that never needs a new URL.</p></Lift>
            <Lift className="public-card rounded-3xl border border-stone-200 bg-white p-6"><h2 className="font-semibold">For the guest</h2><p className="mt-2 text-sm leading-relaxed text-stone-500">Play in the browser. Sign in on the same screen if they already have a wallet.</p></Lift>
          </div>
        </div>
      </section>
    </Marketing>
  );
}

export function ContactPage() {
  return (
    <Marketing>
      <section className="px-5 py-12 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">Contact</p>
          <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Talk to the platform team.</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-stone-600">For a store that already has a poster, use the support address on that flyer. For sales and onboarding, write here.</p>
          <Lift className="mt-8 max-w-xl"><Card><p className="font-semibold">support@rewardspinner.local</p><p className="mt-1 text-sm text-stone-500">We reply on business days.</p></Card></Lift>
        </div>
      </section>
    </Marketing>
  );
}

export function ErrorPage() {
  const missing = useLocation().pathname !== '/error';
  return (
    <Marketing>
      <section className="px-5 py-12 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <PageTitle title={missing ? 'Page not found' : 'Something went wrong'} text={missing ? 'That address is not part of RewardSpinner.' : 'The page could not be completed. Return home and try the flow again.'} />
          <Link to="/" className="inline-flex min-h-11 items-center rounded-full bg-orange-600 px-5 text-sm font-semibold text-white">Back home</Link>
        </div>
      </section>
    </Marketing>
  );
}

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const hold = useSignedInHome();
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await client.login({ mobile: form.get('mobile'), password: form.get('password'), remember: form.get('remember') === 'on' });
    const { toastOk } = await import('../../lib/toast');
    toastOk('Signed in.');
    auth.setSession(result.user, result.accessToken);
    navigate(result.redirect || homeFor(result.user.role));
  }
  if (hold) return null;
  const productPoints = [
    { title: 'One counter QR', text: 'Guests play games, order from the menu, and leave a review from the same link. No app download.' },
    { title: 'Coins that come back', text: 'Wins land in one wallet. Rewards and claims bring the same person to your desk again.' },
    { title: 'Desk that runs the visit', text: 'Owners manage orders, redemptions, and claims. Guests keep the same mobile account across shops.' },
  ];
  return (
    <Marketing>
      <section className="relative overflow-hidden px-5 py-12 lg:py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(720px_320px_at_15%_0%,rgba(234,88,12,.18),transparent_55%),radial-gradient(520px_280px_at_90%_20%,rgba(245,158,11,.14),transparent_50%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch">
          <Lift className="rounded-[28px] border border-stone-200 bg-white/95 p-6 shadow-xl shadow-stone-950/10 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">Welcome back</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">Sign in</h1>
            <p className="mt-2 text-sm text-stone-500">Use the 10-digit mobile on the account.</p>
            <Form onSubmit={onSubmit} className="mt-6 space-y-4">
              <Field label="Mobile" name="mobile" inputMode="numeric" autoComplete="username" required />
              <Field label="Password" name="password" type="password" autoComplete="current-password" required />
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex min-h-11 items-center gap-2 text-sm text-stone-600"><input type="checkbox" name="remember" className="h-4 w-4 rounded border-stone-300" /> Remember me</label>
                <Link to="/forgot-password" className="inline-flex min-h-11 items-center text-sm font-semibold text-orange-600">Forgot password</Link>
              </div>
              <Button type="submit" className="w-full">Continue</Button>
            </Form>
            <div className="mt-6 grid gap-3 border-t border-stone-100 pt-5 sm:grid-cols-2">
              <Link to="/register" className="rounded-2xl border border-stone-200 px-4 py-3 transition hover:border-orange-600 hover:bg-orange-50">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Shop</p>
                <p className="mt-1 text-sm font-semibold text-stone-950">Create a business</p>
              </Link>
              <Link to="/customer-register" className="rounded-2xl border border-stone-200 px-4 py-3 transition hover:border-orange-600 hover:bg-orange-50">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Guest</p>
                <p className="mt-1 text-sm font-semibold text-stone-950">Create a customer account</p>
              </Link>
            </div>
          </Lift>
          <Rise className="flex flex-col justify-center rounded-[28px] border border-orange-200/80 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-7 sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">RewardSpinner</p>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-stone-950 sm:text-4xl">
              Transform every customer visit into rewards.
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-stone-600 sm:text-base">
              Chai shops, bakeries, cafes, salons, and stores put one QR on the counter. Guests play, earn coins, order, and come back — no app download.
            </p>
            <ul className="mt-8 space-y-5">
              {productPoints.map((point, index) => (
                <li key={point.title} className="flex gap-4">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-orange-600 text-xs font-bold text-white">{String(index + 1).padStart(2, '0')}</span>
                  <span>
                    <span className="block text-sm font-semibold text-stone-950">{point.title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-stone-600">{point.text}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-sm text-stone-500">
              Owners land on the store desk. Guests open the same wallet.
            </p>
          </Rise>
        </div>
      </section>
    </Marketing>
  );
}

export function ForgotPage() {
  const hold = useSignedInHome();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [path, setPath] = useState('');
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const result = await client.forgot(String(form.get('identifier')));
      setMessage(result.message); setPath(result.resetPath); setError('');
    } catch (err) { setError(err instanceof Error ? err.message : 'Request failed.'); }
  }
  if (hold) return null;
  return <AuthShell kicker="Account recovery" title="Reset password" text="Enter the email or mobile on the account."><Form onSubmit={onSubmit} className="space-y-4">{error && <Alert text={error} />}{message && <Card><p>{message}</p>{path && <Link className="mt-3 inline-block text-sm font-semibold text-orange-600" to={path}>Open reset link</Link>}</Card>}<Field label="Email or mobile" name="identifier" /><Button type="submit" className="w-full">Send reset link</Button><p className="text-center text-sm text-stone-500"><Link className="font-semibold text-orange-600" to="/login">Back to sign in</Link></p></Form></AuthShell>;
}

export function ResetPage() {
  const hold = useSignedInHome();
  const params = new URLSearchParams(window.location.search);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const result = await client.reset({ token: params.get('token'), password: form.get('password'), confirm: form.get('confirm') });
      setMessage(result.message);
    } catch (err) { setError(err instanceof Error ? err.message : 'Reset failed.'); }
  }
  if (hold) return null;
  return <AuthShell kicker="Account recovery" title="Choose a new password" text="Both fields must match."><Form onSubmit={onSubmit} className="space-y-4">{error && <Alert text={error} />}{message && <Card>{message} <Link className="mt-3 inline-block font-semibold text-orange-600" to="/login">Sign in</Link></Card>}<Field label="New password" name="password" type="password" /><Field label="Confirm password" name="confirm" type="password" /><Button type="submit" className="w-full">Update password</Button></Form></AuthShell>;
}

export function RegisterPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const hold = useSignedInHome();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [types, setTypes] = useState<Record<string, string | number>[]>([]);
  const [countries, setCountries] = useState<{ countryid: number; countryname: string }[]>([]);
  const [states, setStates] = useState<{ stateid: number; statename: string }[]>([]);
  const [districts, setDistricts] = useState<{ districtid: number; districtname: string }[]>([]);
  const [cities, setCities] = useState<{ cityid: number; cityname: string }[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [logo, setLogo] = useState<File | null>(null);
  useEffect(() => { client.types().then(setTypes); client.countries().then(setCountries); }, []);
  useEffect(() => {
    if (!draft.countryId) { setStates([]); return; }
    let live = true;
    client.states(Number(draft.countryId)).then((rows) => { if (live) setStates(rows); });
    return () => { live = false; };
  }, [draft.countryId]);
  useEffect(() => {
    if (!draft.stateId) { setDistricts([]); return; }
    let live = true;
    client.districts(Number(draft.stateId)).then((rows) => { if (live) setDistricts(rows); });
    return () => { live = false; };
  }, [draft.stateId]);
  useEffect(() => {
    if (!draft.districtId) { setCities([]); return; }
    let live = true;
    client.cities(Number(draft.districtId)).then((rows) => { if (live) setCities(rows); });
    return () => { live = false; };
  }, [draft.districtId]);
  function collect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = { ...draft };
    new FormData(event.currentTarget).forEach((value, key) => { if (typeof value === 'string') next[key] = value; });
    setDraft(next);
    setStep((current) => Math.min(3, current + 1));
    return next;
  }
  async function finish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    Object.entries(draft).forEach(([key, value]) => form.set(key, value));
    if (logo) form.set('file', logo);
    try {
      const result = await client.registerBusiness(form);
      auth.setSession(result.user, result.accessToken);
      navigate(result.redirect);
    } catch (err) { setError(err instanceof Error ? err.message : 'Registration failed.'); }
  }
  if (hold) return null;
  const typeName = String(types.find((type) => String(type.businesstypeid) === draft.businessTypeId)?.typename || '');
  const cityName = cities.find((city) => String(city.cityid) === draft.cityId)?.cityname || '';
  const summary = [
    ['Business', draft.businessName],
    ['Type', typeName],
    ['Phone', draft.phone],
    ['Email', draft.email],
    ['Address', draft.address],
    ['City', cityName],
    ['Owner', [draft.ownerName, draft.ownerMobile, draft.ownerEmail].filter(Boolean).join(' · ')],
  ];
  return (
    <Marketing>
      <section className="relative overflow-hidden px-5 py-12 lg:py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(720px_320px_at_15%_0%,rgba(234,88,12,.18),transparent_55%),radial-gradient(520px_280px_at_90%_20%,rgba(245,158,11,.14),transparent_50%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch">
          <Lift className="rounded-[28px] border border-stone-200 bg-white/95 p-6 shadow-xl shadow-stone-950/10 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">For shop owners</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">Create your business</h1>
            <p className="mt-2 text-sm text-stone-500">Step {step} of 3. Shop details, then the owner account.</p>
            <div className="mt-6">
        <ol className="mb-6 flex items-center gap-2">
          {['Shop', 'Owner', 'Confirm'].map((label, index) => {
            const number = index + 1;
            const done = number < step;
            const current = number === step;
            return (
              <li key={label} className="flex min-w-0 flex-1 items-center gap-2">
                <button type="button" disabled={!done} onClick={() => setStep(number)} className="flex min-h-11 min-w-0 items-center gap-2 disabled:cursor-default">
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold ${current ? 'bg-orange-600 text-white' : done ? 'bg-orange-100 text-orange-600' : 'bg-stone-100 text-stone-400'}`}>{done ? '✓' : number}</span>
                  <span className={`truncate text-xs font-semibold sm:text-sm ${current ? 'text-stone-950' : done ? 'text-orange-600' : 'text-stone-400'}`}>{label}</span>
                </button>
                {index < 2 && <span className={`h-px min-w-3 flex-1 ${done ? 'bg-orange-600' : 'bg-stone-200'}`} />}
              </li>
            );
          })}
        </ol>
        {error && <Alert text={error} />}
        <Rise key={step}>
        {step === 1 && (
          <Form className="grid gap-3 sm:grid-cols-2" onSubmit={collect}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400 sm:col-span-2">Shop</p>
            <div className="sm:col-span-2"><Field label="Business name" name="businessName" required defaultValue={draft.businessName} /></div>
            <Select label="Type" name="businessTypeId" defaultValue={draft.businessTypeId}><option value="">Select</option>{types.map((type) => <option key={type.businesstypeid} value={type.businesstypeid}>{type.typename}</option>)}</Select>
            <Field label="Phone" name="phone" required defaultValue={draft.phone} />
            <Field label="Email" name="email" type="email" required defaultValue={draft.email} />
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1.5 block font-medium text-stone-600">Logo</span>
              <span className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-100 px-4 py-5 text-center transition hover:border-orange-600 hover:bg-orange-100">
                <span className="text-sm font-semibold text-stone-950">{logo?.name || 'Choose a logo'}</span>
                <span className="mt-1 text-xs text-stone-500">PNG or JPG, up to 2 MB</span>
              </span>
              <input name="file" type="file" accept="image/png,image/jpeg" className="sr-only" onChange={(event) => setLogo(event.target.files?.[0] || null)} />
            </label>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone-400 sm:col-span-2">Location</p>
            <div className="sm:col-span-2"><Area label="Address" name="address" required defaultValue={draft.address} /></div>
            <Select label="Country" name="countryId" value={draft.countryId || ''} onChange={(e) => setDraft((current) => ({ ...current, countryId: e.target.value, stateId: '', districtId: '', cityId: '' }))}><option value="">Select</option>{countries.map((c) => <option key={c.countryid} value={c.countryid}>{c.countryname}</option>)}</Select>
            <Select label="State" name="stateId" value={draft.stateId || ''} onChange={(e) => setDraft((current) => ({ ...current, stateId: e.target.value, districtId: '', cityId: '' }))}><option value="">Select</option>{states.map((s) => <option key={s.stateid} value={s.stateid}>{s.statename}</option>)}</Select>
            <Select label="District" name="districtId" value={draft.districtId || ''} onChange={(e) => setDraft((current) => ({ ...current, districtId: e.target.value, cityId: '' }))}><option value="">Select</option>{districts.map((d) => <option key={d.districtid} value={d.districtid}>{d.districtname}</option>)}</Select>
            <Select label="City" name="cityId" value={draft.cityId || ''} onChange={(e) => setDraft((current) => ({ ...current, cityId: e.target.value }))}><option value="">Select</option>{cities.map((c) => <option key={c.cityid} value={c.cityid}>{c.cityname}</option>)}</Select>
            <div className="sm:col-span-2"><Button type="submit" className="w-full sm:w-auto">Continue to owner</Button></div>
          </Form>
        )}
        {step === 2 && (
          <Form className="grid gap-3" onSubmit={collect}>
            <Field label="Owner name" name="ownerName" required defaultValue={draft.ownerName} />
            <Field label="Owner mobile" name="ownerMobile" required defaultValue={draft.ownerMobile} />
            <Field label="Owner email" name="ownerEmail" type="email" required defaultValue={draft.ownerEmail} />
            <Field label="Password" name="password" type="password" required minLength={6} defaultValue={draft.password} />
            <p className="-mt-1 text-xs text-stone-500">At least 6 characters.</p>
            <div className="flex flex-col gap-2 sm:flex-row"><Button type="button" kind="ghost" className="w-full sm:w-auto" onClick={() => setStep(1)}>Back</Button><Button type="submit" className="w-full sm:w-auto">Review</Button></div>
          </Form>
        )}
        {step === 3 && (
          <Form className="space-y-4" onSubmit={finish}>
            <div className="rounded-2xl bg-stone-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Ready to open</p>
              <dl className="mt-3 divide-y divide-stone-200/80">
                {summary.map(([label, value]) => (
                  <div key={label} className="grid gap-1 py-2.5 sm:grid-cols-[7rem_1fr] sm:gap-3">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-stone-400">{label}</dt>
                    <dd className="text-sm font-medium text-stone-950">{value || '—'}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row"><Button type="button" kind="ghost" className="w-full sm:w-auto" onClick={() => setStep(2)}>Back</Button><Button type="submit" className="w-full sm:w-auto">Create business</Button></div>
          </Form>
        )}
        </Rise>
            <p className="mt-6 text-sm text-stone-500">Already have a shop? <Link className="font-semibold text-orange-600" to="/login">Sign in</Link></p>
          </div>
          </Lift>
          <Rise className="flex flex-col justify-center rounded-[28px] border border-orange-200/80 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-7 sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">RewardSpinner</p>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-stone-950 sm:text-4xl">Open your shop from one counter QR.</h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-stone-600 sm:text-base">Three short steps. The poster link stays the same after you print it.</p>
            <ul className="mt-8 space-y-5">
              {shopPoints.map((point, index) => (
                <li key={point.title} className="flex gap-4">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-orange-600 text-xs font-bold text-white">{String(index + 1).padStart(2, '0')}</span>
                  <span>
                    <span className="block text-sm font-semibold text-stone-950">{point.title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-stone-600">{point.text}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-sm text-stone-500">Already a guest? <Link className="font-semibold text-orange-600" to="/customer-register">Create a customer account</Link></p>
          </Rise>
        </div>
      </section>
    </Marketing>
  );
}

export function CustomerRegisterPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const hold = useSignedInHome();
  const [params] = useSearchParams();
  const [error, setError] = useState('');
  const guestId = auth.user?.name?.startsWith('Guest_') ? auth.user.id : undefined;
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const result = await client.registerCustomer({ name: form.get('name'), mobile: form.get('mobile'), email: form.get('email'), password: form.get('password'), token: form.get('token') || params.get('token') || auth.user?.businessToken, guestId });
      auth.setSession(result.user, result.accessToken);
      navigate(result.redirect);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not register.'); }
  }
  if (hold) return null;
  const guestPoints = [
    { title: 'One mobile', text: 'The same 10-digit number signs you in at every shop.' },
    { title: 'Coins stay put', text: 'A win from a guest play can move onto this account.' },
    { title: 'No app', text: 'Play, order, and review in the browser from the counter QR.' },
  ];
  return (
    <Marketing>
      <section className="relative overflow-hidden px-5 py-12 lg:py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(720px_320px_at_15%_0%,rgba(234,88,12,.18),transparent_55%),radial-gradient(520px_280px_at_90%_20%,rgba(245,158,11,.14),transparent_50%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch">
          <Lift className="rounded-[28px] border border-stone-200 bg-white/95 p-6 shadow-xl shadow-stone-950/10 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">For guests</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">Create a customer account</h1>
            <p className="mt-2 text-sm text-stone-500">{guestId ? 'This keeps the coins from your guest play.' : 'Use a 10-digit mobile and a password of at least 6 characters.'}</p>
            <Form onSubmit={onSubmit} className="mt-6 space-y-4">
              {error && <Alert text={error} />}
              <Field label="Full name" name="name" required />
              <Field label="Mobile" name="mobile" required />
              <Field label="Email" name="email" />
              <Field label="Password" name="password" type="password" required />
              <Field label="Business token, if you scanned a QR" name="token" defaultValue={params.get('token') || auth.user?.businessToken || ''} />
              <Button type="submit" className="w-full">Create account</Button>
            </Form>
            <p className="mt-6 text-sm text-stone-500">Already have an account? <Link className="font-semibold text-orange-600" to="/login">Sign in</Link></p>
          </Lift>
          <Rise className="flex flex-col justify-center rounded-[28px] border border-orange-200/80 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-7 sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">RewardSpinner</p>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-stone-950 sm:text-4xl">Keep the coins from every visit.</h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-stone-600 sm:text-base">One account for games, orders, and rewards. The shop still sees you by the mobile you enter here.</p>
            <ul className="mt-8 space-y-5">
              {guestPoints.map((point, index) => (
                <li key={point.title} className="flex gap-4">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-orange-600 text-xs font-bold text-white">{String(index + 1).padStart(2, '0')}</span>
                  <span>
                    <span className="block text-sm font-semibold text-stone-950">{point.title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-stone-600">{point.text}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-sm text-stone-500">Opening a shop? <Link className="font-semibold text-orange-600" to="/register">Create a business</Link></p>
          </Rise>
        </div>
      </section>
    </Marketing>
  );
}

export function GameResult({ name, coins }: { name: string; coins: number }) {
  return <Card className="text-center"><p className="text-xs font-semibold uppercase tracking-wider text-amber-500">You won</p><p className="mt-1 text-2xl font-semibold">{name}</p><p className="mt-1 text-sm text-amber-500">{coins} coins added to the wallet</p></Card>;
}
