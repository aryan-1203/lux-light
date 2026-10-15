import { ShieldAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useLocation } from 'react-router-dom';
import type { UserRole } from '@/api/types';
import { paths } from '@/config/paths';
import { Button, Container, EmptyState } from '@/design-system';
import RouteFallback from '@/layout/RouteFallback';
import { useSession } from './hooks';

/**
 * Guards a subtree (PLAN §4.2): guests → /login?next=<current>; role mismatch → 403 view.
 */
export default function RequireAuth(props: {
  roles?: UserRole[];
  children: ReactNode;
}): JSX.Element {
  const { t } = useTranslation('common');
  const { user, isLoading } = useSession();
  const location = useLocation();

  if (isLoading) return <RouteFallback />;
  if (!user) {
    return <Navigate to={paths.login(`${location.pathname}${location.search}`)} replace />;
  }
  if (props.roles && !props.roles.includes(user.role)) {
    return (
      <Container className="py-section">
        <EmptyState
          icon={ShieldAlert}
          tone="error"
          headingLevel={2}
          title={t('forbidden.title')}
          description={t('forbidden.description')}
          action={
            <Button asChild variant="secondary">
              <Link to="/">{t('actions.backHome')}</Link>
            </Button>
          }
        />
      </Container>
    );
  }
  return <>{props.children}</>;
}
