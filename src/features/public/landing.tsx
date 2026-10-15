import { FormEvent, ReactNode, useEffect, useState } from 'react';
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

const withoutLoop = ['Customer visits', 'Makes a purchase', 'Leaves your business', 'No reason to return'];
const withLoop = ['Customer visits', 'Connects through your QR code', 'Plays games and earns coins', 'Unlocks exclusive rewards', 'Receives special offers', 'Returns and buys again'];

const features = [
  { title: 'Smart Digital Business Profile', text: 'Showcase your products, services, prices, photos, and special offers through one simple QR code.' },
  { title: 'Play, Earn & Redeem Rewards', text: 'Customers play interactive games, earn coins, and visit your store to redeem rewards and discounts.' },
  { title: 'Customer Coins', text: 'Reward customers for eligible visits, purchases, and activities with coins they can collect.' },
  { title: 'Digital Wallet', text: 'Let customers track their coins, coupons, and available rewards in one place.' },
  { title: 'Loyalty & Purchase Rewards', text: 'Reward eligible purchases and encourage customers to choose your business again.' },
  { title: 'Coupons & Special Offers', text: 'Create attractive offers for festivals, special occasions, and promotional campaigns.' },
  { title: 'Smart Offer Notifications', text: 'Notify opted-in customers about exclusive offers, new rewards, and business updates.' },
  { title: 'Customer CRM', text: 'Manage customer information and engagement history from one convenient dashboard.' },
  { title: 'Customer Segmentation', text: 'Group customers by visits, spending, and activity to deliver relevant offers.' },
  { title: 'Win-Back Campaigns', text: 'Reconnect with inactive customers through timely offers and personalized campaigns.' },
  { title: 'AI Google Review Assistant', text: 'Generate personalized, copy-ready review response suggestions and help customers access your Google review page. Improve your online reputation and support your local SEO efforts.' },
  { title: 'Social Media Engagement', text: 'Encourage customers to follow and connect with your business on social media.' },
  { title: 'Smart Business Promotions', text: 'Promote special deals during quiet hours and offer discounts on eligible surplus products.' },
  { title: 'Business Analytics', text: 'Track customer engagement, reward redemptions, and campaign performance.' },
];

const steps = [
  { label: 'SCAN', title: 'Scan & Discover', text: 'Customers scan your QR code to access your digital business profile, product and service listings, AI Google Review assistance, social media links, business location, special offers, and much more.' },
  { label: 'DISCOVER', title: 'Everything at Their Fingertips', text: 'Customers explore your business, discover what you offer, connect with your social media, and find your location—all from one simple page.' },
  { label: 'ENGAGE', title: 'Play, Participate & Interact', text: 'Customers enjoy interactive games, explore offers, and engage with your business in fun and rewarding ways.' },
  { label: 'EARN', title: 'Collect Coins & Rewards', text: 'Customers earn coins through eligible games and activities, building rewards they can redeem at your business.' },
  { label: 'RETURN', title: 'Redeem Rewards. Come Back Again.', text: 'Customers visit your business to redeem available rewards, discover new offers, and enjoy more reasons to return.' },
];

const categories = ['Cafés', 'Restaurants', 'Salons', 'Spas', 'Hotels', 'Bakeries', 'Gyms', 'Retail Stores', 'Beauty Businesses', 'Local Businesses'];

const plans = [
  { id: 'starter', name: 'Starter', monthly: 499, blurb: 'Use the Repeat Mate platform to grow your business.', features: ['Smart Digital Business Profile & QR Code', 'Product & Service Listings', 'AI Google Review Assistance', 'Social Media & Location Links', 'Games, Coins & Loyalty Rewards', 'Customer CRM & Notifications', 'Coupons & Special Offers'], cta: 'Get Started', to: '/register' },
  { id: 'growth', name: 'Business', monthly: 7999, yearlyOnly: true, popular: true, blurb: 'Your own white-label website with your branding.', features: ['Everything in Starter', '100% White-Label Website', 'Your Business Name & Logo', 'Your Website Name & Branding', 'Custom Games & Rewards', 'Customer CRM & Notification System', 'AI Google Review Assistance', 'Loyalty & Customer Retention Tools'], cta: 'Get Started', to: '/register' },
];

const compare = [
  { label: 'Digital QR Menu', starter: true, growth: true },
  { label: 'Customer Coins & Wallet', starter: true, growth: true },
  { label: 'Reward Spinner & games', starter: true, growth: true },
  { label: 'Coupons & Offers', starter: true, growth: true },
  { label: 'Google Reviews', starter: true, growth: true },
  { label: 'Customer groups', starter: true, growth: true },
  { label: '100% White-Label Website', starter: false, growth: true },
  { label: 'Your Own Website Name', starter: false, growth: true },

];

const faqs = [
  { q: 'Do my customers need to download an app?', a: 'No. Customers scan your QR code with their phone camera and everything opens in the browser — menu, games, wallet and rewards. No download, no sign-up friction.' },
  { q: 'How does the digital QR menu work?', a: 'You get a digital menu linked to your QR code. Update items, prices and offers from your desk anytime — changes go live on every table without reprinting the flyer.' },
  { q: 'Can I control the games and prizes?', a: 'Yes. You decide the game the QR opens, the prizes, and the limits. The result is chosen before the wheel, scratch card, box, or slots finish.' },
  { q: 'What are coins and how do customers earn them?', a: 'Coins are your loyalty currency. Customers earn them for playing, approved bill claims, and return visits. You set what a coin is worth at the counter.' },
  { q: 'How do customers spend their rewards?', a: 'Coins sit in each customer’s wallet. They redeem them for the offers you publish, and you confirm the redemption at the counter.' },
  { q: 'Can I target offers to specific customers?', a: 'The Business plan groups guests by how often they visit, so a quiet regular can get a different offer from a first-time scan.' },
  { q: 'Will messages feel like spam?', a: 'Offers go to people who already scanned your QR and kept a wallet. You send birthday rewards, wallet balances, and festival coupons — not a blast to strangers.' },
  { q: 'How do Google reviews work?', a: 'Right after a good visit, the guest can be asked for a Google review, often alongside a small coin reward. The ask lands while the visit is still fresh.' },
  { q: 'What does Repeat Mate cost?', a: 'Starter is ₹499 a month and Business is ₹7,999 a year. Book a free demo for a number that matches your size.' },
  { q: 'How long does setup take? Do I need hardware?', a: 'Most counters go live the same day. You print the QR we generate. The desk and the guest flow both run in the browser.' },
  { q: 'Is customer data safe?', a: 'Guest name, mobile, and email are stored so the shop can recognise an order, a win, and a bill claim. Shop owners see their own guests, not another shop’s list.' },
  { q: 'What support do I get?', a: 'Every plan includes email support. Business adds priority responses.' },
];

