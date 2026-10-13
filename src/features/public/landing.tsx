import { FormEvent, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { api, howVideoSrc } from '../../api/client';
import { HowVideoModal } from '../../components/how-player';
import { Marketing } from '../../components/layout/Shells';
import { openDemo } from './demo-request';
import { digitsOnly, isTenDigitMobile } from '../../lib/mobile';
import { toastOk } from '../../lib/toast';

const ease = [0.22, 1, 0.36, 1] as const;

const businesses = [
  { id: 'cafe', label: 'Café Owner', chain: ['Café', 'Table QR', 'Digital Menu', 'Spin the Wheel', 'Free Latte Coupon', 'Sunday Repeat Visit'] },
  { id: 'restaurant', label: 'Restaurant Owner', chain: ['Restaurant', 'Table QR', 'Menu & Review', '5-Star Google Review', 'Dessert Voucher', 'Next Table Booking'] },
  { id: 'salon', label: 'Salon Owner', chain: ['Salon', 'Mirror QR', 'Services & Offers', 'Cashback Coins', '20% Hair-Care Coupon', 'Auto Re-booking'] },
  { id: 'spa', label: 'Spa Owner', chain: ['Spa', 'Reception QR', 'Wellness Menu', 'Relax & Earn Coins', 'Massage Upgrade Offer', 'Monthly Ritual'] },
  { id: 'hotel', label: 'Hotel Owner', chain: ['Hotel', 'Room QR', 'In-room Dining & Spa', 'Loyalty Wallet', 'Win-Back Alert Next Trip', 'Direct Rebooking'] },
  { id: 'retail', label: 'Retail Store', chain: ['Retail', 'Billing Counter QR', 'Coins on Every Bill', 'Instant Coupon', 'New Stock Alert', 'Repeat Purchase'] },
  { id: 'bakery', label: 'Bakery', chain: ['Bakery', 'Counter QR', 'Play & Win', 'Daily Coins', 'Weekend Croissant Offer', 'Regular Customer'] },
  { id: 'gym', label: 'Gym', chain: ['Gym', 'Entry QR', 'Check-in Streak', 'Fitness Rewards', 'Renewal Offer', 'Long-term Member'] },
  { id: 'beauty', label: 'Beauty Business', chain: ['Beauty', 'Chair QR', 'Follow Socials', 'Beauty Coins', 'Referral Coupon', 'Loyal Clientele'] },
  { id: 'local', label: 'Local Business', chain: ['Local', 'Door QR', 'Engage & Collect', 'Wallet Balance', 'Festive Offer Push', 'Neighborhood Regular'] },
];

const shopNames = ['Urban Brew Café', 'GlowNest Salon', 'Relaxora Spa', 'Royal Bites', 'StyleCraft Studio', 'Hotel Vista'];

const loop = [
  'Customer scans',
  'Opens digital menu',
  'Plays games',
  'Earns coins',
  'Stores coins in wallet',
  'Redeems rewards & coupons',
  'Follows social media',
  'Leaves a review',
  'Receives offers',
  'Returns again',
];

const withoutLoop = ['Customer visits', 'Pays', 'Leaves', 'No relationship'];
const withLoop = ['Customer visits', 'Engages', 'Earns', 'Saves', 'Redeems', 'Returns'];

const features = [
  { title: 'Digital QR Menu', text: 'A contactless menu live in minutes — items, prices, photos and offers, no app needed.' },
  { title: 'Play & Earn Games', text: 'Scratch cards, quizzes and mini-games that turn waiting time into fun time.' },
  { title: 'Reward Spinner', text: 'A spin wheel with prizes you fully control — discounts, freebies, coins.' },
  { title: 'Customer Coins', text: 'Every visit, order and review earns coins automatically.' },
  { title: 'Digital Wallet', text: 'Coins, coupons and offers live in one customer wallet.' },
  { title: 'Loyalty & Bill Rewards', text: 'Points on every bill with rewards that keep regulars coming back.' },
  { title: 'Coupons & Offers', text: 'Launch targeted coupons for festivals, weekdays or slow hours.' },
  { title: 'Offer alerts', text: 'Reach customers with offers they opted into — no app download required.' },
  { title: 'Customer CRM', text: 'Every visitor captured in a simple customer list on your desk.' },
  { title: 'Customer Segmentation', text: 'Group customers by visits, spend or behavior, then send the right offer.' },
  { title: 'Win-Back Campaigns', text: 'Re-engage customers who have stopped coming back before they are gone.' },
  { title: 'Google Reviews', text: 'Turn happy moments into 5-star Google reviews at the right time.' },
  { title: 'Social Media Engagement', text: 'Grow followers when customers follow you to unlock rewards.' },
  { title: 'Slow-hour offers', text: 'Move quiet hours and surplus with a flash offer to nearby regulars.' },
  { title: 'Analytics', text: 'See what actually works — visits, redemptions and repeat guests.', wide: true },
];

const steps = [
  { label: 'SCAN', title: 'Scan the QR', text: 'Customer scans the QR at the table, mirror, counter or door — your digital menu opens instantly in the browser.' },
  { label: 'ENGAGE', title: 'Engage & play', text: 'While they browse or wait, they spin the wheel, scratch a card or open a mystery box. Every interaction is a moment of delight.' },
  { label: 'EARN', title: 'Earn coins', text: 'Visits, orders, reviews and follows credit coins to the customer’s wallet.' },
  { label: 'REDEEM', title: 'Redeem rewards', text: 'Coins become coupons, freebies and offers — redeemed in one tap at the counter.' },
  { label: 'RETURN', title: 'Return again', text: 'Timed offers, win-back messages and wallet balances pull the customer back through your door.' },
];

const categories = ['Cafés', 'Restaurants', 'Salons', 'Spas', 'Hotels', 'Bakeries', 'Gyms', 'Retail Stores', 'Beauty Businesses', 'Local Businesses'];

const plans = [
  { id: 'starter', name: 'Starter', monthly: 999, blurb: 'One outlet going digital with menus, coins and rewards.', features: ['1 outlet', 'Digital QR Menu', 'Customer Coins & Wallet', 'Four games, including the spinner', 'Basic customer list', 'Email support'], cta: 'Book a Free Demo' },
  { id: 'growth', name: 'Business', monthly: 1999, popular: true, blurb: 'For businesses that want engagement on every visit.', features: ['Up to 3 outlets', 'Everything in Starter', 'Coupons & Offers', 'Google Reviews', 'Customer groups', 'Priority support'], cta: 'Book a Free Demo' },
  { id: 'scale', name: 'Enterprise', monthly: 0, blurb: 'Multi-outlet brands running full retention campaigns.', features: ['Unlimited outlets', 'Everything in Business', 'Win-back offers', 'Campaign view of repeat visits', 'Slow-hour offers', 'Dedicated onboarding'], cta: 'Book a Free Demo' },
];

const compare = [
  { label: 'Digital QR Menu', starter: true, growth: true, scale: true },
  { label: 'Customer Coins & Wallet', starter: true, growth: true, scale: true },
  { label: 'Reward Spinner & games', starter: true, growth: true, scale: true },
  { label: 'Coupons & Offers', starter: false, growth: true, scale: true },
  { label: 'Google Reviews', starter: false, growth: true, scale: true },
  { label: 'Customer groups', starter: false, growth: true, scale: true },
  { label: 'Win-back offers', starter: false, growth: false, scale: true },
  { label: 'Dedicated onboarding', starter: false, growth: false, scale: true },
  { label: 'Outlets included', starter: '1', growth: '3', scale: 'Unlimited' },
];

const faqs = [
  { q: 'Do my customers need to download an app?', a: 'No. Customers scan your QR code with their phone camera and everything opens in the browser — menu, games, wallet and rewards. No download, no sign-up friction.' },
  { q: 'How does the digital QR menu work?', a: 'You get a digital menu linked to your QR code. Update items, prices and offers from your desk anytime — changes go live on every table without reprinting the flyer.' },
  { q: 'Can I control the games and prizes?', a: 'Yes. You decide the game the QR opens, the prizes, and the limits. The result is chosen before the wheel, scratch card, box, or slots finish.' },
  { q: 'What are coins and how do customers earn them?', a: 'Coins are your loyalty currency. Customers earn them for playing, approved bill claims, and return visits. You set what a coin is worth at the counter.' },
  { q: 'How do customers spend their rewards?', a: 'Coins sit in each customer’s wallet. They redeem them for the offers you publish, and you confirm the redemption at the counter.' },
  { q: 'Can I target offers to specific customers?', a: 'Business and Enterprise plans group guests by how often they visit, so a quiet regular can get a different offer from a first-time scan.' },
  { q: 'Will messages feel like spam?', a: 'Offers go to people who already scanned your QR and kept a wallet. You send birthday rewards, wallet balances, and festival coupons — not a blast to strangers.' },
  { q: 'How do Google reviews work?', a: 'Right after a good visit, the guest can be asked for a Google review, often alongside a small coin reward. The ask lands while the visit is still fresh.' },
  { q: 'What does Repeat Mate cost?', a: 'Starter is ₹999 a month, Business is ₹1,999 a month, and Enterprise is quoted for your outlets. Yearly billing is ten months of the monthly price. Book a free demo for a number that matches your size.' },
  { q: 'How long does setup take? Do I need hardware?', a: 'Most counters go live the same day. You print the QR we generate. The desk and the guest flow both run in the browser.' },
  { q: 'Is customer data safe?', a: 'Guest name, mobile, and email are stored so the shop can recognise an order, a win, and a bill claim. Shop owners see their own guests, not another shop’s list.' },
  { q: 'What support do I get?', a: 'Every plan includes email support. Business adds priority responses, and Enterprise includes a dedicated onboarding.' },
];

const demoPoints = [
  { title: 'A 30-minute walkthrough', text: 'Live on a real desk — menu, games, coins, coupons and the customer list, tuned to your business type.' },
  { title: 'Your own demo QR', text: 'We generate a working QR for your counter so you can try the full customer loop yourself.' },
  { title: 'Honest pricing on the call', text: 'We quote for your outlets and volume. No fake discounts, no inflated customer numbers.' },
];

const businessTypes = ['Café', 'Restaurant', 'Salon', 'Spa', 'Hotel', 'Bakery', 'Gym', 'Retail Store', 'Beauty Business', 'Local Business', 'Other'];

const headline = [
  [{ t: 'Turn every customer' }],
  [{ t: 'visit into a' }],
  [{ t: 'repeat', grad: true }, { t: ' customer.' }],
];

function scrollToId(id: string) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
}

