/** Reviews, FAQs and blog fixtures mirroring DB_SCHEMA §10 (compliance-safe copy). */
import type { BlogPost, BlogPostSummary, Faq, Review } from '@/api/types';
import { DISCLAIMER } from './catalog';

const desk = { id: 1, slug: 'dawnlit-desk', name: 'Dawnlit Desk — 10,000 lux desk lamp' };
const panel = { id: 2, slug: 'dawnlit-panel', name: 'Dawnlit Panel — large 10,000 lux panel' };
const go = { id: 3, slug: 'dawnlit-go', name: 'Dawnlit Go — portable travel lamp' };

const day = (n: number) => new Date(Date.UTC(2026, 9, 14 - n, 5, 0, 0)).toISOString();

export const reviews: Review[] = [
  {
    id: 1,
    product: desk,
    rating: 5,
    title: 'Part of my morning now',
    body: 'I switch it on with my first coffee. It helps me feel more awake during early calls.',
    author_name: 'Priya S.',
    verified_purchase: true,
    created_at: day(2),
  },
  {
    id: 2,
    product: desk,
    rating: 5,
    title: 'Bright but comfortable',
    body: 'Even, soft light — no glare on my screen. Easy to fit into my routine.',
    author_name: 'Neha K.',
    verified_purchase: false,
    created_at: day(4),
  },
  {
    id: 3,
    product: desk,
    rating: 5,
    title: 'Great for dark winter mornings',
    body: 'Delhi winters are grey; this makes my desk feel like a sunny window.',
    author_name: 'Rohan M.',
    verified_purchase: false,
    created_at: day(6),
  },
  {
    id: 4,
    product: desk,
    rating: 5,
    title: 'Looks premium',
    body: 'Solid build, the timer is handy and the warm-neutral setting is lovely.',
    author_name: 'Ananya R.',
    verified_purchase: false,
    created_at: day(9),
  },
  {
    id: 5,
    product: desk,
    rating: 4,
    title: 'Does what it says',
    body: 'Helps me keep a consistent start to the day. Wish the cable was longer.',
    author_name: 'Karthik V.',
    verified_purchase: false,
    created_at: day(12),
  },
  {
    id: 6,
    product: desk,
    rating: 4,
    title: 'Nice addition to WFH setup',
    body: 'I use it for 15 minutes while answering emails. Feels like a calmer start.',
    author_name: 'Sneha P.',
    verified_purchase: false,
    created_at: day(15),
  },
  {
    id: 7,
    product: panel,
    rating: 4,
    title: 'Fills the room',
    body: 'Big, even glow. I read next to it every morning.',
    author_name: 'Vikram J.',
    verified_purchase: false,
    created_at: day(5),
  },
  {
    id: 8,
    product: panel,
    rating: 4,
    title: 'Floor stand is worth it',
    body: 'Positioned it beside my yoga mat. A bright, energising start.',
    author_name: 'Meera D.',
    verified_purchase: false,
    created_at: day(10),
  },
  {
    id: 9,
    product: panel,
    rating: 5,
    title: 'My studio loves it',
    body: 'Clean daylight that makes early mornings feel easier.',
    author_name: 'Aditya N.',
    verified_purchase: false,
    created_at: day(18),
  },
  {
    id: 10,
    product: go,
    rating: 4,
    title: 'Perfect for travel',
    body: 'Runs off my power bank in hotel rooms. Small and sturdy.',
    author_name: 'Farhan A.',
    verified_purchase: false,
    created_at: day(3),
  },
  {
    id: 11,
    product: go,
    rating: 3,
    title: 'Good, but small',
    body: 'Works well up close; I have to sit nearer than with a desk lamp.',
    author_name: 'Ishita G.',
    verified_purchase: false,
    created_at: day(8),
  },
  {
    id: 12,
    product: go,
    rating: 5,
    title: 'Shift-work companion',
    body: 'Helps me feel alert at the start of a late shift. The case is great.',
    author_name: 'Priya S.',
    verified_purchase: true,
    created_at: day(1),
  },
];

export const faqs: Faq[] = [
  {
    id: 1,
    category: 'usage',
    sort_order: 1,
    question: 'What does 10,000 lux mean?',
    answer_md:
      'Lux measures how much light reaches a surface. A typical living room is around 100–300 lux; a bright sunny morning outdoors can exceed 10,000 lux. Dawnlit lamps deliver 10,000 lux at the recommended distance.',
  },
  {
    id: 2,
    category: 'usage',
    sort_order: 2,
    question: 'How long should I use it each day?',
    answer_md:
      'Most people build a routine of 10–30 minutes in the morning. Start with 10 minutes and adjust to what feels comfortable.',
  },
  {
    id: 3,
    category: 'usage',
    sort_order: 3,
    question: 'How far should I sit from the lamp?',
    answer_md:
      'Desk: 30–40 cm. Panel: 45–55 cm. Go: 20–25 cm. Position it slightly to the side of your line of sight.',
  },
  {
    id: 4,
    category: 'usage',
    sort_order: 4,
    question: 'What is the best time of day to use it?',
    answer_md:
      'Within an hour or two of waking works well for most routines. Avoid bright light late in the evening.',
  },
  {
    id: 5,
    category: 'safety',
    sort_order: 1,
    question: 'Is it a medical device?',
    answer_md: `No. Dawnlit lamps are designed for daily wellness routines. ${DISCLAIMER}`,
  },
  {
    id: 6,
    category: 'safety',
    sort_order: 2,
    question: 'Is it UV-free and safe for my eyes?',
    answer_md:
      "Dawnlit uses diffused, UV-free LEDs. Don't stare directly into the lamp, and ask your doctor if you have an eye condition.",
  },
  {
    id: 7,
    category: 'product',
    sort_order: 1,
    question: 'Which colour temperature should I choose?',
    answer_md:
      '5500K Daylight suits most people. 6500K Cool feels crisp for focus-heavy mornings; 4000K Warm-neutral feels softer.',
  },
  {
    id: 8,
    category: 'shipping',
    sort_order: 1,
    question: 'How long does delivery take?',
    answer_md:
      'Usually 2–7 days depending on your pincode. Enter your pincode at checkout to see the estimate. Shipping is free above ₹999.',
  },
  {
    id: 9,
    category: 'payments',
    sort_order: 1,
    question: 'Is cash on delivery available?',
    answer_md: 'Yes, for eligible pincodes on orders up to ₹10,000, with a ₹49 COD fee.',
  },
  {
    id: 10,
    category: 'returns',
    sort_order: 1,
    question: 'What is your return and warranty policy?',
    answer_md: '30-day returns and a 12-month warranty on every lamp.',
  },
];