const demoPoints = [
  { title: 'A 30-minute walkthrough', text: 'Live on a real desk — menu, games, coins, coupons and the customer list, tuned to your business type.' },
  { title: 'Your own demo QR', text: 'We generate a working QR for your counter so you can try the full customer loop yourself.' },
  { title: 'Honest pricing on the call', text: 'We quote for your outlets and volume. No fake discounts, no inflated customer numbers.' },
];

const businessTypes = ['Café', 'Restaurant', 'Salon', 'Spa', 'Hotel', 'Bakery', 'Gym', 'Retail Store', 'Beauty Business', 'Local Business', 'Other'];

const headline: { t: string; grad?: boolean }[][] = [
  [{ t: 'Get More Customers.' }],
  [{ t: 'Bring Them Back.' }],
  [{ t: 'Grow Your Business.', grad: true }],
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
      <Categories />
      <BusinessTypes />
      <Names />
      <What />
      <Why />
      <Features />
      <CustomerSee />
      <How />
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
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:gap-14 sm:px-8 sm:py-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8 lg:py-20">
        <div>
          <motion.p initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }} className="mb-7 inline-flex max-w-full items-center gap-2 rounded-full border border-orange-600/15 bg-white px-3 py-1.5 text-stone-700 shadow-sm sm:px-4">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-600" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] sm:text-[11px] sm:tracking-[0.18em]">AI-powered customer growth platform</span>
          </motion.p>
          <h1 className="font-display text-[2.35rem] font-semibold leading-[1.04] tracking-tight text-stone-950 sm:text-5xl lg:text-[4.4rem]" data-testid="hero-headline">
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
            Turn every customer interaction into an opportunity to grow. From digital business pages and AI review assistance to interactive games, loyalty rewards, and customer engagement tools, Repeat Mate helps your business build lasting customer relationships.
          </motion.p>
          <motion.div initial={reduce ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.8, ease }} className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <button type="button" onClick={openDemo} className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-orange-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-600/30 transition hover:scale-[1.03] hover:bg-orange-700 active:scale-[0.98] sm:w-auto">
              Book a Free Demo
              <Arrow className="transition group-hover:translate-x-1" />
            </button>
            <button type="button" onClick={() => { if (clips.length) setWatch(true); else scrollToId('how'); }} className="group inline-flex w-full items-center justify-center gap-2.5 rounded-full border border-stone-200 bg-white px-6 py-3.5 text-sm font-semibold text-stone-950 transition hover:border-orange-600 sm:w-auto">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-orange-100 text-orange-600 transition group-hover:bg-orange-600 group-hover:text-white">
                <Play />
              </span>
              Watch How It Works
            </button>
          </motion.div>
          <p className="mt-4 max-w-xl text-balance text-sm leading-relaxed text-stone-500">Start Today and Turn Every Customer into a Loyal Customer!</p>
          <p className="mt-2 text-sm text-stone-500">Ready to go live? <Link to="/register" className="font-semibold text-orange-600">Start your business</Link></p>
        </div>
        <HeroStage />
      </div>
    </section>
    {watch && clips.length > 0 && <HowVideoModal videos={clips.map((clip) => ({ ...clip, src: howVideoSrc(false, clip.id) }))} onClose={() => setWatch(false)} />}
    </>
  );
}

function PhoneFrame({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-sm rounded-[28px] border border-stone-200/80 bg-white p-2.5 shadow-[0_30px_70px_rgba(28,25,23,.12)] sm:rounded-[36px] sm:p-3 lg:max-w-none">
      <div className="overflow-hidden rounded-[28px]">{children}</div>
      {footer}
    </div>
  );
}

function FloatCard({ children, className, delay = 0, reduce }: { children: ReactNode; className: string; delay?: number; reduce: boolean | null }) {
  return (
    <motion.div className={className} animate={reduce ? undefined : { y: [0, -10, 0] }} transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut', delay }}>
      {children}
    </motion.div>
  );
}