export function HomePage() {
  const { hash } = useLocation();
  useEffect(() => {
    const id = hash.replace('#', '');
    if (!id) return;
    scrollToId(id);
  }, [hash]);
  return (
    <Marketing>
      <Hero />
      <BusinessTypes />
      <Names />
      <What />
      <Why />
      <Features />
      <How />
      <Categories />
      <Pricing />
      <Faq />
      <Demo />
    </Marketing>
  );
}

function Eyebrow({ children }: { children: string }) {
  return <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-orange-600">{children}</p>;
}

function Hero() {
  const reduce = useReducedMotion();
  const [clips, setClips] = useState<{ id: string; title: string }[]>([]);
  const [watch, setWatch] = useState(false);
  useEffect(() => {
    api<{ videos?: { id: string; title: string }[] }>('/public/how-video', { quiet: true }).then((row) => setClips(row?.videos || [])).catch(() => setClips([]));
  }, []);
  return (
    <>
    <section id="hero" className="relative overflow-hidden bg-orange-50">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-orange-200/70 blur-3xl" />
      <div className="hero-dots pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-14 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8 lg:py-20">
        <div>
          <motion.p initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }} className="mb-7 inline-flex items-center gap-2 rounded-full border border-orange-600/15 bg-white px-4 py-1.5 text-stone-700 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-600" />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em]">QR engagement & loyalty platform</span>
          </motion.p>
          <h1 className="font-display text-4xl font-semibold leading-[1.04] tracking-tight text-stone-950 sm:text-5xl lg:text-[4.4rem]" data-testid="hero-headline">
            {headline.map((line, index) => (
              <span key={index} className="block overflow-hidden pb-1">
                <motion.span className="block" initial={reduce ? false : { y: '112%' }} animate={{ y: 0 }} transition={{ duration: 1, delay: 0.15 + index * 0.13, ease }}>
                  {line.map((part) => (
                    <span key={part.t} className={part.grad ? 'text-orange-600' : undefined}>{part.t}</span>
                  ))}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p initial={reduce ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.65, ease }} className="mt-7 max-w-xl text-base leading-relaxed text-stone-600 md:text-lg">
            The menu, the game, the coins, and the next visit all open in the browser after one scan.
          </motion.p>
          <motion.div initial={reduce ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.8, ease }} className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <button type="button" onClick={openDemo} className="group inline-flex items-center gap-2 rounded-full bg-orange-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-600/30 transition hover:scale-[1.03] hover:bg-orange-700 active:scale-[0.98]">
              Book a Free Demo
              <Arrow className="transition group-hover:translate-x-1" />
            </button>
            <button type="button" onClick={() => { if (clips.length) setWatch(true); else scrollToId('how'); }} className="group inline-flex items-center gap-2.5 rounded-full border border-stone-200 bg-white px-6 py-3.5 text-sm font-semibold text-stone-950 transition hover:border-orange-600">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-orange-100 text-orange-600 transition group-hover:bg-orange-600 group-hover:text-white">
                <Play />
              </span>
              Watch How It Works
            </button>
          </motion.div>
          <p className="mt-4 text-sm text-stone-500">No app for the guest · Opens in the browser · One QR at the table</p>
          <p className="mt-2 text-sm text-stone-500">Ready to go live? <Link to="/register" className="font-semibold text-orange-600">Start your business</Link></p>
        </div>
        <PhoneJourney />
      </div>
    </section>
    {watch && clips.length > 0 && <HowVideoModal videos={clips.map((clip) => ({ ...clip, src: howVideoSrc(false, clip.id) }))} onClose={() => setWatch(false)} />}
    </>
  );
}

function PhoneJourney() {
  const reduce = useReducedMotion();
  const frames = ['Menu', 'Spin', 'Wallet'];
  const [frame, setFrame] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (reduce || paused) return;
    const id = window.setInterval(() => setFrame((value) => (value + 1) % frames.length), 2400);
    return () => window.clearInterval(id);
  }, [reduce, paused, frames.length]);
  return (
    <div className="relative mx-auto w-full max-w-sm pb-16" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="rounded-[36px] border border-white bg-white p-3 shadow-2xl shadow-stone-950/10">
        <div className="overflow-hidden rounded-[28px] bg-stone-950 text-white">
          <div className="flex items-center justify-between px-5 pb-2 pt-4 text-[11px] text-white/50">
            <span>Repeat Mate</span>
            <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 font-semibold text-emerald-300">Live</span>
          </div>
          <div className="relative h-72 px-4 pb-5">
            <AnimatePresence mode="wait">
              <motion.div key={frames[frame]} initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: -12 }} transition={{ duration: 0.35 }} className="absolute inset-x-4 top-0">
                {frame === 0 && <PhoneMenu />}
                {frame === 1 && <PhoneSpin />}
                {frame === 2 && <PhoneWallet />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
      <div className="absolute -left-2 bottom-10 rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-xl sm:-left-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">This visit</p>
        <p className="mt-1 text-sm font-semibold text-stone-950">+50 coins · spin wheel</p>
      </div>
      <div className="mt-4 flex justify-center gap-2">
        {frames.map((label, index) => (
          <button key={label} type="button" aria-label={label} aria-pressed={index === frame} onClick={() => setFrame(index)} className={`h-2.5 rounded-full transition ${index === frame ? 'w-6 bg-orange-600' : 'w-2.5 bg-stone-300'}`} />
        ))}
      </div>
    </div>
  );
}

