/// <reference types="vite/client" />
//
interface ImportMetaEnv {
  readonly VITE_EXAMLIST_SERVICE: string;
  readonly VITE_DOWNLOAD_SERVICE: string;
  readonly VITE_CACHE_SERVICE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