function HeroStage() {
  const reduce = useReducedMotion();
  return (
    <div className="relative mx-auto h-[30rem] w-full max-w-lg overflow-hidden sm:h-[38rem] sm:overflow-visible">
      <div className="absolute left-1/2 top-6 w-[13.25rem] -translate-x-1/2 sm:top-4 sm:w-[16.5rem]">
        <div className="rounded-[2.4rem] bg-stone-950 p-[0.45rem] shadow-[0_30px_70px_rgba(28,25,23,.28)] ring-1 ring-white/10">
          <div className="relative flex min-h-[26rem] flex-col overflow-hidden rounded-[1.95rem] bg-white sm:min-h-[32rem]">
            <span className="absolute left-1/2 top-2 z-10 h-5 w-[4.5rem] -translate-x-1/2 rounded-full bg-stone-950" aria-hidden="true" />
            <div className="bg-gradient-to-b from-orange-500 via-orange-400 to-amber-200 px-4 pb-10 pt-10 text-white">
              <p className="text-[11px] text-white/80">Chai & Co · Dadar</p>
              <p className="mt-1 font-display text-xl font-semibold sm:text-2xl">Digital menu</p>
            </div>
            <div className="-mt-6 flex flex-1 flex-col px-3 pb-3">
              <div className="space-y-2">
                {[['Masala chai', '₹40'], ['Bun maska', '₹50'], ['Cold coffee', '₹90']].map(([name, price]) => (
                  <div key={name} className="flex items-center justify-between rounded-2xl bg-white px-3 py-2.5 text-sm shadow-sm">
                    <span>{name}</span>
                    <span className="font-semibold text-orange-600">{price}</span>
                  </div>
                ))}
                <div className="rounded-2xl bg-orange-600 px-3 py-3 text-sm font-semibold text-white">Free latte coupon</div>
              </div>
              <div className="mt-auto flex justify-center pt-6">
                <span className="h-1 w-16 rounded-full bg-stone-200" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <FloatCard reduce={reduce} delay={0.2} className="absolute left-[2%] top-[4%] hidden w-24 rounded-2xl border border-stone-200 bg-white p-3 shadow-xl sm:block">
        <div className="grid grid-cols-4 gap-0.5" aria-hidden="true">
          {Array.from({ length: 16 }, (_, index) => <span key={index} className={`h-2.5 w-2.5 rounded-[2px] ${index % 3 === 0 ? 'bg-stone-950' : 'bg-stone-200'}`} />)}
        </div>
        <p className="mt-2 text-[10px] font-semibold text-stone-500">Table QR</p>
      </FloatCard>
      <FloatCard reduce={reduce} delay={0.6} className="absolute right-[2%] top-[3%] w-[9.25rem] rounded-2xl border border-stone-200 bg-white px-3 py-2 shadow-xl sm:right-2 sm:top-4 sm:w-40 sm:py-2.5">
        <p className="text-[10px] font-semibold text-stone-400">Repeat Mate</p>
        <p className="mt-0.5 text-xs font-semibold leading-snug text-stone-950">Your weekday offer is ready</p>
      </FloatCard>
      <FloatCard reduce={reduce} delay={1} className="absolute right-[2%] top-[26%] rounded-full bg-stone-950 px-3 py-2 text-[11px] font-semibold text-white shadow-xl sm:right-1 sm:top-28 sm:text-xs">
        +50 coins · spin wheel
      </FloatCard>
      <FloatCard reduce={reduce} delay={0.4} className="absolute bottom-[7%] left-[2%] w-[5.5rem] rounded-2xl border border-stone-200 bg-white p-2 text-center shadow-xl sm:bottom-10 sm:left-0 sm:w-24 sm:p-3">
        <div className="mx-auto h-10 w-10 rounded-full bg-[conic-gradient(#ea580c_0_25%,#fdba74_0_50%,#c2410c_0_75%,#fff7ed_0_100%)] sm:h-14 sm:w-14" />
        <p className="mt-1.5 text-[10px] font-semibold leading-tight text-stone-600 sm:mt-2">Spin the wheel</p>
      </FloatCard>
      <FloatCard reduce={reduce} delay={1.2} className="absolute bottom-[3%] right-[3%] w-[6.25rem] rounded-2xl border border-stone-200 bg-white p-2 shadow-xl sm:bottom-4 sm:right-2 sm:w-28 sm:p-3">
        <div className="flex h-9 items-end gap-1 sm:h-12" aria-hidden="true">
          {['h-3 sm:h-4', 'h-5 sm:h-7', 'h-4 sm:h-5', 'h-8 sm:h-10', 'h-5 sm:h-6', 'h-6 sm:h-8'].map((height) => <span key={height} className={`w-1.5 rounded-sm bg-orange-500 sm:w-2 ${height}`} />)}
        </div>
        <p className="mt-1.5 text-[10px] font-semibold text-stone-500 sm:mt-2">coins</p>
      </FloatCard>
    </div>
  );
}

function PhoneIcon({ name }: { name: 'call' | 'pin' | 'follow' | 'spin' | 'review' | 'clock' }) {
  const common = { viewBox: '0 0 24 24', className: 'h-4 w-4', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const };
  if (name === 'call') return <svg {...common}><path d="M8 4h3l1 4-2 1a12 12 0 0 0 5 5l1-2 4 1v3a2 2 0 0 1-2 2A16 16 0 0 1 6 6a2 2 0 0 1 2-2z" /></svg>;
  if (name === 'pin') return <svg {...common}><path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z" /><circle cx="12" cy="10" r="2" /></svg>;
  if (name === 'follow') return <svg {...common}><rect x="4" y="4" width="16" height="16" rx="4" /><circle cx="12" cy="12" r="3.5" /><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" /></svg>;
  if (name === 'spin') return <svg {...common}><circle cx="12" cy="12" r="8" /><path d="M12 4v8l5 3" /></svg>;
  if (name === 'review') return <svg {...common}><path d="M12 4 14 9h5l-4 3 1.5 5L12 14l-4.5 3L9 12 5 9h5z" /></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="8" /><path d="M12 8v5l3 2" /></svg>;
}

