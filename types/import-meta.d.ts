/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MODE?: string;
  readonly ENABLE_DEBUG_LOGGING?: string;
  // Add more env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
