import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { paths } from '@/config/paths';
import { cn, Drawer, Icon } from '@/design-system';
import { useSession } from '@/features/auth/hooks';
import { useUIStore } from '@/stores/ui';
import { primaryNav } from './navItems';

/** Phone navigation drawer (focus-trapped dialog). */
export default function MobileNav() {
  const { t } = useTranslation('common');
  const open = useUIStore((s) => s.mobileNavOpen);
  const setOpen = useUIStore((s) => s.setMobileNavOpen);
  const { isAuthenticated } = useSession();
  const close = () => setOpen(false);

  const secondary = [
    {
      to: isAuthenticated ? paths.account() : paths.login(),
      label: isAuthenticated ? t('header.account') : t('header.login'),
    },
    { to: paths.track(), label: t('nav.track') },
    { to: paths.faq(), label: t('nav.faq') },
    { to: paths.contact(), label: t('nav.contact') },
  ];

  return (
    <Drawer open={open} onOpenChange={setOpen} side="left" title={t('nav.menu')}>
      <nav aria-label={t('nav.primary')}>
        <ul className="flex flex-col">
          {primaryNav.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onClick={close}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-[3.5rem] items-center justify-between border-b border-border font-display text-2xl font-semibold',
                    isActive ? 'text-sunrise-strong' : 'text-fg',
                  )
                }
              >
                {t(item.labelKey)}
                <Icon icon={ArrowRight} className="text-muted" />
              </NavLink>
            </li>
          ))}
        </ul>
        <ul className="mt-6 flex flex-col">
          {secondary.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onClick={close}
                className="flex min-h-touch items-center text-base text-muted hover:text-fg"
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </Drawer>
  );
}
