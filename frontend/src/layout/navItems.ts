import { paths } from '@/config/paths';

/** Primary navigation (labels are common:nav.* keys). */
export const primaryNav = [
  { to: paths.shop(), labelKey: 'nav.shop' },
  { to: paths.science(), labelKey: 'nav.science' },
  { to: paths.quiz(), labelKey: 'nav.quiz' },
  { to: paths.blog(), labelKey: 'nav.blog' },
] as const;
