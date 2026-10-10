import { FormEvent, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Marketing } from '../../components/layout/Shells';

const ease = [0.22, 1, 0.36, 1] as const;
const supportEmail = 'support@rewardspinner.local';

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
  { title: 'Digital QR Menu', text: 'A contactless menu live in minutes — items, prices, photos and offers, no app needed.', featured: true },
  { title: 'Play & Earn Games', text: 'Scratch cards, quizzes and mini-games that turn waiting time into fun time.', featured: true },
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
  { q: 'What does RewardSpinner cost?', a: 'Starter is ₹999 a month, Business is ₹1,999 a month, and Enterprise is quoted for your outlets. Yearly billing is ten months of the monthly price. Book a free demo for a number that matches your size.' },
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
  return (
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
            One QR. Digital Menu. Games. Rewards. Coins. Coupons. Reviews. CRM. Everything you need to engage and retain customers.
          </motion.p>
          <motion.div initial={reduce ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.8, ease }} className="mt-9 flex flex-wrap items-center gap-4">
            <button type="button" onClick={() => scrollToId('demo')} className="group inline-flex items-center gap-2 rounded-full bg-orange-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-600/30 transition hover:scale-[1.03] hover:bg-orange-700 active:scale-[0.98]">
              Book a Free Demo
              <Arrow className="transition group-hover:translate-x-1" />
            </button>
            <button type="button" onClick={() => scrollToId('how')} className="group inline-flex items-center gap-2.5 rounded-full border border-stone-200 bg-white px-6 py-3.5 text-sm font-semibold text-stone-950 transition hover:border-orange-600">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-orange-100 text-orange-600 transition group-hover:bg-orange-600 group-hover:text-white">
                <Play />
              </span>
              Watch How It Works
            </button>
          </motion.div>
          <p className="mt-5 text-sm text-stone-500">Ready to go live? <Link to="/register" className="font-semibold text-orange-600">Start your business</Link></p>
        </div>
        <PhoneJourney />
      </div>
    </section>
  );
}