function PhoneMenu() {
  return (
    <div>
      <p className="text-xs text-white/50">Chai & Co · Dadar</p>
      <p className="mt-1 font-display text-2xl font-semibold">Digital menu</p>
      <div className="mt-4 space-y-2">
        {[['Masala chai', '₹40'], ['Bun maska', '₹50'], ['Cold coffee', '₹90']].map(([name, price]) => (
          <div key={name} className="flex items-center justify-between rounded-2xl bg-white/10 px-3 py-3 text-sm">
            <span>{name}</span>
            <span className="font-semibold text-amber-300">{price}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhoneSpin() {
  const reduce = useReducedMotion();
  return (
    <div className="grid place-items-center pt-4">
      <motion.div className="h-36 w-36 rounded-full border-8 border-white/10 bg-[conic-gradient(#ea580c_0_25%,#fcd34d_0_50%,#c2410c_0_75%,#fff_0_100%)]" animate={reduce ? undefined : { rotate: 360 }} transition={{ duration: 2.2, ease: 'easeOut' }} />
      <p className="mt-4 text-sm font-semibold">Spin the wheel</p>
      <p className="text-xs text-white/50">Prize is already chosen</p>
    </div>
  );
}

function PhoneWallet() {
  return (
    <div>
      <p className="text-xs text-white/50">Wallet</p>
      <p className="mt-1 font-display text-4xl font-semibold text-amber-300">450</p>
      <p className="text-sm text-white/60">coins ready to redeem</p>
      <div className="mt-5 rounded-2xl bg-white/10 p-3 text-sm">
        <p className="font-semibold">Free latte coupon</p>
        <p className="mt-1 text-xs text-white/50">Show this at the counter</p>
      </div>
    </div>
  );
}

function FlowArrow({ direction, reduce, delay }: { direction: 'right' | 'down'; reduce: boolean | null; delay: number }) {
  const vertical = direction === 'down';
  return (
    <motion.span aria-hidden className={`relative z-10 grid shrink-0 place-items-center bg-white text-orange-600 ${vertical ? 'py-0.5' : ''}`} initial={reduce ? false : { opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay, duration: 0.35, ease }}>
      <span className={vertical ? 'inline-grid rotate-90' : 'inline-grid'}>
        <motion.svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" animate={reduce ? undefined : { x: [0, 4, 0] }} transition={reduce ? undefined : { duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: delay + 0.15 }}>
          <path d="M4 10h12M12 6l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      </span>
    </motion.span>
  );
}

function LoopStep({ step, index, on, reduce }: { step: string; index: number; on: boolean; reduce: boolean | null }) {
  return (
    <motion.div className={`relative z-10 flex min-h-24 w-full min-w-0 flex-1 flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border px-3 py-3 text-center ${on ? 'border-orange-600 text-white shadow-md shadow-orange-600/25' : 'border-stone-200 bg-orange-50 text-stone-800'}`} initial={reduce ? false : { opacity: 0, y: 14, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.08 + index * 0.07, duration: 0.4, ease }}>
      {on && !reduce && <motion.span layoutId="loop-fill" className="absolute inset-0 bg-orange-600" transition={{ type: 'spring', bounce: 0.18, duration: 0.45 }} />}
      {on && reduce && <span className="absolute inset-0 bg-orange-600" />}
      <span className={`relative z-10 text-[11px] font-semibold uppercase tracking-[0.14em] ${on ? 'text-orange-100' : 'text-orange-600'}`}>Step {index + 1}</span>
      <span className="relative z-10 text-sm font-semibold leading-snug">{step}</span>
    </motion.div>
  );
}

function LoopFlow({ chain, active, reduce }: { chain: string[]; active: number; reduce: boolean | null }) {
  return (
    <ol className="relative mx-auto mt-6 flex max-w-sm flex-col lg:max-w-none lg:flex-row lg:items-stretch lg:before:pointer-events-none lg:before:absolute lg:before:left-6 lg:before:right-6 lg:before:top-1/2 lg:before:h-px lg:before:bg-orange-200">
      {chain.map((step, index) => (
        <li key={step} className="contents">
          {index > 0 && (
            <>
              <span className="flex justify-center py-1 lg:hidden">
                <FlowArrow direction="down" reduce={reduce} delay={0.08 + index * 0.07} />
              </span>
              <span className="hidden lg:grid lg:place-items-center lg:px-1">
                <FlowArrow direction="right" reduce={reduce} delay={0.08 + index * 0.07} />
              </span>
            </>
          )}
          <LoopStep step={step} index={index} on={index === active} reduce={reduce} />
        </li>
      ))}
    </ol>
  );
}

function BusinessTypes() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(2);
  const [beat, setBeat] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (reduce || paused) return;
    const id = window.setInterval(() => setActive((value) => (value + 1) % businesses.length), 3400);
    return () => window.clearInterval(id);
  }, [reduce, paused]);
  useEffect(() => {
    if (reduce || paused) return;
    const id = window.setInterval(() => setBeat((value) => value + 1), 1100);
    return () => window.clearInterval(id);
  }, [reduce, paused]);
  const current = businesses[active];
  return (
    <section id="business-types" className="border-y border-orange-100 bg-white py-12 sm:py-16" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <p className="px-5 text-center text-sm text-stone-500">Made for every customer-facing business</p>
      <div className="marquee-hover-pause relative mt-5 overflow-hidden" style={{ maskImage: 'linear-gradient(90deg, transparent, black 8%, black 92%, transparent)' }}>
        <div className={`flex gap-3 pr-3 ${reduce ? 'flex-wrap justify-center px-5' : 'landing-marquee w-max'}`} style={{ ['--marquee-duration' as string]: '38s' }}>
          {(reduce ? businesses : [...businesses, ...businesses]).map((item, index) => {
            const selected = item.id === current.id;
            const hidden = !reduce && index >= businesses.length;
            return (
              <button key={`${item.id}-${index}`} type="button" aria-hidden={hidden || undefined} tabIndex={hidden ? -1 : 0} onClick={() => setActive(businesses.findIndex((entry) => entry.id === item.id))} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${selected ? 'border-orange-600 bg-orange-600 text-white' : 'border-stone-200 bg-orange-50 text-stone-700 hover:border-orange-600'}`}>
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-7xl px-5">
        <AnimatePresence mode="wait">
          <motion.div key={current.id} initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: -8 }} transition={{ duration: 0.28, ease }}>
            <p className="text-center font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">The Repeat Mate loop · {current.label}</p>
            <LoopFlow chain={current.chain} active={beat % current.chain.length} reduce={reduce} />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function Names() {
  const reduce = useReducedMotion();
  const items = reduce ? shopNames : [...shopNames, ...shopNames];
  return (
    <section className="border-b border-orange-100 bg-orange-50">
      <motion.h2 className="mx-auto max-w-4xl px-5 pt-14 text-center font-display text-3xl font-semibold leading-tight tracking-tight text-stone-950 sm:pt-16 sm:text-4xl lg:text-5xl" initial={reduce ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.6 }} transition={{ duration: 0.6, ease }}>
        Trusted by <span className="text-orange-600">cafés, salons, hotels and local shops</span>
      </motion.h2>
      <div className="marquee-hover-pause mt-8 overflow-hidden pb-8" style={{ maskImage: 'linear-gradient(90deg, transparent, black 12%, black 88%, transparent)' }}>
      <div className={`flex items-center ${reduce ? 'flex-wrap justify-center gap-x-8 px-5' : 'landing-marquee w-max'}`} style={{ ['--marquee-duration' as string]: '70s' }}>
        {items.map((name, index) => (
          <span key={`${name}-${index}`} aria-hidden={!reduce && index >= shopNames.length ? true : undefined} className="flex items-center px-6 text-sm font-semibold text-stone-500">
            <span className="mr-6 h-1.5 w-1.5 rounded-full bg-orange-600" />
            {name}
          </span>
        ))}
        </div>
      </div>
    </section>
  );
}

function LoopIcon({ index }: { index: number }) {
  const common = { viewBox: '0 0 24 24', className: 'h-3.5 w-3.5', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const };
  if (index === 0) return <svg {...common}><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2z" /></svg>;
  if (index === 1) return <svg {...common}><path d="M6 7h12M6 12h12M6 17h8" /></svg>;
  if (index === 2) return <svg {...common}><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></svg>;
  if (index === 3) return <svg {...common}><circle cx="12" cy="12" r="8" /><path d="M12 8v8M9.5 10.5h4a2 2 0 0 1 0 3h-4" /></svg>;
  if (index === 4) return <svg {...common}><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M16 15h2" /></svg>;
  if (index === 5) return <svg {...common}><path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" /></svg>;
  if (index === 6) return <svg {...common}><circle cx="6" cy="12" r="2" /><circle cx="16" cy="7" r="2" /><circle cx="16" cy="17" r="2" /><path d="M8 12h6M14.2 8.2 8 11M14.2 15.8 8 13" /></svg>;
  if (index === 7) return <svg {...common}><path d="M12 4 14 9h5l-4 3 1.5 5L12 14l-4.5 3L9 12 5 9h5z" /></svg>;
  if (index === 8) return <svg {...common}><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2H4.5z" /><path d="M10 19a2 2 0 0 0 4 0" /></svg>;
  return <svg {...common}><path d="M4 12a8 8 0 1 0 2-5.3" /><path d="M4 4v4h4" /></svg>;
}

const loopSparks = [
  { scale: [1, 1.2, 1] },
  { y: [0, -3, 0] },
  { rotate: [0, 14, -10, 0] },
  { scale: [1, 0.82, 1.12, 1] },
  { x: [0, 3, 0] },
  { rotate: [0, -12, 0] },
  { scale: [1, 1.16, 1] },
  { rotate: [0, 18, 0] },
  { y: [0, -3, 0], rotate: [0, -8, 8, 0] },
  { scale: [1, 1.1, 1] },
];

function What() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hold, setHold] = useState(false);
  useEffect(() => {
    if (reduce || paused || hold) return;
    const id = window.setInterval(() => setStep((value) => (value + 1) % loop.length), 1500);
    return () => window.clearInterval(id);
  }, [reduce, paused, hold]);
  useEffect(() => {
    if (!hold) return;
    const id = window.setTimeout(() => setHold(false), 6000);
    return () => window.clearTimeout(id);
  }, [hold, step]);
  function pick(index: number) {
    setStep(index);
    setHold(true);
  }
  return (
    <section id="what" className="scroll-mt-24 px-5 py-16 sm:px-8 lg:py-24" onPointerEnter={(event) => { if (event.pointerType === 'mouse') setPaused(true); }} onPointerLeave={(event) => { if (event.pointerType === 'mouse') setPaused(false); }}>
      <div className="mx-auto max-w-7xl">
        <Eyebrow>What is Repeat Mate?</Eyebrow>
        <h2 className="mt-3 max-w-3xl font-display text-3xl font-semibold tracking-tight text-stone-950 sm:text-5xl">One QR code. <span className="text-orange-600">The entire customer relationship.</span></h2>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-stone-600">Repeat Mate connects businesses with their customers through a single QR code — placed at the table, the mirror, the counter or the door.</p>
        <ul className="mt-10 grid grid-cols-2 gap-2 lg:grid-cols-5">
          {loop.map((item, index) => {
            const last = index === loop.length - 1;
            const on = index === step;
            return (
              <motion.li key={item} className={last ? 'col-span-2 lg:col-span-1' : undefined} initial={reduce ? false : { opacity: 0, x: (index % 5) - 2 ? ((index % 5) - 2) * 16 : 0, y: 16 }} whileInView={{ opacity: 1, x: 0, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ delay: index * 0.05, duration: 0.45, ease }}>
                <button type="button" aria-pressed={on} onClick={() => pick(index)} className={`relative flex min-h-16 w-full items-center gap-2.5 overflow-hidden rounded-2xl border px-3 py-3 text-left ${on ? 'border-orange-600 text-white shadow-md shadow-orange-600/20' : 'border-stone-200 bg-white text-stone-800'} ${on && reduce ? 'bg-orange-600' : ''}`}>
                  {on && !reduce && <motion.span layoutId="product-fill" className="absolute inset-0 bg-orange-600" transition={{ type: 'spring', bounce: 0.18, duration: 0.45 }} />}
                  <span className="relative z-10 grid h-7 w-7 shrink-0 place-items-center">
                    {on && !reduce && (
                      <motion.span key={step} className="absolute inset-0 rounded-full border-2 border-white" initial={{ scale: 0.7, opacity: 0.85 }} animate={{ scale: 1.85, opacity: 0 }} transition={{ duration: 0.9, ease: 'easeOut' }} />
                    )}
                    <motion.span className={`relative grid h-7 w-7 place-items-center rounded-full ${on ? 'bg-white/15 text-white' : 'bg-orange-50 text-orange-600'}`} animate={on && !reduce ? loopSparks[index] : undefined} transition={{ duration: 0.7, ease: 'easeInOut' }}>
                      <LoopIcon index={index} />
                    </motion.span>
                  </span>
                  <span className="relative z-10 min-w-0">
                    <span className={`block font-mono text-[11px] font-semibold ${on ? 'text-orange-100' : 'text-orange-600'}`}>{String(index + 1).padStart(2, '0')}</span>
                    <span className="text-sm font-semibold leading-snug">{item}</span>
                  </span>
                </button>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function Why() {
  return (
    <section className="bg-white px-5 py-16 sm:px-8 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <Eyebrow>Why Repeat Mate?</Eyebrow>
        <h2 className="mt-3 max-w-3xl font-display text-3xl font-semibold tracking-tight sm:text-5xl">Most visits end at the payment. <span className="text-orange-600">Yours should start a relationship.</span></h2>
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <article className="rounded-3xl border border-stone-200 bg-orange-50 p-6 sm:p-8">
            <p className="text-sm font-semibold text-stone-500">Without it</p>
            <ol className="mt-5 space-y-3">
              {withoutLoop.map((item, index) => (
                <li key={item} className="flex items-center gap-3 text-sm text-stone-600">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-xs font-semibold text-stone-400">{index + 1}</span>
                  {item}
                </li>
              ))}
            </ol>
          </article>
          <article className="rounded-3xl border border-orange-600 bg-white p-6 shadow-xl shadow-orange-600/10 sm:p-8">
            <p className="text-sm font-semibold text-orange-600">With Repeat Mate</p>
            <ol className="mt-5 space-y-3">
              {withLoop.map((item, index) => (
                <li key={item} className="flex items-center gap-3 text-sm font-medium text-stone-800">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-orange-600 text-xs font-semibold text-white">{index + 1}</span>
                  {item}
                </li>
              ))}
            </ol>
          </article>
        </div>
      </div>
    </section>
  );
}

function FeatureIcon({ title }: { title: string }) {
  const common = { viewBox: '0 0 24 24', className: 'h-4 w-4', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const };
  if (title === 'Digital QR Menu') return <svg {...common}><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v6h-6v-2h4z" /></svg>;
  if (title === 'Play & Earn Games') return <svg {...common}><rect x="6" y="6" width="12" height="12" rx="2" /><path d="M9 12h6" /></svg>;
  if (title === 'Reward Spinner') return <svg {...common}><circle cx="12" cy="12" r="8" /><path d="M12 4v3M12 12l4 3" /></svg>;
  if (title === 'Customer Coins') return <svg {...common}><circle cx="12" cy="12" r="8" /><path d="M12 8v8M9.5 10.5h4a2 2 0 0 1 0 3h-4" /></svg>;
  if (title === 'Digital Wallet') return <svg {...common}><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M16 15h2" /></svg>;
  if (title === 'Loyalty & Bill Rewards') return <svg {...common}><path d="M12 3 14.2 7.6 19 8.2l-3.5 3.4.8 4.9L12 14.8 7.7 16.5l.8-4.9L5 8.2l4.8-.6z" /></svg>;
  if (title === 'Coupons & Offers') return <svg {...common}><path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" /></svg>;
  if (title === 'Offer alerts') return <svg {...common}><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2H4.5z" /><path d="M10 19a2 2 0 0 0 4 0" /></svg>;
  if (title === 'Customer CRM') return <svg {...common}><circle cx="9" cy="8" r="3" /><path d="M3 19a6 6 0 0 1 12 0M17 8a3 3 0 1 1 0 6" /></svg>;
  if (title === 'Customer Segmentation') return <svg {...common}><circle cx="8" cy="9" r="3" /><circle cx="16" cy="15" r="3" /></svg>;
  if (title === 'Win-Back Campaigns') return <svg {...common}><path d="M4 12a8 8 0 1 0 2-5.3" /><path d="M4 4v4h4" /></svg>;
  if (title === 'Google Reviews') return <svg {...common}><path d="M12 4 14 9h5l-4 3 1.5 5L12 14l-4.5 3L9 12 5 9h5z" /></svg>;
  if (title === 'Social Media Engagement') return <svg {...common}><circle cx="6" cy="12" r="2" /><circle cx="16" cy="7" r="2" /><circle cx="16" cy="17" r="2" /><path d="M8 12h6M14.2 8.2 8 11M14.2 15.8 8 13" /></svg>;
  if (title === 'Slow-hour offers') return <svg {...common}><circle cx="12" cy="12" r="8" /><path d="M12 8v5l3 2" /></svg>;
  return <svg {...common}><path d="M5 19V10M12 19V5M19 19v-7" /></svg>;
}

function FeatureScene({ title }: { title: string }) {
  const reduce = useReducedMotion();
  const shell = 'flex min-h-40 flex-col justify-center rounded-2xl bg-stone-950 p-4 text-white';
  if (title === 'Digital QR Menu') {
    return (
      <div className={shell}>
        <p className="text-xs text-white/50">Chai & Co · Dadar</p>
        <div className="mt-3 space-y-2">
          {[['Masala chai', '₹40'], ['Bun maska', '₹50'], ['Cold coffee', '₹90']].map(([name, price]) => (
            <div key={name} className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2 text-sm">
              <span>{name}</span>
              <span className="font-semibold text-amber-300">{price}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (title === 'Play & Earn Games') {
    return (
      <div className={`${shell} items-center`}>
        <div className="grid h-24 w-full place-items-center rounded-2xl border border-dashed border-white/30 bg-white/10 text-sm font-semibold">Scratch</div>
        <p className="mt-3 text-xs text-white/50">Waiting time becomes a game</p>
      </div>
    );
  }
  if (title === 'Reward Spinner') {
    return (
      <div className={`${shell} items-center`}>
        <motion.div className="h-24 w-24 rounded-full border-8 border-white/10 bg-[conic-gradient(#ea580c_0_25%,#fcd34d_0_50%,#c2410c_0_75%,#fff_0_100%)]" animate={reduce ? undefined : { rotate: 360 }} transition={{ duration: 2.2, ease: 'easeOut' }} />
        <p className="mt-3 text-sm font-semibold">Spin the wheel</p>
      </div>
    );
  }
  if (title === 'Customer Coins') {
    return (
      <div className={shell}>
        <p className="text-xs text-white/50">This visit</p>
        <p className="mt-1 font-display text-4xl font-semibold text-amber-300">+50</p>
        <p className="text-sm text-white/60">coins added to the wallet</p>
      </div>
    );
  }
  if (title === 'Digital Wallet') {
    return (
      <div className={shell}>
        <p className="text-xs text-white/50">Wallet</p>
        <p className="mt-1 font-display text-4xl font-semibold text-amber-300">450</p>
        <p className="text-sm text-white/60">coins ready to redeem</p>
        <div className="mt-3 rounded-xl bg-white/10 p-3 text-sm">
          <p className="font-semibold">Free latte coupon</p>
        </div>
      </div>
    );
  }
  if (title === 'Loyalty & Bill Rewards') {
    return (
      <div className={shell}>
        <p className="text-xs text-white/50">Bill</p>
        <p className="mt-1 font-display text-3xl font-semibold">₹420</p>
        <p className="mt-2 text-sm text-amber-300">+42 coins on this bill</p>
      </div>
    );
  }
  if (title === 'Coupons & Offers') {
    return (
      <div className={shell}>
        <p className="text-xs text-white/50">Weekday offer</p>
        <p className="mt-2 font-display text-3xl font-semibold text-amber-300">20% off</p>
        <p className="mt-1 text-sm text-white/60">Show this at the counter</p>
      </div>
    );
  }
  if (title === 'Offer alerts') {
    return (
      <div className={shell}>
        <div className="rounded-xl bg-white/10 p-3">
          <p className="text-xs text-white/50">Repeat Mate</p>
          <p className="mt-1 text-sm font-semibold">Your weekday offer is ready</p>
        </div>
      </div>
    );
  }
  if (title === 'Customer CRM') {
    return (
      <div className={`${shell} gap-2`}>
        {['Table 4 · 3 visits', 'Counter · 1 visit', 'Room 12 · 8 visits'].map((row) => (
          <div key={row} className="rounded-xl bg-white/10 px-3 py-2 text-sm">{row}</div>
        ))}
      </div>
    );
  }
  if (title === 'Customer Segmentation') {
    return (
      <div className={`${shell} gap-2`}>
        {[['Regulars', '12'], ['First visit', '4']].map(([name, count]) => (
          <div key={name} className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2 text-sm">
            <span>{name}</span>
            <span className="font-semibold text-amber-300">{count}</span>
          </div>
        ))}
      </div>
    );
  }
  if (title === 'Win-Back Campaigns') {
    return (
      <div className={shell}>
        <p className="text-xs text-white/50">Quiet guest</p>
        <p className="mt-2 font-display text-2xl font-semibold">14 days</p>
        <p className="mt-1 text-sm text-white/60">since the last visit</p>
      </div>
    );
  }
  if (title === 'Google Reviews') {
    return (
      <div className={`${shell} items-start`}>
        <p className="text-xs text-white/50">After a good visit</p>
        <p className="mt-2 text-2xl tracking-widest text-amber-300" aria-hidden="true">★★★★★</p>
        <p className="mt-2 text-sm">Ask while the visit is fresh</p>
      </div>
    );
  }
  if (title === 'Social Media Engagement') {
    return (
      <div className={shell}>
        <p className="text-sm font-semibold">Follow to unlock</p>
        <p className="mt-2 font-display text-3xl font-semibold text-amber-300">+10</p>
        <p className="text-sm text-white/60">coins</p>
      </div>
    );
  }
  if (title === 'Slow-hour offers') {
    return (
      <div className={shell}>
        <p className="text-xs text-white/50">Quiet hours</p>
        <p className="mt-2 font-display text-3xl font-semibold">2–5 pm</p>
        <p className="mt-1 text-sm text-amber-300">Flash offer to regulars</p>
      </div>
    );
  }
  return (
    <div className={shell}>
      {[['Visits', 'w-4/5'], ['Redemptions', 'w-3/5'], ['Repeat guests', 'w-2/5']].map(([label, width]) => (
        <div key={label} className="mb-3 last:mb-0">
          <p className="text-xs text-white/50">{label}</p>
          <div className={`mt-1 h-2 rounded-full bg-orange-600 ${width}`} />
        </div>
      ))}
    </div>
  );
}

function Features() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hold, setHold] = useState(false);
  const item = features[active];
  useEffect(() => {
    if (reduce || paused || hold) return;
    const id = window.setInterval(() => setActive((value) => (value + 1) % features.length), 3200);
    return () => window.clearInterval(id);
  }, [reduce, paused, hold]);
  useEffect(() => {
    if (!hold) return;
    const id = window.setTimeout(() => setHold(false), 8000);
    return () => window.clearTimeout(id);
  }, [hold, active]);
  function pick(index: number) {
    setActive(index);
    setHold(true);
  }
  function step(delta: number) {
    setActive((value) => (value + delta + features.length) % features.length);
    setHold(true);
  }
  return (
    <section id="features" className="scroll-mt-24 px-5 py-16 sm:px-8 lg:py-24" onPointerEnter={(event) => { if (event.pointerType === 'mouse') setPaused(true); }} onPointerLeave={(event) => { if (event.pointerType === 'mouse') setPaused(false); }}>
      <div className="mx-auto max-w-7xl">
        <Eyebrow>Features</Eyebrow>
        <h2 className="mt-3 max-w-3xl font-display text-3xl font-semibold tracking-tight sm:text-5xl">Everything that happens after the scan.</h2>
        <div className="mt-10 grid items-start gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xl shadow-stone-950/5 lg:sticky lg:top-24">
            <div className="relative h-1 bg-orange-50">
              {!reduce && !paused && !hold && (
                <motion.span key={item.title} className="absolute inset-y-0 left-0 bg-orange-600" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 3.2, ease: 'linear' }} />
              )}
            </div>
            <div className="flex items-center justify-between gap-3 px-5 pt-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-orange-600">{String(active + 1).padStart(2, '0')} / {String(features.length).padStart(2, '0')}</p>
              <div className="flex gap-2">
                <button type="button" aria-label="Previous feature" onClick={() => step(-1)} className="grid h-9 w-9 place-items-center rounded-full border border-stone-200 text-stone-700 transition hover:border-orange-600 hover:text-orange-600">
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M12 5 7 10l5 5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <button type="button" aria-label="Next feature" onClick={() => step(1)} className="grid h-9 w-9 place-items-center rounded-full border border-stone-200 text-stone-700 transition hover:border-orange-600 hover:text-orange-600">
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M8 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
            </div>
            <div className="px-5 pb-5 pt-3">
              <AnimatePresence mode="wait">
                <motion.div key={item.title} initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: -10 }} transition={{ duration: 0.28 }}>
                  <h3 className="font-display text-2xl font-semibold tracking-tight">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">{item.text}</p>
                  <div className="mt-4">
                    <FeatureScene title={item.title} />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          <div className="grid items-stretch gap-3 sm:grid-cols-2">
            {features.map((card, index) => {
              const on = index === active;
              return (
                <button key={card.title} type="button" aria-pressed={on} onClick={() => pick(index)} onPointerEnter={(event) => { if (event.pointerType === 'mouse') setActive(index); }} className={`relative flex h-full flex-col overflow-hidden rounded-3xl border p-5 text-left transition duration-200 hover:-translate-y-0.5 ${card.wide ? 'sm:col-span-2' : ''} ${on ? 'border-orange-600 text-white shadow-lg shadow-orange-600/20' : 'border-stone-200 bg-white'} ${on && reduce ? 'bg-orange-600' : ''}`}>
                  {on && !reduce && <motion.span layoutId="feature-fill" className="absolute inset-0 bg-orange-600" transition={{ type: 'spring', bounce: 0.18, duration: 0.45 }} />}
                  <span className="relative z-10 flex items-center justify-between gap-3">
                    <span className={`grid h-9 w-9 place-items-center rounded-full ${on ? 'bg-white/15 text-white' : 'bg-orange-50 text-orange-600'}`}>
                      <FeatureIcon title={card.title} />
                    </span>
                    <span className={`font-mono text-[11px] ${on ? 'text-orange-100' : 'text-stone-400'}`}>{String(index + 1).padStart(2, '0')}</span>
                  </span>
                  <h3 className="relative z-10 mt-4 font-display text-lg font-semibold">{card.title}</h3>
                  <p className={`relative z-10 mt-2 text-sm leading-relaxed ${on ? 'text-orange-50' : 'text-stone-500'}`}>{card.text}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function HowFrame({ index }: { index: number }) {
  if (index === 1) return <PhoneSpin />;
  if (index === 2) {
    return (
      <div>
        <p className="text-xs text-white/50">This visit</p>
        <p className="mt-1 font-display text-4xl font-semibold text-amber-300">+50</p>
        <p className="text-sm text-white/60">coins added to the wallet</p>
      </div>
    );
  }
  if (index === 3) {
    return (
      <div className="rounded-2xl bg-white/10 p-4 text-sm">
        <p className="font-semibold">Free latte coupon</p>
        <p className="mt-1 text-xs text-white/50">Show this at the counter</p>
      </div>
    );
  }
  if (index === 4) {
    return (
      <div className="rounded-2xl bg-white/10 p-4 text-sm">
        <p className="text-xs text-white/50">Next visit</p>
        <p className="mt-1 font-semibold">Your coins are still here</p>
      </div>
    );
  }
  return (
    <div className="grid place-items-center pt-6">
      <div className="grid h-36 w-36 place-items-center rounded-3xl border border-white/20 bg-white">
        <svg viewBox="0 0 80 80" className="h-24 w-24" aria-hidden="true">
          <rect x="8" y="8" width="24" height="24" fill="#1c1917" />
          <rect x="48" y="8" width="24" height="24" fill="#1c1917" />
          <rect x="8" y="48" width="24" height="24" fill="#1c1917" />
          <rect x="40" y="40" width="8" height="8" fill="#ea580c" />
          <rect x="52" y="40" width="8" height="8" fill="#1c1917" />
          <rect x="64" y="52" width="8" height="8" fill="#1c1917" />
          <rect x="40" y="64" width="8" height="8" fill="#ea580c" />
        </svg>
      </div>
      <p className="mt-4 text-sm font-semibold">Scan the QR</p>
    </div>
  );
}

function How() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [hold, setHold] = useState(false);
  useEffect(() => {
    if (reduce || hold) return;
    const id = window.setInterval(() => setActive((value) => (value + 1) % steps.length), 2200);
    return () => window.clearInterval(id);
  }, [reduce, hold]);
  useEffect(() => {
    if (!hold) return;
    const id = window.setTimeout(() => setHold(false), 8000);
    return () => window.clearTimeout(id);
  }, [hold, active]);
  function pick(index: number) {
    setActive(index);
    setHold(true);
  }
  const phone = (
    <div className="rounded-[32px] border border-stone-200 bg-white p-3 shadow-xl shadow-stone-950/5">
      <div className="overflow-hidden rounded-[24px] bg-stone-950 p-5 text-white">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-orange-300">{steps[active].label}</p>
        <h3 className="mt-2 font-display text-2xl font-semibold">{steps[active].title}</h3>
        <div className="mt-5 min-h-44">
          <HowFrame index={active} />
        </div>
      </div>
      <div className="mt-4 flex gap-1.5 px-1">
        {steps.map((step, index) => (
          <button key={step.label} type="button" aria-label={step.title} onClick={() => pick(index)} className={`h-1.5 rounded-full ${index === active ? 'flex-[1.6] bg-orange-600' : 'flex-1 bg-stone-200'}`} />
        ))}
      </div>
    </div>
  );
  return (
    <section id="how" className="scroll-mt-24 bg-white px-5 py-16 sm:px-8 lg:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div className="lg:hidden">{phone}</div>
        <div>
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-5xl">
            SCAN → ENGAGE → EARN → REDEEM → <span className="text-orange-600">RETURN</span>
          </h2>
          <p className="mt-4 max-w-xl text-stone-600">One loop, running quietly behind every visit. Watch the phone — it plays the whole customer journey.</p>
          <ol className="mt-8 space-y-3">
            {steps.map((step, index) => {
              const on = index === active;
              return (
                <li key={step.label}>
                  <button type="button" onClick={() => pick(index)} className={`relative w-full overflow-hidden rounded-2xl border px-4 py-4 text-left transition ${on ? 'border-orange-600 text-white' : 'border-stone-200 bg-white hover:border-orange-200'} ${on && reduce ? 'bg-orange-600' : ''}`}>
                    {on && !reduce && <motion.span layoutId="how-fill" className="absolute inset-0 bg-orange-600" transition={{ type: 'spring', bounce: 0.18, duration: 0.45 }} />}
                    <p className={`relative z-10 font-mono text-[11px] font-semibold tracking-[0.16em] ${on ? 'text-orange-100' : 'text-orange-600'}`}>{step.label}</p>
                    <p className={`relative z-10 mt-1 font-semibold ${on ? 'text-white' : 'text-stone-950'}`}>{step.title}</p>
                    {on && <p className="relative z-10 mt-1 text-sm leading-relaxed text-orange-50">{step.text}</p>}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
        <div className="hidden lg:block">{phone}</div>
      </div>
    </section>
  );
}

function Categories() {
  const reduce = useReducedMotion();
  const items = reduce ? categories : [...categories, ...categories];
  return (
    <div className="marquee-hover-pause overflow-hidden border-y border-orange-100 bg-orange-50 py-5" data-testid="target-categories-marquee" style={{ maskImage: 'linear-gradient(90deg, transparent, black 8%, black 92%, transparent)' }}>
      <div className={`flex items-center ${reduce ? 'flex-wrap justify-center gap-3 px-5' : 'landing-marquee w-max gap-3 pr-3'}`} style={{ ['--marquee-duration' as string]: '40s' }}>
        {items.map((item, index) => (
          <span key={`${item}-${index}`} aria-hidden={!reduce && index >= categories.length ? true : undefined} className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function Pricing() {
  const reduce = useReducedMotion();
  const [yearly, setYearly] = useState(false);
  const [active, setActive] = useState(() => Math.max(0, plans.findIndex((plan) => plan.popular)));
  const [paused, setPaused] = useState(false);
  const [hold, setHold] = useState(false);
  useEffect(() => {
    if (reduce || paused || hold) return;
    const id = window.setInterval(() => setActive((value) => (value + 1) % plans.length), 3400);
    return () => window.clearInterval(id);
  }, [reduce, paused, hold]);
  useEffect(() => {
    if (!hold) return;
    const id = window.setTimeout(() => setHold(false), 8000);
    return () => window.clearTimeout(id);
  }, [hold, active]);
  function pick(index: number) {
    setActive(index);
    setHold(true);
  }
  return (
    <section id="pricing" className="scroll-mt-24 px-5 py-16 sm:px-8 lg:py-24" onPointerEnter={(event) => { if (event.pointerType === 'mouse') setPaused(true); }} onPointerLeave={(event) => { if (event.pointerType === 'mouse') setPaused(false); }}>
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <Eyebrow>Pricing</Eyebrow>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-5xl">Honest pricing. <span className="text-orange-600">No fake discounts.</span></h2>
          <p className="mx-auto mt-4 max-w-xl text-stone-600">Same product on every plan. Yearly billing is ten months of the monthly price.</p>
          <div className="mt-6 inline-flex rounded-full border border-stone-200 bg-white p-1 text-sm font-semibold">
            <button type="button" onClick={() => setYearly(false)} className={`rounded-full px-4 py-2 ${yearly ? 'text-stone-500' : 'bg-orange-600 text-white'}`}>Monthly</button>
            <button type="button" onClick={() => setYearly(true)} className={`rounded-full px-4 py-2 ${yearly ? 'bg-orange-600 text-white' : 'text-stone-500'}`}>Yearly</button>
          </div>
        </div>
        <div className="mt-10 grid items-stretch gap-4 pt-4 lg:grid-cols-3">
          {plans.map((plan, index) => {
            const fullYear = plan.monthly * 12;
            const price = plan.monthly === 0 ? 'Talk to us' : `₹${(yearly ? plan.monthly * 10 : plan.monthly).toLocaleString('en-IN')}`;
            const note = plan.monthly === 0 ? '' : yearly ? '/year' : '/month';
            const on = index === active;
            return (
              <article key={plan.id} onPointerEnter={(event) => { if (event.pointerType === 'mouse') setActive(index); }} onClick={() => pick(index)} className={`relative flex h-full cursor-pointer flex-col rounded-3xl border bg-white p-6 ${on ? 'border-2 border-orange-600 py-8 shadow-xl shadow-orange-600/10 lg:-my-3' : 'border-stone-200'}`}>
                {plan.popular && <p className="absolute -top-3 left-6 rounded-full bg-orange-600 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">Most popular</p>}
                <h3 className="font-display text-xl font-semibold">{plan.name}</h3>
                <p className="mt-1 text-sm text-stone-500">{plan.blurb}</p>
                <p className="mt-5 text-3xl font-semibold">
                  {price}
                  <span className="text-base font-normal text-stone-400">{note}</span>
                  {yearly && plan.monthly > 0 && <span className="ml-2 text-base font-normal text-stone-300 line-through">₹{fullYear.toLocaleString('en-IN')}</span>}
                </p>
                <ul className="mt-5 space-y-2 text-sm text-stone-600">{plan.features.map((item) => <li key={item} className="flex gap-2"><span className="mt-0.5 text-orange-600" aria-hidden="true">✓</span><span>{item}</span></li>)}</ul>
                <button type="button" onClick={openDemo} className={`mt-auto inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold transition ${on ? 'bg-orange-600 text-white hover:bg-orange-700' : 'border border-orange-600 bg-white text-orange-600 hover:bg-orange-50'}`}>{plan.cta}</button>
              </article>
            );
          })}
        </div>
        <div className="mt-8 overflow-x-auto rounded-3xl border border-stone-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-stone-200 text-stone-500">
              <tr>
                <th className="sticky top-0 bg-white px-5 py-4 font-medium">Included</th>
                <th className="sticky top-0 bg-white px-5 py-4 font-medium">Starter</th>
                <th className="sticky top-0 bg-white px-5 py-4 font-medium">Business</th>
                <th className="sticky top-0 bg-white px-5 py-4 font-medium">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {compare.map((row) => (
                <tr key={row.label} className="border-b border-stone-100 last:border-0">
                  <td className="px-5 py-3 font-medium text-stone-800">{row.label}</td>
                  <td className="px-5 py-3"><Mark value={row.starter} /></td>
                  <td className="px-5 py-3"><Mark value={row.growth} /></td>
                  <td className="px-5 py-3"><Mark value={row.scale} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Mark({ value }: { value: boolean | string }) {
  if (typeof value === 'string') return <span className="font-semibold text-stone-800">{value}</span>;
  return <span className={value ? 'font-semibold text-orange-600' : 'text-stone-300'}>{value ? 'Yes' : '—'}</span>;
}

function Faq() {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="scroll-mt-24 bg-white px-5 py-16 sm:px-8 lg:py-24">
      <div className="mx-auto max-w-3xl">
        <Eyebrow>FAQ</Eyebrow>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-5xl">Questions from the counter.</h2>
        <div className="mt-8 overflow-hidden rounded-3xl border border-stone-200 bg-orange-50">
          {faqs.map((item, index) => {
            const on = open === index;
            return (
              <motion.div key={item.q} className={`relative border-b border-stone-200 last:border-b-0 ${on ? 'bg-white' : ''}`} initial={reduce ? false : { opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ delay: Math.min(index, 6) * 0.05, duration: 0.4, ease }}>
                {on && !reduce && <motion.span layoutId="faq-mark" className="absolute bottom-3 left-0 top-3 w-0.5 rounded-full bg-orange-600" transition={{ type: 'spring', bounce: 0.18, duration: 0.4 }} />}
                {on && reduce && <span className="absolute bottom-3 left-0 top-3 w-0.5 rounded-full bg-orange-600" />}
                <button type="button" className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left" aria-expanded={on} onClick={() => setOpen(on ? -1 : index)}>
                  <span className="font-semibold text-stone-950">{item.q}</span>
                  <motion.span aria-hidden className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-lg leading-none text-orange-600" animate={reduce ? undefined : { rotate: on ? 45 : 0 }} transition={{ duration: 0.25 }}>+</motion.span>
                </button>
                <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${on ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                  <div className="overflow-hidden">
                    <motion.p className="px-5 pb-4 text-sm leading-relaxed text-stone-600" initial={false} animate={reduce || on ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }} transition={{ duration: reduce ? 0 : 0.28, ease }}>
                      {item.a}
                    </motion.p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

type DemoForm = { name: string; businessName: string; businessType: string; phone: string; email: string; city: string };

const emptyDemo: DemoForm = { name: '', businessName: '', businessType: '', phone: '', email: '', city: '' };

function Demo() {
  const [form, setForm] = useState<DemoForm>(emptyDemo);
  const [errors, setErrors] = useState<Partial<DemoForm>>({});
  const [sent, setSent] = useState(false);

  function update(key: keyof DemoForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const next: Partial<DemoForm> = {};
    if (!form.name.trim()) next.name = 'Your name is required';
    if (!form.businessName.trim()) next.businessName = 'Business name is required';
    if (!form.businessType) next.businessType = 'Pick a business type';
    if (!isTenDigitMobile(digitsOnly(form.phone))) next.phone = 'Enter a 10-digit mobile number';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email';
    if (!form.city.trim()) next.city = 'City is required';
    setErrors(next);
    if (Object.keys(next).length) return;
    try {
      await api('/public/demos', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          mobile: digitsOnly(form.phone),
          email: form.email.trim(),
          businessName: form.businessName.trim(),
          businessType: form.businessType,
          city: form.city.trim(),
        }),
      });
      setSent(true);
      toastOk('Demo request sent.');
    } catch {
      /* api toasts */
    }
  }

  return (
    <section id="demo" className="scroll-mt-24 px-5 py-16 pb-28 sm:px-8 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <Eyebrow>Book a free demo</Eyebrow>
            <h2 className="mt-3 max-w-3xl font-display text-3xl font-semibold tracking-tight sm:text-5xl">See Repeat Mate running on <span className="text-orange-600">your business.</span></h2>
            <p className="mt-4 max-w-2xl text-stone-600">Thirty minutes. Your own demo QR. Exact pricing for your size. No pressure, no spam.</p>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <a href="mailto:repeatmate@gmail.com" className="inline-flex items-center rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-950">repeatmate@gmail.com</a>
            <a href="tel:+919296756289" className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700">+91 92967 56289</a>
          </div>
        </div>
        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-8">
          <div className="space-y-4">
            <div className="rounded-3xl border border-stone-200 bg-white p-2">
              {demoPoints.map((point, index) => (
                <article key={point.title} className="flex gap-4 rounded-2xl p-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-orange-50 text-sm font-semibold text-orange-600">{index + 1}</span>
                  <span>
                    <span className="block font-display text-base font-semibold text-stone-950">{point.title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-stone-500">{point.text}</span>
                  </span>
                </article>
              ))}
            </div>
            <article className="rounded-3xl border border-stone-200 bg-white p-5">
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-orange-600">Write to us</p>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">1, Niwas, Civil Line Buxar, Buxar, Bihar – 802101, India</p>
              <p className="mt-1 text-sm leading-relaxed text-stone-600">Operating from Civil Lines, Prayagraj, Uttar Pradesh, India. WebGrow.store.</p>
              <p className="mt-2 text-sm text-stone-500">We reply on business days.</p>
            </article>
          </div>
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-xl shadow-stone-950/5 sm:p-8 lg:sticky lg:top-24">
            {sent ? (
              <div className="py-10 text-center">
                <p className="font-display text-2xl font-semibold">Request received.</p>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-stone-500">Thanks {form.name.split(' ')[0]}. We will call {form.phone} to schedule the demo.</p>
                <button type="button" className="mt-7 rounded-full border border-stone-200 px-6 py-2.5 text-sm font-semibold" onClick={() => { setSent(false); setForm(emptyDemo); }}>Book for another business</button>
              </div>
            ) : (
              <form className="space-y-4" noValidate onSubmit={submit}>
                <div>
                  <p className="font-display text-xl font-semibold text-stone-950">Book the walkthrough</p>
                  <p className="mt-1 text-sm text-stone-500">We call you to set the time.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Your Name" value={form.name} error={errors.name} placeholder="Priya Sharma" onChange={(value) => update('name', value)} />
                  <Field label="Business Name" value={form.businessName} error={errors.businessName} placeholder="Urban Brew Café" onChange={(value) => update('businessName', value)} />
                </div>
                <label className="block text-xs font-medium text-stone-600">
                  Business Type
                  <select value={form.businessType} onChange={(event) => update('businessType', event.target.value)} className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-orange-50 px-3 py-3 text-sm text-stone-950 outline-none focus:border-orange-600">
                    <option value="">Select</option>
                    {businessTypes.map((type) => <option key={type}>{type}</option>)}
                  </select>
                  {errors.businessType && <span className="mt-1 block text-xs text-rose-600">{errors.businessType}</span>}
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Mobile" value={form.phone} error={errors.phone} placeholder="10-digit mobile" onChange={(value) => update('phone', digitsOnly(value).slice(0, 10))} />
                  <Field label="Email" value={form.email} error={errors.email} placeholder="priya@cafe.in" onChange={(value) => update('email', value)} />
                </div>
                <Field label="City" value={form.city} error={errors.city} placeholder="Mumbai" onChange={(value) => update('city', value)} />
                <button type="submit" className="inline-flex w-full items-center justify-center rounded-full bg-orange-600 py-3.5 text-sm font-semibold text-white transition hover:bg-orange-700">Book a Free Demo</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, value, error, placeholder, onChange }: { label: string; value: string; error?: string; placeholder: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-xs font-medium text-stone-600">
      {label}
      <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-orange-50 px-3 py-3 text-sm text-stone-950 outline-none placeholder:text-stone-400 focus:border-orange-600" />
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}

function Arrow({ className = '' }: { className?: string }) {
  return <svg viewBox="0 0 24 24" className={`h-4 w-4 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}

function Play() {
  return <svg viewBox="0 0 24 24" className="h-3 w-3 translate-x-px fill-current"><path d="M8 5.5v13l11-6.5-11-6.5z" /></svg>;
}
