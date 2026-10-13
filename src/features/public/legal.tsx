import { ReactNode } from 'react';
import { Link, NavLink, Navigate } from 'react-router-dom';
import { Marketing } from '../../components/layout/Shells';
import { legalNav } from './legal-nav';

const email = 'repeatmate@gmail.com';
const phone = '+91 92967 56289';
const phoneHref = 'tel:+919296756289';

function Mail() {
  return <a className="font-semibold text-orange-600" href={`mailto:${email}`}>{email}</a>;
}

function Phone() {
  return <a className="font-semibold text-orange-600" href={phoneHref}>{phone}</a>;
}

function H({ children }: { children: ReactNode }) {
  return <h2 className="pt-4 text-base font-semibold text-stone-950">{children}</h2>;
}

function Ul({ items }: { items: string[] }) {
  return <ul className="list-disc space-y-1 pl-5">{items.map((item) => <li key={item}>{item}</li>)}</ul>;
}

function Contact() {
  return <p>Email <Mail />. Phone <Phone />.</p>;
}

const policies: Record<string, { title: string; body: ReactNode }> = {
  privacy: {
    title: 'Privacy Policy',
    body: (
      <>
        <p>Welcome to Repeat Mate, a digital engagement and customer loyalty platform operated under the WebGrow.store business brand. Repeat Mate provides businesses with digital menus, QR codes, games, loyalty programmes, digital coins, offers, customer tools, and analytics.</p>
        <p>This policy explains how personal information may be collected, used, stored, shared, and deleted when customers and businesses use Repeat Mate. By using the platform, you acknowledge this policy. Where separate consent is legally required, we will ask for it separately.</p>
        <p>Repeat Mate is the product brand and WebGrow.store is the operating brand. The registered enterprise name is taken from the Udyam certificate and is not assumed to be either brand name. Udyam registration number: UDYAM-BR-09-0023798. Official enterprise address: 1, Niwas, Civil Line Buxar, Buxar, Bihar – 802101, India. Operating location: Civil Lines, Prayagraj, Uttar Pradesh, India.</p>
        <H>Information we collect</H>
        <p>Account information may include your name, email address, mobile number, login details, and preferences. Business information may include the business name and category, contact details, menu items and prices, profile details, offers and reward settings, and subscription status.</p>
        <p>Customer engagement information may include QR menu interactions, game participation, coins and loyalty points, reward balances and redemptions, coupon use, preferences, and campaign engagement. Technical information may include IP address, browser and device details, operating system, usage and diagnostic logs, and security events.</p>
        <p>We may also keep cookie preferences, notification permissions, marketing preferences, consent timestamps and policy versions, and requests to access, correct, or delete information. Subscription and transaction information may be processed by Repeat Mate and payment providers. Card details should be handled by secured payment providers rather than stored by Repeat Mate.</p>
        <H>How we use information</H>
        <Ul items={[
          'Create and manage customer and business accounts.',
          'Provide digital menus and QR-based services.',
          'Operate games, loyalty programmes, and rewards.',
          'Maintain coin balances and redemption records.',
          'Process subscriptions and payments.',
          'Send service messages, and promotional notifications where permitted.',
          'Provide support, detect fraud, and protect accounts.',
          'Improve the platform and keep records the law requires.',
        ]} />
        <H>Business owners</H>
        <p>Businesses using Repeat Mate may collect personal information through menus, games, offers, rewards, and registration. They must use that information lawfully. Repeat Mate and the business may have separate responsibilities. Neither party should assume that every privacy duty belongs to the other.</p>
        <H>Sharing</H>
        <p>Information may be shared when reasonably necessary with hosting and storage providers, payment providers, notification providers, analytics and security providers, the business running the relevant programme, authorised personnel, professional advisers, and government authorities when legally required. We do not sell personal information as a standalone product.</p>
        <H>Cookies, security, and retention</H>
        <p>Repeat Mate may use cookies for login sessions, security, preferences, and site function. Optional cookies are not used on this site today. See the <Link className="font-semibold text-orange-600" to="/cookies">Cookie Policy</Link>.</p>
        <p>We use reasonable technical and organisational measures, which may include access controls, authentication, secure communications, backups, and monitoring. No online system can guarantee absolute security.</p>
        <p>Personal information is kept only as long as reasonably necessary for the service, contracts, security, disputes, and legal requirements, then deleted or anonymised unless the law requires us to keep it.</p>
        <H>Your rights</H>
        <p>Subject to applicable law, you may ask to access your information, correct it, delete eligible information, withdraw consent where processing relies on consent, and raise a privacy complaint. Customers can delete an account from the profile page, or write to <Mail />.</p>
        <H>Children and updates</H>
        <p>Repeat Mate is not intended to collect children’s personal information without the authorisation the law requires. Business owners must make sure games, rewards, and forms suit their audience.</p>
        <p>We may update this policy when services, practices, or legal requirements change. The revised version is published here with a new effective date.</p>
        <H>Contact</H>
        <Contact />
      </>
    ),
  },
  terms: {
    title: 'Terms and Conditions',
    body: (
      <>
        <p>These terms govern use of Repeat Mate. By accessing, registering, purchasing, or using the services, you agree to the terms that apply. If you do not agree, do not use the services.</p>
        <p>Repeat Mate is software that lets businesses offer digital QR menus, profile pages, games, loyalty points and digital coins, rewards, coupons, notifications, customer tools, analytics, and other features on the plan they buy.</p>
        <H>Business accounts</H>
        <p>Business owners must give accurate information and keep their accounts secure. They are responsible for activity on the account, staff access, menus and prices, lawful offers, reward rules, customer permissions, and lawful use of customer information.</p>
        <H>Games, coins, and rewards</H>
        <p>Each business sets its own games, points, coins, reward values, offers, and redemption rules, including whether coins are offered, how they are earned, any redemption value, discounts, minimum balances, expiry, eligibility, limits, and whether the owner must approve a redemption. Repeat Mate does not guarantee a universal cash value for coins or points. Customers should ask the business about its rewards.</p>
        <H>Offers and acceptable use</H>
        <p>The business is responsible for the accuracy, availability, and fulfilment of its products, services, and offers. Repeat Mate provides the technology. It does not automatically become the seller of every participating business’s products. This does not remove any duty the law places on Repeat Mate.</p>
        <p>Users must not hack or disrupt the platform, manipulate games or rewards, create fraudulent accounts or claims, upload unlawful content, misuse personal information, attempt unauthorised access, bypass security, or use the platform unlawfully. We may investigate misuse and restrict access where reasonably necessary.</p>
        <H>Intellectual property and availability</H>
        <p>Repeat Mate’s software, branding, interface, and platform materials are protected by intellectual property law. Business owners keep ownership of their original content, subject to third-party rights and the permissions needed to run the service.</p>
        <p>We aim to keep the service reliable. Maintenance, technical problems, internet failures, hosting outages, and third-party interruptions may affect access. We may revise these terms when services or legal requirements change, and will communicate material changes where the law or a contract requires it.</p>
        <H>Contact</H>
        <Contact />
      </>
    ),
  },
  refunds: {
    title: 'Refund and Cancellation Policy',
    body: (
      <>
        <p>Repeat Mate provides digital software, subscriptions, and platform access to businesses. Review the plan, duration, features, and charges before you pay.</p>
        <p>Under our standard commercial policy, payments for subscriptions and digital services are non-refundable. A refund is not ordinarily given because a customer changes their mind, decides not to use the service, no longer needs the features, does not use the service during the period, or buys a plan without reviewing it.</p>
        <p>Once a purchase is completed, the customer cannot cancel that purchase under our standard policy. The service stays subject to the agreed period and these terms.</p>
        <p>Automatic renewal applies only where it has been clearly disclosed and authorised. If automatic renewal is not enabled, a new subscription is required after expiry.</p>
        <p>Duplicate charges, unauthorised transactions, and services not supplied as the law requires will be reviewed under applicable law. Nothing in this policy removes a refund, cancellation, or other right that cannot legally be excluded under Indian law.</p>
        <H>Payment support</H>
        <Contact />
      </>
    ),
  },
  cookies: {
    title: 'Cookie Policy',
    body: (
      <>
        <p>Cookies are small files stored on a device when someone visits a website. Similar technologies can remember preferences, keep a session, and support the site.</p>
        <p>Repeat Mate uses essential cookies so you can stay signed in and so the site can stay secure. This site does not set analytics or marketing cookies, so there is no optional-tracker banner. If that changes, optional cookies will stay off until the consent the law requires is given, and this page will be updated.</p>
        <H>Categories</H>
        <Ul items={[
          'Essential cookies support login sessions and security. They may operate without extra consent where the law allows.',
          'Preference, analytics, and marketing cookies are not used on this site today.',
        ]} />
        <p>You can control cookies in your browser. Blocking essential cookies may stop sign-in from working. A third-party service that a business connects, such as a map or a review link, may use its own cookies under that provider’s policy.</p>
        <H>Contact</H>
        <p>Email <Mail />.</p>
      </>
    ),
  },
  loyalty: {
    title: 'Loyalty Points, Coins, and Redemption',
    body: (
      <>
        <p>Repeat Mate lets each business configure its own games, points, coins, offers, and rewards. A business may offer no rewards, or set how many coins a customer can earn, whether coins have a redemption value, the discounts available, minimum balances, limits, expiry, eligibility, and whether a person at the counter must approve the redemption.</p>
        <p>Repeat Mate does not guarantee that coins or points have a fixed cash value. Unless the business says otherwise, coins and points are not cash, bank deposits, or a currency you can spend everywhere.</p>
        <p>Customers follow the conditions that business shows. Questions about value, eligibility, expiry, or redemption go to the business that issued the reward. Repeat Mate can help with technical problems on the platform.</p>
        <p>A business may change its programme from the desk, subject to the law and promises already made to customers. Fraudulent play, unauthorised coin changes, duplicate claims, or abuse may lead to the account or reward being restricted after review.</p>
        <H>Contact</H>
        <p>Email <Mail />.</p>
      </>
    ),
  },
  'notification-policy': {
    title: 'Customer Consent and Notifications',
    body: (
      <>
        <p>Repeat Mate can send notifications about offers, menu items, loyalty rewards, events, and other updates from a business.</p>
        <p>Where permission is required, a customer must consent before promotional messages are sent on that channel. Browser push also needs the browser’s own permission. Accepting cookies does not authorise promotional notifications.</p>
        <p>Messages may include new offers, reward updates, menu announcements, events, and service notices. The business that sends a message is responsible for its content, who receives it, and for not sending unlawful or misleading promotions.</p>
        <p>Customers can turn notifications off in the browser, or stop them where the site offers that control. Promotional messages must stop after consent is withdrawn where the law requires it. Businesses should send relevant messages at a reasonable frequency.</p>
        <H>Contact</H>
        <p>Email <Mail />.</p>
      </>
    ),
  },
  'data-deletion': {
    title: 'Data Deletion Policy',
    body: (
      <>
        <p>Customers may ask for deletion of personal information, subject to the law and records that must be kept.</p>
        <p>A signed-in customer can delete the account from the profile page. That starts removal of the account from active use. Shops may keep visit history needed for their own records. You can also write to <Mail />.</p>
        <H>What the process may include</H>
        <Ul items={[
          'Checking that the request comes from the account holder.',
          'Deleting or anonymising eligible personal information.',
          'Removing the account from active systems.',
          'Scheduling removal of eligible information from backups.',
          'Telling relevant service providers where that is appropriate.',
        ]} />
        <p>Some information may be kept to meet the law, keep financial records, handle disputes, prevent fraud, or defend legal claims. Where a business collected the information, that business may have its own duties. Repeat Mate will help according to its role.</p>
        <p>Requests are handled within the time the law requires. Where no deadline is set, they are handled within a reasonable period.</p>
        <H>Contact</H>
        <Contact />
      </>
    ),
  },
  disclaimer: {
    title: 'Disclaimer',
    body: (
      <>
        <p>Repeat Mate provides digital tools, including menus, QR codes, games, loyalty, rewards, offers, and engagement features. It does not independently run every participating business.</p>
        <p>Business owners are responsible for the information, prices, promotions, rewards, and services they publish, including menus, availability, discounts, coins, game settings, redemption rules, contact details, and hours.</p>
        <p>Reward values and game settings are chosen by the business. A business may offer no rewards, limited rewards, or rewards of a particular value. Customers should contact that business about offers, approvals, or disputes. Repeat Mate does not guarantee that a business will honour a reward beyond the law or the commitments that business made.</p>
        <p>The business is responsible for the quality, safety, legality, availability, delivery, and fulfilment of its products and services. Nothing here removes a liability the law places on Repeat Mate.</p>
        <p>We aim for reliable service and do not guarantee uninterrupted access, error-free operation, or compatibility with every device. External hosting, analytics, notifications, payments, and review platforms have their own terms. Repeat Mate does not guarantee higher sales, retention, reviews, or revenue.</p>
        <p>To the extent the law allows, Repeat Mate is not responsible for losses caused only by inaccurate business content, promotions the business configured, a business failing to honour its offers, or the quality of that business’s products. This does not exclude liability that cannot legally be excluded.</p>
        <H>Contact</H>
        <Contact />
      </>
    ),
  },
  billing: {
    title: 'Subscription and Billing Policy',
    body: (
      <>
        <p>Repeat Mate offers subscription access to digital tools for businesses. Features, prices, periods, and limits are shown on the pricing page or at checkout.</p>
        <p>The subscription fee is due before paid access, unless another arrangement is agreed. The amount charged is the price disclosed at checkout, including taxes where required.</p>
        <p>Once a subscription purchase is completed, it cannot be cancelled under our standard policy. Review the plan, price, duration, and features before you pay. Mandatory legal rights remain. Subscription payments are non-refundable under our standard policy, subject to remedies the law requires. See the <Link className="font-semibold text-orange-600" to="/refunds">Refund and Cancellation Policy</Link>.</p>
        <p>A subscription stays active for the period you bought. After expiry, paid features may be restricted until renewal. Renewal is automatic only when that has been clearly disclosed and authorised. Otherwise you buy a new period to continue.</p>
        <p>If a payment fails, paid features may be delayed or suspended until the payment is resolved, subject to the law. Prices for future purchases or renewals may change, and customers will be told before a change takes effect where that is required. Business owners keep billing details accurate and review the plan they selected.</p>
        <H>Payment support</H>
        <Contact />
      </>
    ),
  },
  availability: {
    title: 'Platform Availability and Maintenance',
    body: (
      <>
        <p>Repeat Mate aims to provide reliable access. Uninterrupted availability is not guaranteed. The service may be unavailable because of scheduled maintenance, emergency security updates, hosting or server failures, internet problems, third-party outages, security incidents, or events beyond our reasonable control.</p>
        <p>We may maintain, upgrade, and change the service to improve performance, security, or function. Where reasonably practical, we will give notice of planned maintenance that materially affects customers.</p>
        <p>Unless a separate written service-level agreement says otherwise, Repeat Mate does not guarantee a particular uptime percentage. We use reasonable measures to protect customer information during maintenance. This does not remove legal duties about data security or service delivery.</p>
      </>
    ),
  },
  'third-parties': {
    title: 'Third-Party Services',
    body: (
      <>
        <p>Repeat Mate may rely on third parties for cloud hosting and databases, image storage, payment gateways, push notifications, analytics, email, review platforms, and social links. Those services may change, restrict access, suffer outages, or stop. That can affect Repeat Mate features.</p>
        <p>You may need to follow the terms and privacy policies of an integrated service. Links to business websites and review platforms are outside our control, and we do not guarantee their content or privacy practices.</p>
        <p>This policy does not remove duties the law places on Repeat Mate for third-party providers, personal information, or services we supply.</p>
      </>
    ),
  },
  'business-responsibilities': {
    title: 'Business Owner Responsibilities',
    body: (
      <>
        <p>Business owners must keep names and contact details accurate, menus and prices correct, offers clearly explained, and reward rules displayed accurately. Products and services must comply with the law. Images and other uploads must be used with the right permission.</p>
        <p>Owners set their own games, reward structures, coin values, redemption requirements, coupon periods, discounts, and eligibility. Repeat Mate does not set a universal cash value for coins or points. The business that issues an offer is responsible for fulfilling it. Customers should contact that business about its products, prices, offers, or redemptions.</p>
        <p>Owners must not use Repeat Mate to promote unlawful products, fraudulent offers, or deceptive promotions. Repeat Mate may investigate suspected misuse and restrict access where reasonably necessary to protect the platform, users, or businesses, subject to the law and the contract.</p>
      </>
    ),
  },
  'content-policy': {
    title: 'User Content and Intellectual Property',
    body: (
      <>
        <p>Business owners keep ownership of their original content, subject to third-party rights. By uploading content, an owner allows Repeat Mate to host, store, display, reproduce, and process that content as reasonably needed to provide the service. That permission is limited to operating, maintaining, securing, and improving the relevant services.</p>
        <p>Owners must have the rights to upload what they upload. They must not upload material that infringes copyright, trademark, privacy, or other rights. Repeat Mate may restrict or remove content that appears unlawful, infringes rights, threatens security, or breaks these terms, subject to the law.</p>
        <p>To report infringement, email <Mail /> with your name and contact details, what the content is, which rights are affected, and the information needed to look into the complaint.</p>
      </>
    ),
  },
  'account-security': {
    title: 'Account Security',
    body: (
      <>
        <p>You are responsible for your password and access to your account. Report suspected compromise, unauthorised access, or suspicious activity promptly to <Mail />.</p>
        <p>Repeat Mate may use authentication controls, access restrictions, monitoring, and other reasonable measures. Where reasonably necessary, we may investigate suspected fraud, breaches, or unauthorised activity. Users must cooperate with those checks and must not try to bypass access controls.</p>
      </>
    ),
  },
  'security-incidents': {
    title: 'Data Breach and Security Incidents',
    body: (
      <>
        <p>Repeat Mate keeps reasonable procedures for identifying, assessing, and responding to suspected security incidents that involve personal information.</p>
        <p>Depending on the incident and the law, the response may include investigating, containing the effects, securing systems, assessing who is affected, notifying people or authorities where required, and taking steps to reduce the chance of a repeat. Reportable incidents are handled in the time and manner the law requires.</p>
        <p>Customers and business owners should report a suspected incident to <Mail />.</p>
      </>
    ),
  },
  complaints: {
    title: 'Complaints',
    body: (
      <>
        <p>Write to <Mail /> or call <Phone />. Include your name and contact details, the account or business if relevant, a description of the issue, and any transaction reference. Do not send passwords or unnecessary sensitive information.</p>
        <p>We review complaints and respond within the time the law requires. If a complaint needs investigation, we may ask for more information.</p>
        <p>For a dispute about a business’s food, products, prices, offers, or rewards that business configured, contact that business as well. Repeat Mate reviews complaints about its own platform. Nothing here stops you from using a statutory right or approaching an authority.</p>
      </>
    ),
  },
  'prohibited-use': {
    title: 'Prohibited Use',
    body: (
      <>
        <p>Do not use Repeat Mate to commit fraud, manipulate games or balances, create unauthorised accounts or false claims, distribute malware, interfere with servers or databases, collect personal information unlawfully, send promotions without permission, upload unlawful or infringing content, misrepresent a business or a reward, bypass subscription or payment controls, or break the law.</p>
        <p>Where a violation is reasonably suspected, Repeat Mate may investigate, restrict features, or suspend access. Any action stays subject to the law and the contract.</p>
      </>
    ),
  },
  'force-majeure': {
    title: 'Force Majeure',
    body: (
      <>
        <p>Repeat Mate is not responsible for a failure or delay to the extent it is caused directly by events beyond reasonable control, such as natural disasters, floods, fires, government restrictions, widespread internet or telecom failures, major hosting failures, war, civil unrest, or comparable events.</p>
        <p>We will take reasonable steps to limit the effects and restore the service where practical. This does not remove duties the law requires us to meet.</p>
      </>
    ),
  },
  'service-changes': {
    title: 'Service Changes and Discontinuation',
    body: (
      <>
        <p>Repeat Mate may modify, update, replace, or discontinue features for technical, security, legal, or business reasons. Where a change materially affects a paid service, we will give notice where that is reasonably practical and required by law or contract.</p>
        <p>This clause is not used to avoid mandatory contractual or consumer duties. Where continued service becomes impossible, the contract and the law decide the remedies.</p>
      </>
    ),
  },
  liability: {
    title: 'Limitation of Liability and Indemnity',
    body: (
      <>
        <p>To the extent the law allows, Repeat Mate is not responsible for indirect or consequential losses where that exclusion can be enforced. Use of the platform is not a guarantee of higher revenue, retention, reviews, or sales.</p>
        <p>A business owner remains responsible for their products, services, published offers, reward conditions, and lawful use of customer information. To the extent the law allows, a business owner may be responsible for reasonable losses, claims, and expenses arising from their unlawful conduct, infringement of third-party rights, fraud, or a material breach of the agreement. This does not make a customer responsible for losses caused by Repeat Mate’s own breach of non-excludable duties.</p>
        <p>Nothing in these terms excludes or limits a liability or consumer right that cannot legally be excluded or limited.</p>
      </>
    ),
  },
  'governing-law': {
    title: 'Governing Law and Disputes',
    body: (
      <>
        <p>These policies are intended to be read under the laws of India. If a dispute arises, the parties should first try to resolve it in good faith. If that fails, it may go to the court, commission, or other authority that has jurisdiction. Nothing here removes a mandatory consumer protection or statutory remedy.</p>
      </>
    ),
  },
  'subscription-access': {
    title: 'Subscription Access and Expiry',
    body: (
      <>
        <p>Paid features follow the plan the business bought. When a subscription expires, paid features may be restricted or turned off. Expiry does not by itself mean that all customer data is deleted immediately. Data is kept, made available, deleted, or anonymised according to the retention policy, the contract, and the law.</p>
        <p>Where an export is available, business owners should export what they need before access ends. Any export, retention period, or access after expiry will be described in the plan or the service agreement. Turning an expired account back on may require a valid subscription and depends on whether the data is still available.</p>
      </>
    ),
  },
  'game-integrity': {
    title: 'Loyalty Programme and Game Integrity',
    body: (
      <>
        <p>Business owners configure their games, reward conditions, and promotions. Games do not guarantee that every participant receives a reward unless the rules say so.</p>
        <p>Repeat Mate may use reasonable technical controls against automated abuse, duplicate claims, manipulation, and unauthorised rewards. Owners must make sure games, contests, rewards, and promotions comply with the law. Features that involve paid entry, cash prizes, wagering, or other regulated activity must not be turned on unless they have been assessed for legal compliance.</p>
        <p>The participating business is responsible for providing the rewards it offers, subject to the terms shown to customers and the law.</p>
      </>
    ),
  },
  'data-retention': {
    title: 'Data Retention and Backups',
    body: (
      <>
        <p>Repeat Mate keeps personal information for the service, security, disputes, and legal duties, and deletes or anonymises it when it is no longer needed unless the law requires it to be kept. Account details, orders, plays, claims, and reward records are kept while the account or the shop relationship is active and for a reasonable period afterwards for those purposes.</p>
        <p>Where personal information is in backups, eligible information is removed on the backup cycle. Until then, backups stay protected. When a business closes its account or a subscription expires, its data is handled under the contract, the stated retention period, and the law. Information needed for legal compliance, accounting, security, or disputes may be kept where the law allows or requires it.</p>
      </>
    ),
  },
  'legal-contact': {
    title: 'Contact Us',
    body: (
      <>
        <p>For questions about Repeat Mate, subscriptions, digital menus, games, loyalty rewards, data privacy, or technical support, contact the team.</p>
        <Ul items={[
          'Product brand: Repeat Mate',
          'Operating brand: WebGrow.store',
          `Email: ${email}`,
          `Phone: ${phone}`,
          'Official enterprise address: 1, Niwas, Civil Line Buxar, Buxar, Bihar – 802101, India',
          'Operating location: Civil Lines, Prayagraj, Uttar Pradesh, India',
          'Udyam registration number: UDYAM-BR-09-0023798',
        ]} />
        <p>The registered enterprise name is the name on the Udyam certificate. It is not inferred from the product or operating brand. For a particular business’s offers, prices, games, products, or rewards, contact that business as well.</p>
        <Contact />
      </>
    ),
  },
};

export function LegalPage({ slug }: { slug: string }) {
  const policy = policies[slug];
  if (!policy) return <Navigate to="/privacy" replace />;
  return (
    <Marketing>
      <section className="px-5 py-10 lg:py-14">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <nav aria-label="Policies" className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">Policies</p>
            <div className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:pb-0">
              {legalNav.map((link) => (
                <NavLink key={link.to} to={link.to} className={({ isActive }) => `block shrink-0 rounded-xl px-3 py-2 text-sm ${isActive ? 'bg-orange-100 font-semibold text-orange-700' : 'text-stone-600 hover:bg-orange-50'}`}>{link.label}</NavLink>
              ))}
            </div>
          </nav>
          <article className="max-w-3xl space-y-3 text-sm leading-relaxed text-stone-600">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">Version 1.0 · Effective 10 October 2026</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-stone-950">{policy.title}</h1>
            {policy.body}
          </article>
        </div>
      </section>
    </Marketing>
  );
}
