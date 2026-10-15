import { Link } from 'react-router-dom';
import { Container, Heading, Logo, Text } from '@/design-system';
import Seo from '@/layout/Seo';

/**
 * ★ Phase-2 stub (owner: 9 Admin). Mounted at /admin/* inside <RequireAuth roles={['staff','admin']}>
 * (routes.tsx), outside the storefront AppShell. Define nested <Routes> here.
 */
export default function AdminApp() {
  return (
    <>
      <Seo title="Admin" description="Store administration" noindex />
      <Container className="py-section">
        <Link to="/" className="inline-flex min-h-touch items-center">
          <Logo />
        </Link>
        <Heading level={1} className="mt-8">
          Admin
        </Heading>
        <Text tone="muted" className="mt-2">
          The admin dashboard is built in Phase 3.
        </Text>
      </Container>
    </>
  );
}
