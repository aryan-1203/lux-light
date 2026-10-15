import { Menu, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink } from 'react-router-dom';
import { BRAND_NAME } from '@/config/brand';
import { paths } from '@/config/paths';
import { Button, cn, Container, Icon, Logo } from '@/design-system';
import { useSession } from '@/features/auth/hooks';
import { useUIStore } from '@/stores/ui';
import CartButton from './CartButton';
import { primaryNav } from './navItems';

/** Sticky header: transparent over the hero, solid surface once scrolled. */
export default function Header() {
  const { t } = useTranslation('common');
  const { isAuthenticated } = useSession();
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen);
  const mobileNavOpen = useUIStore((s) => s.mobileNavOpen);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let frame = 0;
    const read = () => {
      frame = 0;
      setScrolled(window.scrollY > 8);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-header border-b transition-[background-color,border-color] duration-ui ease-out pt-safe',
        scrolled ? 'border-border bg-bg/85 backdrop-blur-md' : 'border-transparent bg-transparent',
      )}
    >
      <Container className="flex h-header items-center justify-between gap-4">
        <Link
          to={paths.home()}
          className="-ml-1 inline-flex min-h-touch items-center rounded-full px-1"
          aria-label={t('header.homeLabel', { brand: BRAND_NAME })}
        >
          <Logo />
        </Link>

        <nav aria-label={t('nav.primary')} className="hidden md:block">
          <ul className="flex items-center gap-1">
            {primaryNav.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'inline-flex min-h-touch items-center rounded-full px-4 font-display text-sm font-medium transition-colors duration-fast',
                      isActive ? 'bg-surface-2 text-fg' : 'text-muted hover:text-fg',
                    )
                  }
                >
                  {t(item.labelKey)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="icon">
            <Link
              to={isAuthenticated ? paths.account() : paths.login()}
              aria-label={isAuthenticated ? t('header.account') : t('header.login')}
            >
              <Icon icon={UserRound} />
            </Link>
          </Button>
          <CartButton />
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={t('header.openMenu')}
            aria-expanded={mobileNavOpen}
            aria-haspopup="dialog"
            onClick={() => setMobileNavOpen(true)}
          >
            <Icon icon={Menu} />
          </Button>
        </div>
      </Container>
    </header>
  );
}
