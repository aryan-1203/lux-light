/** Promo rules mirroring DB_SCHEMA §10.1 (WELCOME10, SUNRISE500). */
export type PromoFixture = {
  code: string;
  title: string;
  discount_type: 'percentage' | 'flat';
  percent_off: number | null;
  amount_off_paise: number | null;
  max_discount_paise: number | null;
  min_order_paise: number;
  usage_limit_total: number | null;
  usage_limit_per_user: number | null;
  first_order_only: boolean;
  stackable: boolean;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
};

export const promos: PromoFixture[] = [
  {
    code: 'WELCOME10',
    title: '10% off your first order',
    discount_type: 'percentage',
    percent_off: 10,
    amount_off_paise: null,
    max_discount_paise: 50000,
    min_order_paise: 199900,
    usage_limit_total: null,
    usage_limit_per_user: 1,
    first_order_only: true,
    stackable: true,
    starts_at: '2026-09-30T04:30:00Z',
    ends_at: null,
    is_active: true,
  },
  {
    code: 'SUNRISE500',
    title: '₹500 off orders above ₹4,999',
    discount_type: 'flat',
    percent_off: null,
    amount_off_paise: 50000,
    max_discount_paise: null,
    min_order_paise: 499900,
    usage_limit_total: 1000,
    usage_limit_per_user: 1,
    first_order_only: false,
    stackable: false,
    starts_at: '2026-09-30T04:30:00Z',
    ends_at: '2027-03-31T18:29:59Z',
    is_active: true,
  },
];