function CustomerPhone({ active }: { active: number }) {
  const mark = (on: boolean) => on ? 'ring-2 ring-orange-600' : '';
  return (
    <div className="bg-stone-50 text-stone-950">
      <div className="relative bg-gradient-to-b from-orange-500 via-orange-400 to-amber-200 px-4 pb-12 pt-3">
        <span className="mx-auto block h-1.5 w-14 rounded-full bg-stone-950/30" />
      </div>
      <div className="relative -mt-8 space-y-2.5 px-3 pb-4">
        <div className={`rounded-2xl bg-white p-3 shadow-sm ${mark(active === 0)}`}>
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-sm font-bold text-orange-600">C</span>
          <p className="mt-3 font-display text-lg font-semibold leading-tight">Chai & Co</p>
          <p className="text-xs text-stone-500">Café · Dadar</p>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-stone-500"><PhoneIcon name="clock" />Open · 8:00 AM – 10:00 PM</p>
        </div>
        <div className={`grid grid-cols-3 gap-2 rounded-2xl bg-white p-2 shadow-sm ${mark(active === 1)}`}>
          {([['call', 'Call'], ['pin', 'Visit'], ['follow', 'Follow']] as const).map(([icon, label]) => (
            <span key={label} className="grid justify-items-center gap-1 rounded-xl bg-orange-50 py-2 text-[11px] font-semibold text-orange-700">
              <PhoneIcon name={icon} />
              {label}
            </span>
          ))}
        </div>
        <div className={`rounded-2xl bg-orange-600 px-3 py-3 text-white shadow-sm ${mark(active === 4)}`}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange-100">Today's offer</p>
          <p className="mt-1 text-sm font-semibold">Free latte coupon</p>
        </div>
        <div className={`flex items-center justify-between rounded-2xl bg-white px-3 py-3 text-sm shadow-sm ${mark(active === 2 || active === 3)}`}>
          <span className="flex items-center gap-2 font-semibold"><PhoneIcon name="spin" />Spin the wheel</span>
          <span className="text-xs font-semibold text-orange-600">+50 coins</span>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-3 text-sm shadow-sm">
          <span className="flex items-center gap-2 font-semibold"><PhoneIcon name="review" />Leave a review</span>
          <span className="text-xs text-stone-400">Google</span>
        </div>
      </div>
    </div>
  );
}