function PhoneJourney() {
  const reduce = useReducedMotion();
  const frames = ['Menu', 'Spin', 'Wallet'];
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setFrame((value) => (value + 1) % frames.length), 2400);
    return () => window.clearInterval(id);
  }, [reduce, frames.length]);
  return (
    <div className="relative mx-auto w-full max-w-sm pb-8">
      <div className="rounded-[36px] border border-white bg-white p-3 shadow-2xl shadow-stone-950/10">
        <div className="overflow-hidden rounded-[28px] bg-stone-950 text-white">
          <div className="flex items-center justify-between px-5 pb-2 pt-4 text-[11px] text-white/50">
            <span>RewardSpinner</span>
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
      <div className="absolute -left-2 bottom-0 rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-xl sm:-left-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">This visit</p>
        <p className="mt-1 text-sm font-semibold text-stone-950">+50 coins · spin wheel</p>
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

function BusinessTypes() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(2);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (reduce || paused) return;
    const id = window.setInterval(() => setActive((value) => (value + 1) % businesses.length), 3400);
    return () => window.clearInterval(id);
  }, [reduce, paused]);
  const current = businesses[active];
  return (
    <section id="business-types" className="border-y border-orange-100 bg-white py-8" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
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
      <div className="mx-auto mt-8 max-w-5xl px-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">The RewardSpinner loop · {current.label}</p>
        <div key={current.id} className="mt-3 flex flex-wrap items-center gap-2">
          {current.chain.map((step, index) => (
            <motion.span key={step} className="inline-flex items-center gap-2" initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.12, duration: 0.35, ease }}>
              <span className="rounded-full bg-orange-50 px-3 py-1.5 text-sm font-semibold text-stone-800">{step}</span>
              {index < current.chain.length - 1 && <span className="text-orange-600" aria-hidden="true">→</span>}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Names() {
  const reduce = useReducedMotion();
  const items = reduce ? shopNames : [...shopNames, ...shopNames];
  return (
    <div className="marquee-hover-pause overflow-hidden border-b border-orange-100 bg-orange-50 py-4" style={{ maskImage: 'linear-gradient(90deg, transparent, black 12%, black 88%, transparent)' }}>
      <div className={`flex items-center ${reduce ? 'flex-wrap justify-center gap-x-8 px-5' : 'landing-marquee w-max'}`} style={{ ['--marquee-duration' as string]: '70s' }}>
        {items.map((name, index) => (
          <span key={`${name}-${index}`} aria-hidden={!reduce && index >= shopNames.length ? true : undefined} className="flex items-center px-6 text-sm font-semibold text-stone-500">
            <span className="mr-6 h-1.5 w-1.5 rounded-full bg-orange-600" />
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

function What() {
  return (
    <section id="what" className="scroll-mt-24 px-5 py-16 sm:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <Eyebrow>What is RewardSpinner?</Eyebrow>
        <h2 className="mt-3 max-w-3xl font-display text-3xl font-semibold tracking-tight text-stone-950 sm:text-5xl">One QR code. <span className="text-orange-600">The entire customer relationship.</span></h2>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-stone-600">RewardSpinner connects businesses with their customers through a single QR code — placed at the table, the mirror, the counter or the door.</p>
        <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {loop.map((item, index) => (
            <li key={item} className="rounded-2xl border border-stone-200 bg-white p-4">
              <span className="font-mono text-[11px] font-semibold text-orange-600">{String(index + 1).padStart(2, '0')}</span>
              <p className="mt-2 text-sm font-semibold text-stone-950">{item}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Why() {
  return (
    <section className="bg-white px-5 py-16 sm:px-8 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <Eyebrow>Why RewardSpinner?</Eyebrow>
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
            <p className="text-sm font-semibold text-orange-600">With RewardSpinner</p>
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

function Features() {
  return (
    <section id="features" className="scroll-mt-24 px-5 py-16 sm:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <Eyebrow>Features</Eyebrow>
        <h2 className="mt-3 max-w-3xl font-display text-3xl font-semibold tracking-tight sm:text-5xl">Everything that happens after the scan.</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((item) => (
            <article key={item.title} className={`rounded-3xl border p-6 ${item.wide ? 'sm:col-span-2 lg:col-span-3' : ''} ${item.featured ? 'border-orange-600 bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'border-stone-200 bg-white'}`}>
              <h3 className="font-display text-lg font-semibold">{item.title}</h3>
              <p className={`mt-2 text-sm leading-relaxed ${item.featured ? 'text-orange-50' : 'text-stone-500'}`}>{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function How() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setActive((value) => (value + 1) % steps.length), 2200);
    return () => window.clearInterval(id);
  }, [reduce]);
  return (
    <section id="how" className="scroll-mt-24 bg-white px-5 py-16 sm:px-8 lg:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
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
                  <button type="button" onClick={() => setActive(index)} className={`w-full rounded-2xl border px-4 py-4 text-left transition ${on ? 'border-orange-600 bg-orange-50' : 'border-stone-200 bg-white hover:border-orange-200'}`}>
                    <p className="font-mono text-[11px] font-semibold tracking-[0.16em] text-orange-600">{step.label}</p>
                    <p className="mt-1 font-semibold text-stone-950">{step.title}</p>
                    {on && <p className="mt-1 text-sm leading-relaxed text-stone-600">{step.text}</p>}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
        <div className="rounded-[32px] border border-stone-200 bg-orange-50 p-6 sm:p-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-orange-600">{steps[active].label}</p>
          <h3 className="mt-2 font-display text-3xl font-semibold">{steps[active].title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-stone-600">{steps[active].text}</p>
          <div className="mt-6 flex gap-1.5">
            {steps.map((step, index) => <span key={step.label} className={`h-1.5 flex-1 rounded-full ${index <= active ? 'bg-orange-600' : 'bg-stone-200'}`} />)}
          </div>
        </div>
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
  const [yearly, setYearly] = useState(false);
  return (
    <section id="pricing" className="scroll-mt-24 px-5 py-16 sm:px-8 lg:py-24">
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
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => {
            const price = plan.monthly === 0 ? 'Talk to us' : `₹${(yearly ? plan.monthly * 10 : plan.monthly).toLocaleString('en-IN')}`;
            const note = plan.monthly === 0 ? '' : yearly ? '/year' : '/month';
            return (
              <article key={plan.id} className={`flex flex-col rounded-3xl border bg-white p-6 ${plan.popular ? 'border-2 border-orange-600 shadow-xl shadow-orange-600/10' : 'border-stone-200'}`}>
                {plan.popular && <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-orange-600">Most popular</p>}
                <h3 className="font-display text-xl font-semibold">{plan.name}</h3>
                <p className="mt-1 text-sm text-stone-500">{plan.blurb}</p>
                <p className="mt-5 text-3xl font-semibold">{price}<span className="text-base font-normal text-stone-400">{note}</span></p>
                <ul className="mt-5 space-y-2 text-sm text-stone-600">{plan.features.map((item) => <li key={item}>• {item}</li>)}</ul>
                <button type="button" onClick={() => scrollToId('demo')} className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full bg-orange-600 px-4 text-sm font-semibold text-white transition hover:bg-orange-700">{plan.cta}</button>
              </article>
            );
          })}
        </div>
        <div className="mt-8 overflow-x-auto rounded-3xl border border-stone-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-stone-200 text-stone-500">
              <tr>
                <th className="px-5 py-4 font-medium">Included</th>
                <th className="px-5 py-4 font-medium">Starter</th>
                <th className="px-5 py-4 font-medium">Business</th>
                <th className="px-5 py-4 font-medium">Enterprise</th>
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
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="scroll-mt-24 bg-white px-5 py-16 sm:px-8 lg:py-24">
      <div className="mx-auto max-w-3xl">
        <Eyebrow>FAQ</Eyebrow>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-5xl">Questions from the counter.</h2>
        <div className="mt-8 divide-y divide-stone-200 rounded-3xl border border-stone-200 bg-orange-50">
          {faqs.map((item, index) => {
            const on = open === index;
            return (
              <div key={item.q}>
                <button type="button" className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left" aria-expanded={on} onClick={() => setOpen(on ? -1 : index)}>
                  <span className="font-semibold text-stone-950">{item.q}</span>
                  <span className="text-orange-600">{on ? '–' : '+'}</span>
                </button>
                {on && <p className="px-5 pb-4 text-sm leading-relaxed text-stone-600">{item.a}</p>}
              </div>
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

  function submit(event: FormEvent) {
    event.preventDefault();
    const next: Partial<DemoForm> = {};
    if (!form.name.trim()) next.name = 'Your name is required';
    if (!form.businessName.trim()) next.businessName = 'Business name is required';
    if (!form.businessType) next.businessType = 'Pick a business type';
    if (!/^[+\d][\d\s-]{6,16}$/.test(form.phone.trim())) next.phone = 'Enter a valid phone number';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email';
    if (!form.city.trim()) next.city = 'City is required';
    setErrors(next);
    if (Object.keys(next).length) return;
    const body = [`Name: ${form.name.trim()}`, `Business: ${form.businessName.trim()}`, `Type: ${form.businessType}`, `Phone: ${form.phone.trim()}`, `Email: ${form.email.trim()}`, `City: ${form.city.trim()}`].join('\n');
    window.location.href = `mailto:${supportEmail}?subject=${encodeURIComponent('Free demo request')}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  return (
    <section id="demo" className="scroll-mt-24 px-5 py-16 sm:px-8 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <Eyebrow>Book a free demo</Eyebrow>
        <h2 className="mt-3 max-w-3xl font-display text-3xl font-semibold tracking-tight sm:text-5xl">See RewardSpinner running on <span className="text-orange-600">your business.</span></h2>
        <p className="mt-4 max-w-2xl text-stone-600">Thirty minutes. Your own demo QR. Exact pricing for your size. No pressure, no spam.</p>
        <div className="mt-10 grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <div className="space-y-4">
            {demoPoints.map((point) => (
              <article key={point.title} className="rounded-2xl border border-stone-200 bg-white p-5">
                <p className="font-display text-base font-semibold">{point.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-stone-500">{point.text}</p>
              </article>
            ))}
          </div>
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl shadow-stone-950/10 sm:p-8">
            {sent ? (
              <div className="py-10 text-center">
                <p className="font-display text-2xl font-semibold">You’re booked in.</p>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-stone-500">Thanks {form.name.split(' ')[0]} — send the email that just opened, or write {supportEmail}, and we’ll call {form.phone} to schedule the demo.</p>
                <button type="button" className="mt-7 rounded-full border border-stone-200 px-6 py-2.5 text-sm font-semibold" onClick={() => { setSent(false); setForm(emptyDemo); }}>Book for another business</button>
              </div>
            ) : (
              <form className="space-y-4" noValidate onSubmit={submit}>
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
                  <Field label="Phone" value={form.phone} error={errors.phone} placeholder="98765 43210" onChange={(value) => update('phone', value)} />
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
