import type { UserProfile } from '@/api/types';

/** DB_SCHEMA §10 users (passwords are the documented dev defaults; mocks accept them as-is). */
export const users: Array<UserProfile & { password: string }> = [
  {
    id: 1,
    email: 'admin@dawnlit.in',
    full_name: 'Store Admin',
    phone: null,
    role: 'admin',
    email_verified: true,
    has_password: true,
    marketing_opt_in: false,
    created_at: '2026-09-01T04:30:00Z',
    password: 'ChangeMe!2026',
  },
  {
    id: 2,
    email: 'staff@dawnlit.in',
    full_name: 'Store Staff',
    phone: null,
    role: 'staff',
    email_verified: true,
    has_password: true,
    marketing_opt_in: false,
    created_at: '2026-09-01T04:30:00Z',
    password: 'ChangeMe!2026',
  },
  {
    id: 3,
    email: 'priya.demo@example.com',
    full_name: 'Priya Sharma',
    phone: '+919800000001',
    role: 'customer',
    email_verified: true,
    has_password: true,
    marketing_opt_in: true,
    created_at: '2026-09-10T04:30:00Z',
    password: 'DemoPass!2026',
  },
  {
    id: 4,
    email: 'arjun.demo@example.com',
    full_name: 'Arjun Rao',
    phone: '+919800000002',
    role: 'customer',
    email_verified: true,
    has_password: true,
    marketing_opt_in: false,
    created_at: '2026-09-12T04:30:00Z',
    password: 'DemoPass!2026',
  },
];

export function publicUser(u: UserProfile & { password?: string }): UserProfile {
  const { password: _pw, ...rest } = u;
  return rest;
}
