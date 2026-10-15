import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/** Browser worker — started by main.tsx only when VITE_API_MOCK=true. */
export const worker = setupWorker(...handlers);
