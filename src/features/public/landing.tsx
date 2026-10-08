import { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Marketing } from '../../components/layout/Shells';

const copy = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};
const copyItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
};

function enter(reduce: boolean | null, delay = 0) {
  if (reduce) return {};
  return {
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-40px' },
    transition: { duration: 0.45, delay, ease: 'easeOut' as const },
  };
}

export function HomePage() {
  const { hash } = useLocation();
  useEffect(() => {
    const id = hash.replace('#', '');
    if (!id) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }, [hash]);
  return (
    <Marketing>
      <Hero />
      <Logos />
      <How />
      <Features />
      <Games />
      <Journeys />
      <ProductShot />
      <Pricing />
      <Cta />
    </Marketing>
  );
}

function Hero() {
  const reduce = useReducedMotion();
  const Item = reduce ? 'div' : motion.div;
  return (
    <section className="relative bg-orange-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(234,88,12,.16),transparent_42%)]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 lg:grid-cols-2 lg:gap-12 lg:py-24">
        <Item {...(reduce ? {} : { variants: copy, initial: 'hidden', animate: 'show' })}>
          <motion.p variants={reduce ? undefined : copyItem} className="inline-flex items-center gap-2 rounded-full border border-orange-600/15 bg-white px-3 py-1 text-xs font-semibold text-orange-600">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-600" /> Gamified loyalty for real counters
          </motion.p>
          <motion.h1 variants={reduce ? undefined : copyItem} className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight text-stone-950 sm:text-6xl">Transform every customer visit into rewards.</motion.h1>
          <motion.p variants={reduce ? undefined : copyItem} className="mt-5 max-w-xl text-lg leading-relaxed text-stone-600">Chai shops, bakeries, cafes, salons, and stores put one QR on the counter. Guests play, earn coins, order, and come back. No app download.</motion.p>
          <motion.div variants={reduce ? undefined : copyItem} className="mt-8 flex flex-wrap gap-3">
            <Link to="/register" className="rounded-full bg-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-600/25 transition hover:bg-orange-700">Start your business</Link>
            <Link to="/login" className="rounded-full border border-stone-200 bg-white px-6 py-3 text-sm font-semibold text-stone-950 transition hover:border-orange-600 hover:bg-white">Owner sign in</Link>
          </motion.div>
          <p className="mt-5 text-sm text-stone-500">Already a guest? <Link to="/customer-register" className="font-semibold text-orange-600">Create a customer wallet</Link></p>
        </Item>
        <HeroShot />
      </div>
    </section>
  );
}

