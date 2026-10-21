import { useEffect } from 'react';

export const siteSeo = {
  name: 'RepeatMate',
  title: 'RepeatMate | Turn Every Customer into a Repeat Customer',
  description:
    'RepeatMate helps restaurants, cafés, hotels, salons, retail stores, and local businesses attract customers and encourage repeat visits with digital QR menus, AI-powered Google review assistance, Play & Earn games, loyalty rewards, and special offers. Build customer loyalty, strengthen relationships, and grow your business with smart digital solutions.',
  tagline: 'AI-Powered Customer Engagement & Loyalty Platform',
  headline: 'Turn Every Customer into a Repeat Customer with RepeatMate.',
  aboutTitle: 'About Us | RepeatMate — Helping Local Businesses Turn Customers into Repeat Customers',
  aboutDescription:
    'RepeatMate is an all-in-one customer engagement and loyalty platform that helps local businesses attract customers, build lasting relationships, and encourage repeat visits with digital QR menus, AI review assistance, Play & Earn games, and loyalty rewards.',
};

export const aboutContent = {
  eyebrow: 'About Us',
  headline: 'Helping Local Businesses Turn Customers into Repeat Customers',
  intro: [
    'RepeatMate is an all-in-one customer engagement and loyalty platform designed to help local businesses attract customers, build lasting relationships, and encourage repeat visits.',
    'We believe that getting a customer is just the beginning. The real growth happens when customers return, engage with your business, and choose you again and again.',
    'That’s why we created RepeatMate—a digital platform that brings customer engagement, loyalty rewards, digital QR menus, AI-powered review assistance, interactive games, and promotional offers together in one place. Our goal is to make modern customer engagement simple, accessible, and effective for businesses of all sizes.',
  ],
  whatTitle: 'What Does RepeatMate Do?',
  whatLead: 'RepeatMate helps businesses create digital experiences that keep customers connected with their brand. Our platform offers tools to help businesses:',
  whatItems: [
    { title: 'Digital QR Menus', text: 'Let customers explore your menu or product list by scanning a QR code.' },
    { title: 'AI-Powered Google Review Assistance', text: 'Help customers write genuine reviews with AI-generated suggestions based on their actual experiences.' },
    { title: 'Play & Earn Games', text: 'Engage customers through interactive games and reward-based experiences.' },
    { title: 'Digital Loyalty Rewards', text: 'Encourage repeat visits with coins, rewards, and redemption options.' },
    { title: 'Coupons & Special Offers', text: 'Share promotions to encourage purchases and customer engagement.' },
    { title: 'Customer Engagement', text: 'Build stronger relationships with customers through available digital engagement and promotional tools.' },
  ],
  whatClose: 'By bringing these features together, RepeatMate helps businesses create more engaging customer experiences beyond a single transaction.',
  whoTitle: 'Who Can Use RepeatMate?',
  whoLead: 'RepeatMate is designed for local businesses that want to improve customer engagement and encourage repeat business. Our platform can support:',
  whoItems: [
    'Restaurants and cafés',
    'Hotels and food businesses',
    'Bakeries and sweet shops',
    'Salons and beauty parlours',
    'Retail stores and local shops',
    'Other customer-facing businesses',
  ],
  whoClose: 'Whether you run a small local shop or a growing restaurant, RepeatMate helps you explore digital tools to strengthen customer relationships.',
  missionTitle: 'Our Mission',
  mission: [
    'Our mission is to make customer engagement and loyalty tools accessible to local businesses. We want to help businesses move beyond one-time transactions by creating meaningful digital experiences that encourage customers to return.',
    'By combining QR technology, interactive rewards, and customer engagement tools, we aim to make business growth simpler and more accessible.',
  ],
  whyTitle: 'Why Choose RepeatMate?',
  whyItems: [
    { title: 'One Platform, Multiple Solutions', text: 'Access a range of customer engagement tools through one platform, depending on your selected plan and available features.' },
    { title: 'Simple QR-Based Experiences', text: 'Make it easier for customers to discover your digital menu, rewards, and offers by scanning a QR code.' },
    { title: 'Designed for Local Businesses', text: 'Our approach focuses on the everyday needs of restaurants, cafés, shops, and other customer-facing businesses.' },
    { title: 'Encourage Repeat Visits', text: 'Use loyalty rewards, interactive experiences, and promotional offers to give customers more reasons to return.' },
    { title: 'Digital Customer Engagement', text: 'Create opportunities to connect with customers beyond their first visit and build stronger relationships over time.' },
  ],
  visionTitle: 'Our Vision',
  vision: [
    'We envision a future where every local business can use digital technology to build customer loyalty, improve engagement, and grow sustainably.',
    'RepeatMate is committed to helping businesses create better customer experiences—one interaction, one reward, and one repeat visit at a time.',
  ],
  growTitle: 'Grow Your Business with RepeatMate',
  grow: [
    'Your customers are more than transactions. They are relationships waiting to grow.',
    'With RepeatMate, you can create engaging digital experiences that help customers discover your business, interact with your brand, and find more reasons to come back.',
  ],
  closing: 'RepeatMate — Get More Customers. Bring Them Back. Grow Your Business.',
  cta: 'Ready to improve customer engagement and build customer loyalty? Explore RepeatMate and discover a smarter way to connect with your customers.',
};

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

/** Sets document title, description, Open Graph, Twitter, and canonical for the current page. */
export function usePageSeo(opts: { title?: string; description?: string; path?: string } = {}) {
  const title = opts.title
    ? (opts.title.includes('|') ? opts.title : `${opts.title} | ${siteSeo.name}`)
    : siteSeo.title;
  const description = opts.description || siteSeo.description;
  const path = opts.path;

  useEffect(() => {
    const previous = document.title;
    document.title = title;
    upsertMeta('name', 'description', description);
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:site_name', siteSeo.name);
    const origin = window.location.origin;
    const url = `${origin}${path ?? window.location.pathname}`;
    upsertMeta('property', 'og:url', url);
    upsertLink('canonical', url);
    return () => {
      document.title = previous;
    };
  }, [title, description, path]);
}
