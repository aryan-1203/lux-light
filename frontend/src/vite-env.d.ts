/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_MOCK?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_ENABLE_3D?: string;
  readonly VITE_GA_ID?: string;
  readonly VITE_META_PIXEL_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