function HeroShot() {
  const reduce = useReducedMotion();
  return (
    <div>
      <div className="rounded-[32px] border border-white bg-white p-3 shadow-2xl shadow-stone-950/10">
        <div className="rounded-[24px] bg-stone-100 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-600">Business panel</p>
              <p className="text-lg font-semibold">Chai & Co · Dadar</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Live</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[['Scans', '4,892'], ['Coins', '1.2L'], ['Repeat', '+42%']].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-white p-3 shadow-sm">
                <p className="text-[10px] font-medium uppercase tracking-wide text-stone-400">{label}</p>
                <p className={`mt-1 text-lg font-semibold ${label === 'Coins' ? 'text-amber-500' : ''}`}>{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-8 items-end gap-1.5 rounded-2xl bg-white p-4">
            {[28, 40, 52, 44, 64, 78, 70, 86].map((h, i) => (
              <motion.div key={i} className="rounded-t-md bg-orange-600/80" style={{ height: `${h}px`, transformOrigin: 'bottom' }} initial={reduce ? false : { scaleY: 0 }} whileInView={reduce ? undefined : { scaleY: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.06, duration: 0.45, ease: 'easeOut' }} />
            ))}
          </div>
        </div>
      </div>
      <motion.div className="mt-4 w-full max-w-xs rounded-3xl border border-white bg-white p-4 shadow-xl" initial={reduce ? false : { opacity: 0, y: 18 }} animate={reduce ? undefined : { opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.45, ease: 'easeOut' }}>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">Wallet</p>
        <p className="mt-1 text-2xl font-semibold text-amber-500">450 coins</p>
        <p className="mt-2 text-xs font-semibold text-amber-500">+50 from spin wheel</p>
      </motion.div>
    </div>
  );
}

function Logos() {
  return (
    <section className="border-y border-stone-200 bg-orange-50 px-5 py-6">
      <p className="mx-auto max-w-6xl text-center text-sm text-stone-600">Built for restaurants, cafes, salons, gyms, clinics, garages, retail, and bakeries.</p>
    </section>
  );
}

function How() {
  const reduce = useReducedMotion();
  const steps = [
    ['01', 'Print the QR', 'One flyer on the counter. Change games later without reprinting.'],
    ['02', 'Guest scans', 'The phone browser opens play, menu, and review. No app.'],
    ['03', 'They play', 'Wheel, scratch, gift, or slots. The prize is already chosen.'],
    ['04', 'Coins stay', 'Signed-in guests keep the win. New guests can save it on the same screen.'],
    ['05', 'They return', 'Orders, claims, and rewards bring the same person back.'],
  ];
  return (
    <section id="how" className="scroll-mt-24 px-5 py-12 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">How it works</p>
        <h2 className="mt-2 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">From a counter flyer to a customer who comes back.</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-5">
          {steps.map(([n, title, text], index) => (
            <motion.article key={n} className="relative" {...enter(reduce, index * 0.08)}>
              {index < steps.length - 1 && (
                <motion.span className="absolute left-10 right-0 top-3 hidden h-px origin-left bg-stone-200 md:block" aria-hidden="true" initial={reduce ? false : { scaleX: 0 }} whileInView={reduce ? undefined : { scaleX: 1 }} viewport={{ once: true }} transition={{ delay: 0.12 + index * 0.08, duration: 0.45, ease: 'easeOut' }} />
              )}
              <p className="relative text-sm font-semibold text-orange-600">{n}</p>
              <h3 className="mt-3 text-base font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-500">{text}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureIcon({ name }: { name: string }) {
  const common = { viewBox: '0 0 24 24', className: 'h-5 w-5', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (name === 'Permanent QR') return <svg {...common}><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><path d="M14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z" /></svg>;
  if (name === 'Purchase claims') return <svg {...common}><path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /><path d="M14 3v5h5M8 13h8M8 17h5" /></svg>;
  if (name === 'Coin wallet') return <svg {...common}><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M16 14h2" /></svg>;
  return <svg {...common}><path d="M4 7h16M4 12h16M4 17h10" /></svg>;
}

function Features() {
  const items = [
    ['Permanent QR', 'Play, menu, and review share one printed token.'],
    ['Purchase claims', 'Guests submit a bill. You approve the coins.'],
    ['Coin wallet', 'Earn, redeem, and 30-day expiry stay on the ledger.'],
    ['Kitchen orders', 'Price comes from the menu. Status moves from pending to ready.'],
  ];
  return (
    <section id="features" className="bg-orange-50 px-5 py-12 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">Product</p>
        <h2 className="mt-2 max-w-lg text-3xl font-semibold tracking-tight sm:text-4xl">Everything the counter needs after the scan.</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {items.map(([title, text]) => (
            <article key={title} className="public-card rounded-3xl border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-600">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-orange-100 text-orange-600"><FeatureIcon name={title} /></div>
              <h3 className="mt-4 text-base font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-500">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Games() {
  const reduce = useReducedMotion();
  const games = [
    { title: 'Spin wheel', text: 'The classic counter game. The wheel stops on the prize the server already chose.', visual: <WheelStill /> },
    { title: 'Scratch card', text: 'A foil card. Guests scratch it away and the coins sit underneath.', visual: <ScratchStill /> },
    { title: 'Mystery box', text: 'Three boxes on a shelf. The guest picks one and the prize opens.', visual: <GiftStill /> },
    { title: 'Slot machine', text: 'Three reels stop on the result. Matching symbols for the bigger prizes.', visual: <SlotStill /> },
  ];
  return (
    <section id="games" className="scroll-mt-24 px-5 py-12 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">Games</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Four games. One QR.</h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-stone-500">The shop picks which game the QR opens.</p>
        <div className="mt-10 grid gap-4 lg:grid-cols-4">
          {games.map((game, index) => (
            <motion.article key={game.title} className="public-card overflow-hidden rounded-3xl border border-stone-200 bg-white" {...enter(reduce, index * 0.08)} whileHover={reduce ? undefined : { y: -4 }}>
              <div className="grid h-40 place-items-center bg-stone-100">{game.visual}</div>
              <div className="p-5">
                <h3 className="font-semibold">{game.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">{game.text}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function WheelStill() {
  const reduce = useReducedMotion();
  return (
    <div className="relative h-28 w-28">
      <motion.div className="h-full w-full rounded-full border-[10px] border-white bg-[conic-gradient(#ea580c_0_25%,#fcd34d_0_50%,#c2410c_0_75%,#0c0a09_0_100%)] shadow-md" initial={reduce ? false : { rotate: 0 }} whileInView={reduce ? undefined : { rotate: 90 }} viewport={{ once: true }} transition={{ duration: 0.9, ease: 'easeOut' }} />
      <span className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1 rounded-sm bg-amber-400" />
    </div>
  );
}
function ScratchStill() {
  return (
    <div className="relative grid h-24 w-36 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-stone-300 to-stone-400 text-xs font-semibold text-stone-700">
      Scratch
      <span className="absolute -right-3 -top-3 h-8 w-8 rotate-45 bg-stone-100" />
    </div>
  );
}
function GiftStill() {
  const reduce = useReducedMotion();
  return (
    <div className="flex items-end gap-2">
      {[0, 1, 2].map((n) => (
        <span key={n} className="relative h-16 w-10 rounded-xl bg-orange-600 shadow-sm">
          <motion.span className={`absolute inset-x-1 h-2 rounded-sm bg-orange-800 ${n === 1 ? '-top-1.5' : 'top-1'}`} initial={false} whileInView={n === 1 && !reduce ? { y: -4 } : undefined} viewport={{ once: true }} transition={{ duration: 0.35, ease: 'easeOut' }} />
        </span>
      ))}
    </div>
  );
}
function SlotStill() {
  return <div className="flex gap-1 rounded-2xl bg-stone-950 p-2">{['7', '★', '7'].map((s, i) => <div key={i} className="grid h-14 w-10 place-items-center rounded-lg bg-white text-lg font-semibold">{s}</div>)}</div>;
}

function Journeys() {
  const reduce = useReducedMotion();
  const customer = ['Scan the counter QR', 'Keep the coins in one wallet', 'Redeem them on the next visit'];
  const business = ['Register the store', 'Print the QR flyer', 'Set games and prizes', 'Approve claims and orders', 'Watch repeat visits grow'];
  return (
    <section id="industries" className="bg-orange-50 px-5 py-12 lg:py-20">
      <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-2">
        <motion.article className="public-card rounded-3xl border border-stone-200 bg-white p-6 shadow-sm transition hover:border-orange-600 sm:p-8" {...enter(reduce)} whileHover={reduce ? undefined : { y: -2 }}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">Customer path</p>
          <h3 className="mt-2 text-2xl font-semibold">Scan, play, keep the coins</h3>
          <ol className="mt-6 space-y-3">{customer.map((item, i) => <li key={item} className="flex gap-3 text-sm text-stone-600"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-orange-100 text-xs font-semibold text-orange-600">{i + 1}</span>{item}</li>)}</ol>
          <Link to="/customer-register" className="mt-8 inline-flex rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white">Create a customer account</Link>
        </motion.article>
        <motion.article className="public-card rounded-3xl border border-stone-200 bg-white p-6 shadow-sm transition hover:border-orange-600 sm:p-8" {...enter(reduce, 0.1)} whileHover={reduce ? undefined : { y: -2 }}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">Business path</p>
          <h3 className="mt-2 text-2xl font-semibold">Run the counter from one desk</h3>
          <ol className="mt-6 space-y-3">{business.map((item, i) => <li key={item} className="flex gap-3 text-sm text-stone-600"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-orange-100 text-xs font-semibold text-orange-600">{i + 1}</span>{item}</li>)}</ol>
          <Link to="/register" className="mt-8 inline-flex rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700">Create a business</Link>
        </motion.article>
      </div>
    </section>
  );
}

function ProductShot() {
  return (
    <section className="px-5 py-12 lg:py-20">
      <div className="mx-auto max-w-6xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">Workspace</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">Claims and orders on one desk.</h2>
        <div className="mt-10 overflow-hidden rounded-[32px] border border-stone-200 bg-white text-left shadow-2xl shadow-stone-950/10">
          <div className="border-b border-stone-200 bg-stone-100 px-4 py-3 text-xs font-medium text-stone-700">Store desk</div>
          <div className="grid lg:grid-cols-2">
            <div className="border-b border-stone-200 p-5 lg:border-b-0 lg:border-r">
              <p className="text-sm font-semibold">Claim waiting</p>
              <div className="mt-3 rounded-xl bg-stone-100 px-3 py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span>Lunch bill · ₹480</span>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">Pending</span>
                </div>
                <p className="mt-1 text-xs text-stone-500">40 coins if you approve</p>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm font-semibold">Order</p>
              <div className="mt-3 rounded-xl bg-stone-100 px-3 py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span>Masala chai · ₹40</span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Ready</span>
                </div>
                <p className="mt-1 text-xs text-stone-500">Counter pickup</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const reduce = useReducedMotion();
  const plans = [
    { name: 'Starter', price: '₹999', note: '/month', text: 'Single kiosks, cafes, and bakeries.', items: ['1,000 scans / month', 'All four games', 'Default push templates', 'Basic analytics'], to: '/register', cta: 'Get started' },
    { name: 'Business', price: '₹1,999', note: '/month', text: 'Retail stores, salons, gyms, restaurants.', items: ['5,000 scans / month', 'Custom prize odds', 'Campaign segments', 'Priority support'], to: '/register', cta: 'Go pro', featured: true },
    { name: 'Enterprise', price: 'Talk to us', note: '', text: 'Franchises and multi-store brands.', items: ['Unlimited scans', 'Custom branding', 'API access', 'Dedicated support'], to: '/contact', cta: 'Contact sales' },
  ];
  return (
    <section id="pricing" className="scroll-mt-24 bg-orange-50 px-5 py-12 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">Pricing</p>
        <h2 className="mt-2 text-center text-3xl font-semibold tracking-tight">Simple plans. The same product.</h2>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.article key={plan.name} className={`public-card flex flex-col rounded-3xl border bg-white p-6 transition hover:border-orange-600 ${plan.featured ? 'border-2 border-orange-600 shadow-md' : 'border-stone-200'}`} {...enter(reduce, index * 0.08)} whileHover={reduce ? undefined : { y: -2 }}>
              {plan.featured && <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-orange-600">Most popular</p>}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-stone-500">{plan.text}</p>
              <p className="mt-5 text-3xl font-semibold">{plan.price}<span className="text-base font-normal opacity-60">{plan.note}</span></p>
              <ul className="mt-5 space-y-2 text-sm text-stone-600">{plan.items.map((item) => <li key={item}>• {item}</li>)}</ul>
              <Link to={plan.to} className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full bg-orange-600 px-4 text-center text-sm font-semibold text-white transition hover:bg-orange-700">{plan.cta}</Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Cta() {
  return (
    <section className="px-5 py-12 lg:py-16">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-[32px] border border-stone-200 bg-white px-6 py-12 sm:px-10 sm:py-14 lg:flex-row lg:items-center">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">Ready to grow the next visit?</h2>
          <p className="mt-3 max-w-xl text-stone-500">Join shops using RewardSpinner to print one QR, run four games, and keep a wallet for every guest.</p>
        </div>
        <Link to="/register" className="shrink-0 rounded-full bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-700">Start your business</Link>
      </div>
    </section>
  );
}