function LoopFlow({ chain, active, reduce }: { chain: string[]; active: number; reduce: boolean | null }) {
  return (
    <>
      <ol className="relative mt-8 hidden lg:grid lg:gap-4" style={{ gridTemplateColumns: `repeat(${chain.length}, minmax(0, 1fr))` }}>
        <span className="absolute left-[6%] right-[6%] top-5 h-px bg-stone-300" aria-hidden="true" />
        {chain.map((step, index) => {
          const on = index === active;
          return (
            <li key={step} className="relative text-center">
              <span className={`relative z-10 mx-auto grid h-10 w-10 place-items-center rounded-full border text-sm font-semibold ${on ? 'border-orange-600 bg-orange-600 text-white' : 'border-stone-200 bg-white text-stone-500'}`}>{String(index + 1).padStart(2, '0')}</span>
              <span className={`mt-3 block text-sm font-semibold leading-snug ${on ? 'text-orange-600' : 'text-stone-700'}`}>{step}</span>
            </li>
          );
        })}
      </ol>
      <ol className="mt-6 space-y-2 lg:hidden">
        {chain.map((step, index) => {
          const on = index === active;
          return (
            <li key={step} className={`flex items-center gap-3 rounded-2xl border px-3 py-3 ${on ? 'border-orange-600 bg-white' : 'border-stone-200 bg-white'}`}>
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-semibold ${on ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-600'}`}>{String(index + 1).padStart(2, '0')}</span>
              <span className={`min-w-0 text-sm font-semibold leading-snug ${on ? 'text-stone-950' : 'text-stone-600'}`}>{step}</span>
            </li>
          );
        })}
      </ol>
    </>
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
    <section id="business-types" className="bg-white px-5 py-16 sm:px-8 sm:py-20" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="mx-auto grid max-w-7xl items-start gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-14">
        <div>
          <p className="max-w-sm text-sm leading-relaxed text-stone-500">Made for Every Business That Wants More Repeat Customers.</p>
          <AnimatePresence mode="wait">
            <motion.div key={current.id} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: -8 }} transition={{ duration: 0.28, ease }} className="mt-6 rounded-[28px] bg-gradient-to-br from-stone-950 via-stone-900 to-orange-950 p-6 text-white shadow-[0_24px_50px_rgba(28,25,23,.18)]">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-orange-300">{String(active + 1).padStart(2, '0')} / {String(businesses.length).padStart(2, '0')}</p>
              <span className="mt-8 grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-orange-200">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z" strokeLinejoin="round" /></svg>
              </span>
              <h3 className="mt-4 font-display text-2xl font-semibold">{current.label}</h3>
              <p className="mt-2 text-sm text-orange-100">{current.chain[beat % current.chain.length]}</p>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {businesses.map((item, index) => {
            const on = index === active;
            return (
              <button key={item.id} type="button" aria-pressed={on} onClick={() => setActive(index)} className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition hover:-translate-y-0.5 ${on ? 'border-orange-600 bg-orange-50' : 'border-stone-200 bg-white hover:border-orange-200'}`}>
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${on ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-600'}`}>
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z" strokeLinejoin="round" /></svg>
                </span>
                <span className="font-semibold text-stone-950">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-7xl">
        <AnimatePresence mode="wait">
          <motion.div key={current.id} initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: -8 }} transition={{ duration: 0.28, ease }}>
            <p className="px-2 text-center font-mono text-xs font-semibold uppercase leading-relaxed tracking-[0.12em] text-stone-700">The Repeat Mate loop · {current.label}</p>
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
    <section className="bg-orange-50/70 py-4">
      <motion.h2 className="mx-auto max-w-4xl px-5 pt-16 text-center font-display text-3xl font-semibold leading-tight tracking-tight text-stone-950 sm:pt-20 sm:text-4xl lg:text-5xl" initial={reduce ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.6 }} transition={{ duration: 0.6, ease }}>
      Our   <span className="text-orange-600">Happy Customers</span>
      </motion.h2>
      <div className="marquee-hover-pause mt-10 overflow-hidden pb-14" style={{ maskImage: 'linear-gradient(90deg, transparent, black 12%, black 88%, transparent)' }}>
      <div className={`flex items-center ${reduce ? 'flex-wrap justify-center gap-x-8 px-5' : 'landing-marquee w-max'}`} style={{ ['--marquee-duration' as string]: '70s' }}>
        {items.map((name, index) => (
          <span key={`${name}-${index}`} aria-hidden={!reduce && index >= shopNames.length ? true : undefined} className="flex items-center px-8 font-display text-lg font-semibold text-stone-500">
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
        <h2 className="mt-3 max-w-3xl font-display text-3xl font-semibold tracking-tight text-stone-950 sm:text-5xl">One QR code. <span className="text-orange-600">Endless Ways to Grow Your Business</span></h2>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-stone-600">RepeatMate helps businesses attract customers, increase repeat visits, and build lasting relationships through one simple QR code. From digital menus and interactive games to loyalty rewards, AI-powered review assistance, and customer notifications, everything works together to turn first-time visitors into loyal customers.</p>
        <ul className="mt-10 grid grid-cols-1 items-stretch gap-2 min-[420px]:grid-cols-2 lg:grid-cols-5">
          {loop.map((item, index) => {
            const on = index === step;
            return (
              <motion.li key={item} className="min-h-[4.75rem] lg:h-auto" initial={reduce ? false : { opacity: 0, x: (index % 5) - 2 ? ((index % 5) - 2) * 16 : 0, y: 16 }} whileInView={{ opacity: 1, x: 0, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ delay: index * 0.05, duration: 0.45, ease }}>
                <button type="button" aria-pressed={on} onClick={() => pick(index)} className={`relative flex h-full min-h-16 w-full items-center gap-2.5 overflow-hidden rounded-2xl border px-3 py-3 text-left shadow-sm transition hover:-translate-y-0.5 ${on ? 'border-orange-600 text-white shadow-md shadow-orange-600/20' : 'border-stone-200 bg-white text-stone-800'} ${on && reduce ? 'bg-orange-600' : ''}`}>
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
                    <span className="block text-[13px] font-semibold leading-snug sm:text-sm">{item}</span>
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
        <h2 className="mt-3 max-w-3xl font-display text-3xl font-semibold tracking-tight sm:text-5xl">Don't Just Serve Customers. <span className="text-orange-600">Give Them Reasons to Return.</span></h2>
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <article className="rounded-[28px] border border-stone-200 bg-orange-50 p-6 shadow-sm sm:p-8">
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
          <article className="rounded-[28px] border border-orange-600 bg-white p-6 shadow-[0_24px_50px_rgba(234,88,12,.12)] sm:p-8">
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
  if (title === 'Smart Digital Business Profile') return <svg {...common}><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v6h-6v-2h4z" /></svg>;
  if (title === 'Play, Earn & Redeem Rewards') return <svg {...common}><rect x="6" y="6" width="12" height="12" rx="2" /><path d="M9 12h6" /></svg>;
  if (title === 'Customer Coins') return <svg {...common}><circle cx="12" cy="12" r="8" /><path d="M12 8v8M9.5 10.5h4a2 2 0 0 1 0 3h-4" /></svg>;
  if (title === 'Digital Wallet') return <svg {...common}><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M16 15h2" /></svg>;
  if (title === 'Loyalty & Purchase Rewards') return <svg {...common}><path d="M12 3 14.2 7.6 19 8.2l-3.5 3.4.8 4.9L12 14.8 7.7 16.5l.8-4.9L5 8.2l4.8-.6z" /></svg>;
  if (title === 'Coupons & Special Offers') return <svg {...common}><path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" /></svg>;
  if (title === 'Smart Offer Notifications') return <svg {...common}><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2H4.5z" /><path d="M10 19a2 2 0 0 0 4 0" /></svg>;
  if (title === 'Customer CRM') return <svg {...common}><circle cx="9" cy="8" r="3" /><path d="M3 19a6 6 0 0 1 12 0M17 8a3 3 0 1 1 0 6" /></svg>;
  if (title === 'Customer Segmentation') return <svg {...common}><circle cx="8" cy="9" r="3" /><circle cx="16" cy="15" r="3" /></svg>;
  if (title === 'Win-Back Campaigns') return <svg {...common}><path d="M4 12a8 8 0 1 0 2-5.3" /><path d="M4 4v4h4" /></svg>;
  if (title === 'AI Google Review Assistant') return <svg {...common}><path d="M12 4 14 9h5l-4 3 1.5 5L12 14l-4.5 3L9 12 5 9h5z" /></svg>;
  if (title === 'Social Media Engagement') return <svg {...common}><circle cx="6" cy="12" r="2" /><circle cx="16" cy="7" r="2" /><circle cx="16" cy="17" r="2" /><path d="M8 12h6M14.2 8.2 8 11M14.2 15.8 8 13" /></svg>;
  if (title === 'Smart Business Promotions') return <svg {...common}><circle cx="12" cy="12" r="8" /><path d="M12 8v5l3 2" /></svg>;
  return <svg {...common}><path d="M5 19V10M12 19V5M19 19v-7" /></svg>;
}

function FeatureScene({ title }: { title: string }) {
  const shell = 'flex min-h-40 flex-col justify-center rounded-2xl bg-stone-950 p-4 text-white';
  if (title === 'Smart Digital Business Profile') {
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
  if (title === 'Play, Earn & Redeem Rewards') {
    return (
      <div className={`${shell} items-center`}>
        <div className="grid h-24 w-full place-items-center rounded-2xl border border-dashed border-white/30 bg-white/10 text-sm font-semibold">Scratch</div>
        <p className="mt-3 text-xs text-white/50">Play, earn coins, redeem in store</p>
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
  if (title === 'Loyalty & Purchase Rewards') {
    return (
      <div className={shell}>
        <p className="text-xs text-white/50">Bill</p>
        <p className="mt-1 font-display text-3xl font-semibold">₹420</p>
        <p className="mt-2 text-sm text-amber-300">+42 coins on this bill</p>
      </div>
    );
  }
  if (title === 'Coupons & Special Offers') {
    return (
      <div className={shell}>
        <p className="text-xs text-white/50">Weekday offer</p>
        <p className="mt-2 font-display text-3xl font-semibold text-amber-300">20% off</p>
        <p className="mt-1 text-sm text-white/60">Show this at the counter</p>
      </div>
    );
  }
  if (title === 'Smart Offer Notifications') {
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
  if (title === 'AI Google Review Assistant') {
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
  if (title === 'Smart Business Promotions') {
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

const featureRowTitles = ['Smart Digital Business Profile', 'Play, Earn & Redeem Rewards', 'Digital Wallet', 'Coupons & Special Offers', 'AI Google Review Assistant', 'Smart Offer Notifications'];

function Features() {
  const reduce = useReducedMotion();
  const rows = featureRowTitles.map((title) => features.find((item) => item.title === title)).filter((item): item is (typeof features)[number] => Boolean(item));
  const cards = features.filter((item) => !featureRowTitles.includes(item.title));
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hold, setHold] = useState(false);
  useEffect(() => {
    if (reduce || paused || hold) return;
    const id = window.setInterval(() => setActive((value) => (value + 1) % cards.length), 3200);
    return () => window.clearInterval(id);
  }, [reduce, paused, hold, cards.length]);
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
    setActive((value) => (value + delta + cards.length) % cards.length);
    setHold(true);
  }
  return (
    <section id="features" className="scroll-mt-24 px-5 py-16 sm:px-8 lg:py-24" onPointerEnter={(event) => { if (event.pointerType === 'mouse') setPaused(true); }} onPointerLeave={(event) => { if (event.pointerType === 'mouse') setPaused(false); }}>
      <div className="mx-auto max-w-7xl">
        <Eyebrow>Features</Eyebrow>
        <h2 className="mt-3 max-w-3xl font-display text-3xl font-semibold tracking-tight sm:text-5xl">Everything that happens after the scan.</h2>
        <div className="mt-14 space-y-16 lg:space-y-24">
          {rows.map((feature, index) => {
            const flip = index % 2 === 1;
            return (
              <div key={feature.title} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
                <div className={flip ? 'lg:order-2' : undefined}>
                  <h3 className="font-display text-2xl font-semibold tracking-tight text-stone-950 sm:text-3xl">{feature.title}</h3>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-stone-600 sm:text-base">{feature.text}</p>
                </div>
                <div className={flip ? 'lg:order-1' : undefined}>
                  <PhoneFrame>
                    <FeatureScene title={feature.title} />
                  </PhoneFrame>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-16 flex items-center justify-between gap-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-orange-600">{String(active + 1).padStart(2, '0')} / {String(cards.length).padStart(2, '0')}</p>
          <div className="flex gap-2">
            <button type="button" aria-label="Previous feature" onClick={() => step(-1)} className="grid h-9 w-9 place-items-center rounded-full border border-stone-200 bg-white text-stone-700 transition hover:border-orange-600 hover:text-orange-600">
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M12 5 7 10l5 5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button type="button" aria-label="Next feature" onClick={() => step(1)} className="grid h-9 w-9 place-items-center rounded-full border border-stone-200 bg-white text-stone-700 transition hover:border-orange-600 hover:text-orange-600">
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M8 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        </div>
        <div className="relative mt-4 h-1 overflow-hidden rounded-full bg-orange-50">
          {!reduce && !paused && !hold && (
            <motion.span key={cards[active]?.title} className="absolute inset-y-0 left-0 bg-orange-600" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 3.2, ease: 'linear' }} />
          )}
        </div>
        <div className="mt-4 grid items-stretch gap-3 sm:grid-cols-2">
          {cards.map((card, index) => {
            const on = index === active;
            return (
              <button key={card.title} type="button" aria-pressed={on} onClick={() => pick(index)} onPointerEnter={(event) => { if (event.pointerType === 'mouse') setActive(index); }} className={`relative flex h-full flex-col overflow-hidden rounded-[28px] border p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 ${on ? 'border-orange-600 text-white shadow-lg shadow-orange-600/20' : 'border-stone-200 bg-white'} ${on && reduce ? 'bg-orange-600' : ''}`}>
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
    </section>
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
    <PhoneFrame footer={(
      <div className="mt-4 flex gap-1.5 px-1">
        {steps.map((step, index) => (
          <button key={step.label} type="button" aria-label={step.title} onClick={() => pick(index)} className={`h-1.5 rounded-full ${index === active ? 'flex-[1.6] bg-orange-600' : 'flex-1 bg-stone-200'}`} />
        ))}
      </div>
    )}>
      <CustomerPhone active={active} />
    </PhoneFrame>
  );
  return (
    <section id="how" className="scroll-mt-24 bg-orange-50/50 px-5 py-16 sm:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <Eyebrow>How it works</Eyebrow>
        <h2 className="mt-3 max-w-3xl text-balance font-display text-2xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
          SCAN → DISCOVER → ENGAGE → EARN → <span className="text-orange-600">RETURN</span>
        </h2>
        <p className="mt-4 max-w-xl text-stone-600">One QR Code. Your Entire Business in One Place.</p>
        <div className="mt-10 grid items-start gap-10 lg:mt-14 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
          <ol>
            {steps.map((step, index) => {
              const on = index === active;
              return (
                <li key={step.label}>
                  <button type="button" onClick={() => pick(index)} className={`flex w-full gap-4 text-left ${index === steps.length - 1 ? '' : 'pb-8'}`}>
                    <span className="relative flex w-10 shrink-0 justify-center">
                      {index < steps.length - 1 && <span className={`absolute top-10 bottom-0 w-px ${index < active ? 'bg-orange-600' : 'bg-stone-300'}`} aria-hidden="true" />}
                      <span className={`relative z-10 grid h-10 w-10 place-items-center rounded-full border text-sm font-semibold ${on ? 'border-orange-600 bg-orange-600 text-white' : 'border-stone-200 bg-white text-stone-500'}`}>{String(index + 1).padStart(2, '0')}</span>
                    </span>
                    <span className="min-w-0 pt-1">
                      <span className={`block font-mono text-[11px] font-semibold tracking-[0.16em] ${on ? 'text-orange-600' : 'text-stone-400'}`}>{step.label}</span>
                      <span className={`mt-1 block font-semibold leading-snug ${on ? 'text-stone-950' : 'text-stone-700'}`}>{step.title}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-stone-500">{step.text}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="mx-auto w-full max-w-sm lg:sticky lg:top-24">{phone}</div>
        </div>
      </div>
    </section>
  );
}

function Categories() {
  const reduce = useReducedMotion();
  const big = reduce ? categories : [...categories, ...categories];
  const thin = reduce ? loop : [...loop, ...loop];
  return (
    <section className="overflow-hidden bg-stone-950 py-14 text-white sm:py-16" data-testid="target-categories-marquee">
      <div className="px-5 text-center">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-orange-300">Businesses we serve</p>
      </div>
      <div className="marquee-hover-pause mt-8 overflow-hidden">
        <div className={`flex items-center ${reduce ? 'flex-wrap justify-center gap-x-6 gap-y-3 px-5' : 'landing-marquee w-max gap-8 pr-8'}`} style={{ ['--marquee-duration' as string]: '48s' }}>
          {big.map((item, index) => (
            <span key={`${item}-${index}`} aria-hidden={!reduce && index >= categories.length ? true : undefined} className="flex items-center gap-6 font-display text-4xl font-semibold tracking-tight sm:gap-8 sm:text-7xl">
              <span className={index % 2 ? 'text-transparent' : 'text-white'} style={index % 2 ? { WebkitTextStroke: '1.5px #fdba74' } : undefined}>{item}</span>
              <span className="text-3xl text-orange-500 sm:text-4xl" aria-hidden="true">•</span>
            </span>
          ))}
        </div>
      </div>
      <div className="marquee-hover-pause mt-8 overflow-hidden border-y border-white/10 py-3">
        <div className={`flex items-center ${reduce ? 'flex-wrap justify-center gap-4 px-5' : 'landing-marquee w-max gap-8 pr-8'}`} style={{ ['--marquee-duration' as string]: '36s' }}>
          {thin.map((item, index) => (
            <span key={`${item}-${index}`} aria-hidden={!reduce && index >= loop.length ? true : undefined} className="flex items-center gap-8 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-200">
              {item}
              <span aria-hidden="true">+</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

const customerSeeTitles = ['Smart Digital Business Profile', 'Play, Earn & Redeem Rewards', 'Digital Wallet', 'Coupons & Special Offers', 'AI Google Review Assistant', 'Smart Offer Notifications'];

function CustomerSee() {
  const reduce = useReducedMotion();
  const rows = customerSeeTitles.map((title) => features.find((item) => item.title === title)).filter((item): item is (typeof features)[number] => Boolean(item));
  const [active, setActive] = useState(0);
  const item = rows[active];
  return (
    <section className="bg-[radial-gradient(ellipse_at_top,#fff7ed,#fff_55%)] px-5 py-16 sm:px-8 lg:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-stone-950 sm:text-5xl">See what your customers see.</h2>
          <ol className="mt-8 divide-y divide-stone-200 border-y border-stone-200">
            {rows.map((row, index) => {
              const on = index === active;
              return (
                <li key={row.title}>
                  <button type="button" onClick={() => setActive(index)} className="w-full py-4 text-left" aria-pressed={on}>
                    <span className="flex items-baseline gap-3 sm:gap-4">
                      <span className={`shrink-0 font-mono text-[11px] ${on ? 'text-orange-600' : 'text-stone-400'}`}>{String(index + 1).padStart(2, '0')}</span>
                      <span className={`min-w-0 font-display text-base font-semibold leading-snug sm:text-xl ${on ? 'text-stone-950' : 'text-stone-500'}`}>{row.title}</span>
                    </span>
                    {on && <span className="mt-2 block pl-9 text-sm leading-relaxed text-stone-600">{row.text}</span>}
                    {on && <span className="mt-3 block h-0.5 w-24 bg-orange-600" />}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
        <PhoneFrame>
          <AnimatePresence mode="wait">
            <motion.div key={item.title} initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: -10 }} transition={{ duration: 0.28 }}>
              <FeatureScene title={item.title} />
            </motion.div>
          </AnimatePresence>
        </PhoneFrame>
      </div>
    </section>
  );
}

function Pricing() {
  const reduce = useReducedMotion();
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
          <Eyebrow>Pricing Plan</Eyebrow>
          <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
            One QR Code. More Engagement.
            <span className="mt-1 block text-orange-600">More Repeat Customers.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-stone-600">Choose the perfect plan for your business. Attract customers, reward loyalty, and encourage repeat visits with Repeat Mate.</p>
        </div>
        <div className="mx-auto mt-10 grid max-w-4xl items-stretch gap-4 pt-4 sm:grid-cols-2">
          {plans.map((plan, index) => {
            const yearlyOnly = 'yearlyOnly' in plan && plan.yearlyOnly;
            const price = plan.monthly === 0 ? 'Talk to us' : `₹${plan.monthly.toLocaleString('en-IN')}`;
            const note = plan.monthly === 0 ? '' : yearlyOnly ? '/year' : '/month';
            const on = index === active;
            return (
              <article key={plan.id} onPointerEnter={(event) => { if (event.pointerType === 'mouse') setActive(index); }} onClick={() => pick(index)} className={`relative flex h-full cursor-pointer flex-col rounded-[28px] border bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 ${on ? 'border-2 border-orange-600 shadow-[0_24px_50px_rgba(234,88,12,.12)]' : 'border-stone-200'}`}>
                {plan.popular && <p className="absolute -top-3 left-6 rounded-full bg-orange-600 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">Most popular</p>}
                <h3 className="font-display text-xl font-semibold">{plan.name}</h3>
                <p className="mt-1 text-sm text-stone-500">{plan.blurb}</p>
                <p className="mt-5 flex flex-wrap items-baseline gap-x-2 text-3xl font-semibold">
                  {price}
                  <span className="text-base font-normal text-stone-400">{note}</span>
                </p>
                <ul className="mt-5 space-y-2 text-sm text-stone-600">{plan.features.map((item) => <li key={item} className="flex gap-2"><span className="mt-0.5 text-orange-600" aria-hidden="true">✓</span><span>{item}</span></li>)}</ul>
                {'to' in plan && plan.to ? (
                  <Link to={plan.to} className={`mt-auto inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold transition ${on ? 'bg-orange-600 text-white hover:bg-orange-700' : 'border border-orange-600 bg-white text-orange-600 hover:bg-orange-50'}`}>{plan.cta}</Link>
                ) : (
                  <button type="button" onClick={openDemo} className={`mt-auto inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold transition ${on ? 'bg-orange-600 text-white hover:bg-orange-700' : 'border border-orange-600 bg-white text-orange-600 hover:bg-orange-50'}`}>{plan.cta}</button>
                )}
              </article>
            );
          })}
        </div>
        <div className="mx-auto mt-16 max-w-3xl overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-orange-50/70">
                <th className="px-4 py-4 font-medium text-stone-500 sm:px-6">Included</th>
                <th className="w-24 px-2 py-4 text-center font-semibold text-stone-950 sm:w-32">Starter</th>
                <th className="w-24 px-2 py-4 text-center font-semibold text-orange-600 sm:w-32">Business</th>
              </tr>
            </thead>
            <tbody>
              {compare.map((row, index) => (
                <tr key={row.label} className={`border-b border-stone-100 last:border-0 ${index % 2 ? 'bg-orange-50/40' : 'bg-white'}`}>
                  <td className="px-4 py-3.5 font-medium leading-snug text-stone-800 sm:px-6">{row.label}</td>
                  <td className="px-2 py-3.5 text-center"><Mark value={row.starter} /></td>
                  <td className="px-2 py-3.5 text-center"><Mark value={row.growth} /></td>
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
  if (!value) {
    return (
      <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-stone-100 text-stone-400" aria-label="Not included">
        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" /></svg>
      </span>
    );
  }
  return (
    <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-orange-50 text-orange-600" aria-label="Included">
      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M5 10.5 8.2 14 15 6.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </span>
  );
}

function Faq() {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="scroll-mt-24 bg-orange-50/40 px-5 py-16 sm:px-8 lg:py-24">
      <div className="mx-auto max-w-3xl">
        <Eyebrow>FAQ</Eyebrow>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-5xl">Questions from the counter.</h2>
        <div className="mt-8 overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm">
          {faqs.map((item, index) => {
            const on = open === index;
            return (
              <motion.div key={item.q} className={`relative border-b border-stone-200 last:border-b-0 ${on ? 'bg-white' : ''}`} initial={reduce ? false : { opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ delay: Math.min(index, 6) * 0.05, duration: 0.4, ease }}>
                {on && !reduce && <motion.span layoutId="faq-mark" className="absolute bottom-3 left-0 top-3 w-0.5 rounded-full bg-orange-600" transition={{ type: 'spring', bounce: 0.18, duration: 0.4 }} />}
                {on && reduce && <span className="absolute bottom-3 left-0 top-3 w-0.5 rounded-full bg-orange-600" />}
                <button type="button" className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left sm:gap-4 sm:px-5 sm:py-5" aria-expanded={on} onClick={() => setOpen(on ? -1 : index)}>
                  <span className="font-semibold leading-snug text-stone-950">{item.q}</span>
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
            <h2 className="mt-3 max-w-3xl font-display text-3xl font-semibold tracking-tight sm:text-5xl">See RepeatMate Transform <span className="text-orange-600">your business.</span></h2>
            <p className="mt-4 max-w-2xl text-stone-600">Thirty minutes. Your own demo QR. Exact pricing for your size. No pressure, no spam.</p>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <a href="mailto:repeatmate@gmail.com" className="inline-flex items-center rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-950">repeatmate@gmail.com</a>
            <a href="tel:+919296756289" className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700">+91 92967 56289</a>
          </div>
        </div>
        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-8">
          <div className="space-y-4">
            <div className="rounded-[28px] border border-stone-200 bg-white p-2 shadow-sm">
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
            <article className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-orange-600">Write to us</p>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">1, Niwas, Civil Line Buxar, Buxar, Bihar – 802101, India</p>
              <p className="mt-1 text-sm leading-relaxed text-stone-600">Operating from Civil Lines, Prayagraj, Uttar Pradesh, India. WebGrow.store.</p>
              <p className="mt-2 text-sm text-stone-500">We reply on business days.</p>
            </article>
          </div>
          <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_24px_50px_rgba(28,25,23,.06)] sm:p-8 lg:sticky lg:top-24">
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
                  <select value={form.businessType} onChange={(event) => update('businessType', event.target.value)} className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-orange-50 px-3 py-3 text-base text-stone-950 outline-none focus:border-orange-600 sm:text-sm">
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
      <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-orange-50 px-3 py-3 text-base text-stone-950 outline-none placeholder:text-stone-400 focus:border-orange-600 sm:text-sm" />
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
