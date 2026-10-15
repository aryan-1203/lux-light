import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/dm-sans';
import './styles/globals.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ensureCsrfToken } from '@/api/client';
import App from './App';

/** MSW only when VITE_API_MOCK=true (dynamic import → absent from the production bundle path). */
async function enableMocking(): Promise<void> {
  if (import.meta.env.VITE_API_MOCK !== 'true') return;
  const { worker } = await import('./mocks/browser');
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js' },
    quiet: true,
  });
}

void enableMocking().then(() => {
  // Issue the CSRF cookie early so the first mutation doesn't pay for it (PLAN §1.3).
  ensureCsrfToken().catch(() => undefined);
  const root = document.getElementById('root');
  if (!root) throw new Error('#root missing');
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
