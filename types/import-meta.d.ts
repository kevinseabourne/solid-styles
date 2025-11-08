/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly ENABLE_DEBUG_LOGGING?: string;
  // Add more custom env variables as needed
  // Note: MODE is already defined by Vite's types as required string
}