const author = 'Dawnlit Team';
const footer = `\n\n*${DISCLAIMER}*`;

export const blogPosts: BlogPost[] = [
  {
    id: 1,
    slug: 'morning-light-routine-for-desk-workers',
    title: 'Morning light routine for desk workers',
    excerpt:
      'A simple 15-minute routine that brings bright light into your first hour at the desk.',
    cover_image_url: null,
    cover_image_alt: null,
    author_name: author,
    tags: ['routine', 'work-from-home'],
    published_at: '2026-09-20T03:30:00Z',
    reading_time_minutes: 4,
    body_md: `Our bodies follow a roughly 24-hour rhythm that responds to light.[^1] For many desk workers, mornings are spent indoors under dim light.\n\n## A 15-minute routine\n1. Switch on your lamp with your first drink.\n2. Sit 30–40 cm away, slightly to the side.\n3. Answer emails or plan your day for 10–15 minutes.\n\n[^1]: NIH NIGMS, "Circadian Rhythms" fact sheet.${footer}`,
    seo: {
      title: 'Morning light routine for desk workers',
      description: 'A simple 15-minute bright-light routine for your first hour at the desk.',
      og_image_url: null,
    },
    updated_at: '2026-09-20T03:30:00Z',
  },
  {
    id: 2,
    slug: 'what-is-lux',
    title: 'What is lux? Understanding light intensity in everyday life',
    excerpt: 'From candlelight to a sunny morning: how lux works and why 10,000 lux matters.',
    cover_image_url: null,
    cover_image_alt: null,
    author_name: author,
    tags: ['science'],
    published_at: '2026-09-12T03:30:00Z',
    reading_time_minutes: 5,
    body_md: `Lux measures illuminance — light arriving on a surface.[^1]\n\n| Setting | Approx. lux |\n|---|---|\n| Living room | 100–300 |\n| Office | 300–500 |\n| Overcast day | 1,000+ |\n| Sunny morning | 10,000+ |\n\n[^1]: Harvard Health Publishing.${footer}`,
    seo: {
      title: 'What is lux?',
      description: 'How light intensity is measured and how indoor light compares with daylight.',
      og_image_url: null,
    },
    updated_at: '2026-09-12T03:30:00Z',
  },
  {
    id: 3,
    slug: 'ten-minutes-of-bright-light-busy-mornings',
    title: 'How to fit 10 minutes of bright light into a busy morning',
    excerpt: 'Stack your light session onto habits you already have.',
    cover_image_url: null,
    cover_image_alt: null,
    author_name: author,
    tags: ['routine'],
    published_at: '2026-09-05T03:30:00Z',
    reading_time_minutes: 3,
    body_md: `Habit stacking makes routines stick.[^1] Pair your lamp with breakfast, journaling or your commute prep.\n\n[^1]: Sleep Foundation, "Light and sleep".${footer}`,
    seo: {
      title: '10 minutes of bright light on busy mornings',
      description: 'Practical ways to stack a short bright-light session onto your morning.',
      og_image_url: null,
    },
    updated_at: '2026-09-05T03:30:00Z',
  },
  {
    id: 4,
    slug: 'building-a-consistent-daily-rhythm',
    title: 'Light, screens and evenings: building a consistent daily rhythm',
    excerpt: 'Bright mornings and dimmer evenings help you keep a steady daily rhythm.',
    cover_image_url: null,
    cover_image_alt: null,
    author_name: author,
    tags: ['science', 'evening'],
    published_at: '2026-08-28T03:30:00Z',
    reading_time_minutes: 6,
    body_md: `Consistency matters: similar wake times, bright mornings and dimmer evenings.[^1][^2]\n\n[^1]: NIH NIGMS, "Circadian Rhythms".\n[^2]: Sleep Foundation.${footer}`,
    seo: {
      title: 'Building a consistent daily rhythm',
      description: 'How bright mornings, screens and evening light fit into a steady daily rhythm.',
      og_image_url: null,
    },
    updated_at: '2026-08-28T03:30:00Z',
  },
];

export const blogSummaries: BlogPostSummary[] = blogPosts.map(
  ({ body_md: _b, seo: _s, updated_at: _u, ...summary }) => summary,
);
