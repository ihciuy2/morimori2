/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KEEPA_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}